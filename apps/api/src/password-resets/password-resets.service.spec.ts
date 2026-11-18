import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { createHash } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { PasswordResetsService } from './password-resets.service';
import { AuthUser } from '../common/types/auth-user.type';

describe('PasswordResetsService', () => {
  const actor: AuthUser = { id: 'admin', email: 'admin@test.pt', name: 'Admin', role: Role.SUPER_ADMIN, clientId: null, active: true };
  let prisma: any;
  let service: PasswordResetsService;
  let user: any;
  let reset: any;

  beforeEach(() => {
    process.env.FRONTEND_URL = 'https://example.test/';
    user = { id: 'user', clientId: 'client', role: Role.OPERATOR, active: true, password: 'previous-hash', oauthAccounts: [] };
    reset = { id: 'reset', userId: user.id, passwordHash: user.password, user, expiresAt: new Date(Date.now() + 60000) };
    prisma = {
      user: { findUnique: jest.fn().mockResolvedValue(user), updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
      passwordReset: {
        upsert: jest.fn(), findUnique: jest.fn().mockResolvedValue(reset), deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      refreshToken: { deleteMany: jest.fn() },
      $transaction: jest.fn(async callback => callback(prisma)),
    };
    service = new PasswordResetsService(prisma);
  });

  it('gera um link aleatório e guarda apenas o hash, substituindo o link anterior', async () => {
    const first = await service.create(user.id, actor);
    const second = await service.create(user.id, actor);
    const token = first.link.split('#')[1];
    expect(token).toMatch(/^[a-f0-9]{64}$/);
    expect(first.link).toBe(`https://example.test/reset-password#${token}`);
    expect(second.link).not.toBe(first.link);
    const saved = prisma.passwordReset.upsert.mock.calls[0][0];
    expect(saved.where).toEqual({ userId: user.id });
    expect(saved.create.tokenHash).toBe(createHash('sha256').update(token).digest('hex'));
    expect(saved.update).toEqual(expect.objectContaining({ tokenHash: saved.create.tokenHash }));
    expect(first.expiresAt.getTime() - Date.now()).toBeGreaterThan(3590000);
  });

  it('permite ao gestor recuperar um operacional do seu cliente', async () => {
    await expect(service.create(user.id, { ...actor, role: Role.CLIENT_ADMIN, clientId: 'client' })).resolves.toHaveProperty('link');
  });

  it.each([
    [Role.CLIENT_ADMIN, 'other-client', Role.OPERATOR],
    [Role.CLIENT_ADMIN, null, Role.OPERATOR],
    [Role.CLIENT_ADMIN, 'client', Role.SUPER_ADMIN],
    [Role.CLIENT_ADMIN, 'client', Role.CLIENT_ADMIN],
    [Role.OPERATOR, 'client', Role.OPERATOR],
  ])('bloqueia recuperação sem autorização (%s, %s, %s)', async (role, clientId, targetRole) => {
    user.role = targetRole;
    await expect(service.create(user.id, { ...actor, role, clientId })).rejects.toThrow(ForbiddenException);
    expect(prisma.passwordReset.upsert).not.toHaveBeenCalled();
  });

  it('não gera links para contas Google ou inativas', async () => {
    user.oauthAccounts = [{ provider: 'google' }];
    await expect(service.create(user.id, actor)).rejects.toThrow(BadRequestException);
    user.oauthAccounts = [];
    user.active = false;
    await expect(service.create(user.id, actor)).rejects.toThrow(BadRequestException);
  });

  it.each(['missing', 'expired', 'changed', 'inactive', 'google'])('rejeita link %s', async reason => {
    if (reason === 'missing') prisma.passwordReset.findUnique.mockResolvedValue(null);
    if (reason === 'expired') reset.expiresAt = new Date(0);
    if (reason === 'changed') user.password = 'changed-password';
    if (reason === 'inactive') user.active = false;
    if (reason === 'google') user.oauthAccounts = [{ provider: 'google' }];
    await expect(service.complete('a'.repeat(64), 'NovaSenha1!')).rejects.toThrow(BadRequestException);
    expect(prisma.user.updateMany).not.toHaveBeenCalled();
  });

  it('altera a password com hash e revoga os refresh tokens na mesma transação', async () => {
    await expect(service.complete('a'.repeat(64), 'NovaSenha1!')).resolves.toEqual({ success: true });
    const update = prisma.user.updateMany.mock.calls[0][0];
    expect(await bcrypt.compare('NovaSenha1!', update.data.password)).toBe(true);
    expect(update.where).toEqual(expect.objectContaining({ id: user.id, password: 'previous-hash', active: true }));
    expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({ where: { userId: user.id } });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    prisma.passwordReset.findUnique.mockResolvedValue(null);
    await expect(service.complete('a'.repeat(64), 'OutraSenha1!')).rejects.toThrow(BadRequestException);
  });

  it('não altera a password se outro pedido já consumiu o token', async () => {
    prisma.passwordReset.deleteMany.mockResolvedValue({ count: 0 });
    await expect(service.complete('a'.repeat(64), 'NovaSenha1!')).rejects.toThrow(BadRequestException);
    expect(prisma.user.updateMany).not.toHaveBeenCalled();
  });

  it('falha se a password ou o estado da conta mudar durante o pedido', async () => {
    prisma.user.updateMany.mockResolvedValue({ count: 0 });
    await expect(service.complete('a'.repeat(64), 'NovaSenha1!')).rejects.toThrow(BadRequestException);
    expect(prisma.refreshToken.deleteMany).not.toHaveBeenCalled();
  });
});
