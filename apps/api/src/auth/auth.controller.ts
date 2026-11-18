import { Controller, Post, Get, Body, Res, Req, HttpCode, Query, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { randomBytes } from 'crypto';
import { IsEmail, IsString } from 'class-validator';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/types/auth-user.type';
import { AuthService } from './auth.service';

class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const OAUTH_STATE_COOKIE = 'patakus_oauth_state';
const OAUTH_INVITE_COOKIE = 'patakus_oauth_invite';

function setCookies(res: Response, csrfToken: string, refreshToken: string) {
  // Refresh token — HttpOnly, não acessível por JS
  res.cookie('patakus_refresh', refreshToken, {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: 'strict',
    maxAge: REFRESH_TOKEN_TTL_MS,
    path: '/',
  });

  // CSRF token — legível por JS para double-submit pattern
  res.cookie('csrf_token', csrfToken, {
    httpOnly: false,
    secure: IS_PRODUCTION,
    sameSite: 'strict',
    maxAge: REFRESH_TOKEN_TTL_MS,
    path: '/',
  });
}

function clearCookies(res: Response) {
  res.clearCookie('patakus_refresh', { path: '/' });
  res.clearCookie('csrf_token', { path: '/' });
}

function frontendUrl(path: string) {
  const base = process.env.FRONTEND_URL || 'http://localhost:3000';
  return `${base.replace(/\/$/, '')}${path}`;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Throttle({ default: { limit: 600, ttl: 60000 } })
  @UseGuards(ThrottlerGuard)
  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { access_token, refresh_token, user } = await this.authService.login(dto.email, dto.password);
    const csrfToken = randomBytes(32).toString('hex');
    setCookies(res, csrfToken, refresh_token);
    // Access token vai apenas no corpo — o frontend guarda em memória (Zustand)
    return { access_token, user };
  }

  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @UseGuards(ThrottlerGuard)
  @Get('oauth/google')
  google(@Query('inviteToken') inviteToken: string | undefined, @Res() res: Response) {
    const state = randomBytes(32).toString('hex');
    const authorizationUrl = this.authService.createGoogleAuthorizationUrl(state);

    res.cookie(OAUTH_STATE_COOKIE, state, {
      httpOnly: true,
      secure: IS_PRODUCTION,
      sameSite: 'lax',
      maxAge: 10 * 60 * 1000,
      path: '/',
    });

    if (inviteToken) {
      res.cookie(OAUTH_INVITE_COOKIE, inviteToken, {
        httpOnly: true,
        secure: IS_PRODUCTION,
        sameSite: 'lax',
        maxAge: 10 * 60 * 1000,
        path: '/',
      });
    } else {
      res.clearCookie(OAUTH_INVITE_COOKIE, { path: '/' });
    }

    return res.redirect(authorizationUrl);
  }

  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @UseGuards(ThrottlerGuard)
  @Get('oauth/google/callback')
  async googleCallback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const expectedState = req.cookies?.[OAUTH_STATE_COOKIE] as string | undefined;
    const inviteToken = req.cookies?.[OAUTH_INVITE_COOKIE] as string | undefined;
    res.clearCookie(OAUTH_STATE_COOKIE, { path: '/' });
    res.clearCookie(OAUTH_INVITE_COOKIE, { path: '/' });
    const failureRedirect = inviteToken
      ? frontendUrl(`/invite/${inviteToken}?oauth_error=callback`)
      : frontendUrl('/login?oauth_error=callback');
    const stateFailureRedirect = inviteToken
      ? frontendUrl(`/invite/${inviteToken}?oauth_error=state`)
      : frontendUrl('/login?oauth_error=state');

    if (!code || !state || !expectedState || state !== expectedState) {
      return res.redirect(stateFailureRedirect);
    }

    try {
      const { refresh_token } = await this.authService.loginWithGoogleCode(code, inviteToken);
      const csrfToken = randomBytes(32).toString('hex');
      setCookies(res, csrfToken, refresh_token);
      if (inviteToken) return res.redirect(frontendUrl(`/invite/${inviteToken}?oauth=success`));
      return res.redirect(frontendUrl('/login?oauth=success'));
    } catch {
      return res.redirect(failureRedirect);
    }
  }

  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @UseGuards(ThrottlerGuard)
  @Post('refresh')
  @HttpCode(200)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const rawRefreshToken = req.cookies?.['patakus_refresh'] as string | undefined;
    if (!rawRefreshToken) throw new Error('Refresh token ausente');

    const { access_token, refresh_token, user } = await this.authService.refresh(rawRefreshToken);
    const csrfToken = randomBytes(32).toString('hex');
    setCookies(res, csrfToken, refresh_token);
    return { access_token, user };
  }

  @Post('logout')
  @HttpCode(200)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const rawRefreshToken = req.cookies?.['patakus_refresh'] as string | undefined;
    await this.authService.logout(rawRefreshToken);
    clearCookies(res);
    return { ok: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    const { ...safe } = user as any;
    delete safe.password;
    return safe;
  }
}
