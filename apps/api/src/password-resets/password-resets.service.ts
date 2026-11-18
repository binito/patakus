import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { createHash, randomBytes } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/types/auth-user.type';

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');
const invalidLink = () => new BadRequestException('Link inválido ou expirado. Peça um novo link ao administrador.');

@Injectable()
export class PasswordResetsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, actor: AuthUser) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { oauthAccounts: true } });
    if (!user) throw new NotFoundException('Utilizador não encontrado');
    if (actor.role !== Role.SUPER_ADMIN &&
      (actor.role !== Role.CLIENT_ADMIN || !actor.clientId || user.clientId !== actor.clientId || user.role !== Role.OPERATOR)) {
      throw new ForbiddenException('Sem permissão para recuperar o acesso deste utilizador');
    }
    if (!user.active) throw new BadRequestException('O utilizador está inativo');
    if (user.oauthAccounts.some(account => account.provider === 'google')) {
      throw new BadRequestException('Este utilizador entra com Google. Deve recuperar o acesso na conta Google.');
    }
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    const data = { tokenHash: hashToken(token), passwordHash: user.password, expiresAt };
    await this.prisma.passwordReset.upsert({
      where: { userId }, create: { userId, ...data }, update: data,
    });
    return { link: `${process.env.FRONTEND_URL!.replace(/\/$/, '')}/reset-password#${token}`, expiresAt };
  }

  private async findValid(token: string) {
    const reset = await this.prisma.passwordReset.findUnique({
      where: { tokenHash: hashToken(token) }, include: { user: { include: { oauthAccounts: true } } },
    });
    if (!reset || reset.expiresAt <= new Date() || !reset.user.active ||
      reset.passwordHash !== reset.user.password || reset.user.oauthAccounts.some(account => account.provider === 'google')) {
      throw invalidLink();
    }
    return reset;
  }

  async validate(token: string) {
    await this.findValid(token);
    return { valid: true };
  }

  async complete(token: string, password: string) {
    const reset = await this.findValid(token);
    const passwordHash = await bcrypt.hash(password, 12);
    await this.prisma.$transaction(async tx => {
      // Consumir o token atomicamente impede a reutilização e pedidos simultâneos.
      const consumed = await tx.passwordReset.deleteMany({
        where: { id: reset.id, tokenHash: hashToken(token), expiresAt: { gt: new Date() } },
      });
      if (consumed.count !== 1) throw invalidLink();
      const updated = await tx.user.updateMany({
        where: { id: reset.userId, active: true, password: reset.passwordHash, oauthAccounts: { none: { provider: 'google' } } },
        data: { password: passwordHash },
      });
      if (updated.count !== 1) throw invalidLink();
      await tx.refreshToken.deleteMany({ where: { userId: reset.userId } });
    });
    return { success: true };
  }
}
