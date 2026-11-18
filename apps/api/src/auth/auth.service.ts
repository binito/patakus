import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const BCRYPT_ROUNDS = 12;
const GOOGLE_PROVIDER = 'google';

type GoogleTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

type GoogleUserInfo = {
  sub: string;
  email: string;
  email_verified?: boolean;
  name?: string;
};

type OAuthAccountRow = {
  userId: string;
};

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!user || !user.active) throw new UnauthorizedException('Credenciais inválidas');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException('Credenciais inválidas');

    return this.issueTokens(user);
  }

  createGoogleAuthorizationUrl(state: string) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = this.getGoogleRedirectUri();

    if (!clientId || !redirectUri) {
      throw new BadRequestException('Google OAuth não está configurado');
    }

    const authorizationUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authorizationUrl.searchParams.set('client_id', clientId);
    authorizationUrl.searchParams.set('redirect_uri', redirectUri);
    authorizationUrl.searchParams.set('response_type', 'code');
    authorizationUrl.searchParams.set('scope', 'openid email profile');
    authorizationUrl.searchParams.set('state', state);
    authorizationUrl.searchParams.set('prompt', 'select_account');

    return authorizationUrl.toString();
  }

  async loginWithGoogleCode(code: string, inviteToken?: string) {
    const profile = await this.exchangeGoogleCodeForProfile(code);
    if (inviteToken) {
      const user = await this.acceptInvitationWithOAuth(inviteToken, profile);
      return this.issueTokens(user);
    }
    const user = await this.findOrCreateOAuthUser(profile);
    return this.issueTokens(user);
  }

  async refresh(rawRefreshToken: string) {
    const tokenHash = hashToken(rawRefreshToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!stored || stored.expiresAt < new Date() || !stored.user.active) {
      throw new UnauthorizedException('Sessão expirada, por favor inicie sessão novamente');
    }

    // Rotate: delete old token, issue new pair
    await this.prisma.refreshToken.delete({ where: { id: stored.id } });
    return this.issueTokens(stored.user);
  }

  async logout(rawRefreshToken: string | undefined) {
    if (!rawRefreshToken) return;
    const tokenHash = hashToken(rawRefreshToken);
    await this.prisma.refreshToken.deleteMany({ where: { tokenHash } }).catch(() => {});
  }

  async validateUser(userId: string) {
    return this.prisma.user.findUnique({ where: { id: userId } });
  }

  private getGoogleRedirectUri() {
    return (
      process.env.GOOGLE_REDIRECT_URI ||
      (process.env.API_URL ? `${process.env.API_URL.replace(/\/$/, '')}/auth/oauth/google/callback` : undefined)
    );
  }

  private async exchangeGoogleCodeForProfile(code: string): Promise<GoogleUserInfo> {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = this.getGoogleRedirectUri();

    if (!clientId || !clientSecret || !redirectUri) {
      throw new BadRequestException('Google OAuth não está configurado');
    }

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
        code,
      }),
    });

    const tokenData = (await tokenResponse.json()) as GoogleTokenResponse;
    if (!tokenResponse.ok || !tokenData.access_token) {
      throw new UnauthorizedException(
        tokenData.error_description || tokenData.error || 'Não foi possível autenticar com Google',
      );
    }

    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = (await userInfoResponse.json()) as GoogleUserInfo;

    if (!userInfoResponse.ok || !profile.sub || !profile.email) {
      throw new UnauthorizedException('Não foi possível obter o perfil do Google');
    }
    if (profile.email_verified === false) {
      throw new UnauthorizedException('O email da conta Google ainda não foi verificado');
    }

    return profile;
  }

  private async findOrCreateOAuthUser(profile: GoogleUserInfo) {
    const email = profile.email.toLowerCase().trim();
    const name = profile.name?.trim() || email;

    const linkedAccounts = await this.prisma.$queryRaw<OAuthAccountRow[]>`
      SELECT userId
      FROM oauth_accounts
      WHERE provider = ${GOOGLE_PROVIDER} AND providerUserId = ${profile.sub}
      LIMIT 1
    `;

    if (linkedAccounts.length > 0) {
      const user = await this.prisma.user.findUnique({ where: { id: linkedAccounts[0].userId } });
      if (!user || !user.active) throw new UnauthorizedException('Conta inativa');

      await this.prisma.$executeRaw`
        UPDATE oauth_accounts
        SET email = ${email}, name = ${name}
        WHERE provider = ${GOOGLE_PROVIDER} AND providerUserId = ${profile.sub}
      `;

      return user;
    }

    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      await this.linkOAuthAccount(existingUser.id, profile.sub, email, name);
      if (!existingUser.active) throw new UnauthorizedException('Conta inativa');
      return existingUser;
    }

    const role = this.getDefaultOAuthRole();
    const clientId = process.env.OAUTH_DEFAULT_CLIENT_ID?.trim() || undefined;
    const generatedPassword = await bcrypt.hash(randomBytes(48).toString('hex'), BCRYPT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        name,
        email,
        password: generatedPassword,
        role,
        clientId,
      },
    });

    await this.linkOAuthAccount(user.id, profile.sub, email, name);
    return user;
  }

  private async acceptInvitationWithOAuth(inviteToken: string, profile: GoogleUserInfo) {
    const email = profile.email.toLowerCase().trim();
    const name = profile.name?.trim() || email;

    const invitation = await this.prisma.invitation.findUnique({ where: { token: inviteToken } });
    if (!invitation) throw new BadRequestException('Convite inválido');
    if (invitation.used) throw new BadRequestException('Este convite já foi utilizado');
    if (invitation.expiresAt < new Date()) throw new BadRequestException('Este convite expirou');

    if (invitation.email && invitation.email.toLowerCase().trim() !== email) {
      throw new BadRequestException('A conta Google não corresponde ao email do convite');
    }

    const linkedAccounts = await this.prisma.$queryRaw<OAuthAccountRow[]>`
      SELECT userId
      FROM oauth_accounts
      WHERE provider = ${GOOGLE_PROVIDER} AND providerUserId = ${profile.sub}
      LIMIT 1
    `;
    if (linkedAccounts.length > 0) throw new BadRequestException('Esta conta Google já está associada a outro utilizador');

    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) throw new BadRequestException('Já existe uma conta com este email');

    const generatedPassword = await bcrypt.hash(randomBytes(48).toString('hex'), BCRYPT_ROUNDS);
    const user = await this.prisma.user.create({
      data: {
        name,
        email,
        password: generatedPassword,
        role: invitation.role,
        clientId: invitation.clientId,
      },
    });

    await this.linkOAuthAccount(user.id, profile.sub, email, name);
    await this.prisma.invitation.update({ where: { id: invitation.id }, data: { used: true } });
    return user;
  }

  private getDefaultOAuthRole() {
    const configuredRole = process.env.OAUTH_DEFAULT_ROLE as Role | undefined;
    if (configuredRole && Object.values(Role).includes(configuredRole)) return configuredRole;
    return Role.OPERATOR;
  }

  private async linkOAuthAccount(userId: string, providerUserId: string, email: string, name: string) {
    await this.prisma.$executeRaw`
      INSERT INTO oauth_accounts (id, provider, providerUserId, email, name, userId, updatedAt)
      VALUES (${randomBytes(16).toString('hex')}, ${GOOGLE_PROVIDER}, ${providerUserId}, ${email}, ${name}, ${userId}, NOW(3))
      ON DUPLICATE KEY UPDATE
        userId = VALUES(userId),
        email = VALUES(email),
        name = VALUES(name),
        updatedAt = NOW(3)
    `;
  }

  async issueTokens(user: { id: string; email: string; role: any; clientId: string | null; name: string }) {
    const payload = { sub: user.id, email: user.email, role: user.role, clientId: user.clientId };
    const access_token = this.jwt.sign(payload, { expiresIn: ACCESS_TOKEN_TTL });

    const rawRefreshToken = randomBytes(48).toString('hex');
    const tokenHash = hashToken(rawRefreshToken);

    await this.prisma.refreshToken.create({
      data: {
        tokenHash,
        userId: user.id,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      },
    });

    // Limpar tokens expirados do utilizador (housekeeping assíncrono)
    this.prisma.refreshToken
      .deleteMany({ where: { userId: user.id, expiresAt: { lt: new Date() } } })
      .catch(() => {});

    return {
      access_token,
      refresh_token: rawRefreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        clientId: user.clientId,
      },
    };
  }
}
