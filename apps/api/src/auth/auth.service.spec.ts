import { Test } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

const mockUser = {
  id: 'user-1',
  name: 'Test Admin',
  email: 'admin@test.pt',
  password: '',
  role: 'SUPER_ADMIN' as any,
  clientId: null,
  active: true,
  phone: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function makePrisma() {
  return {
    user: { findUnique: jest.fn() },
    refreshToken: {
      create: jest.fn().mockResolvedValue({}),
      findUnique: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
  };
}

describe('AuthService', () => {
  let service: AuthService;
  let prisma: ReturnType<typeof makePrisma>;
  let jwt: { sign: jest.Mock };

  beforeEach(async () => {
    mockUser.password = await bcrypt.hash('senha123', 10);
    prisma = makePrisma();
    jwt = { sign: jest.fn().mockReturnValue('mock-access-token') };

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  // ── login ────────────────────────────────────────────────────────────────────

  describe('login', () => {
    it('retorna access_token, refresh_token e user quando credenciais são válidas', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.login('admin@test.pt', 'senha123');

      expect(result.access_token).toBe('mock-access-token');
      expect(result.refresh_token).toBeDefined();
      expect(result.refresh_token).toHaveLength(96); // 48 bytes hex
      expect(result.user.email).toBe('admin@test.pt');
      expect(result.user).not.toHaveProperty('password');
    });

    it('persiste o hash do refresh token na base de dados', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      await service.login('admin@test.pt', 'senha123');

      expect(prisma.refreshToken.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ userId: 'user-1', tokenHash: expect.any(String) }),
        }),
      );
    });

    it('lança UnauthorizedException quando utilizador não existe', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.login('nao@existe.pt', 'qualquer')).rejects.toThrow(UnauthorizedException);
    });

    it('lança UnauthorizedException quando utilizador está inativo', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...mockUser, active: false });
      await expect(service.login('admin@test.pt', 'senha123')).rejects.toThrow(UnauthorizedException);
    });

    it('lança UnauthorizedException quando password está errada', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      await expect(service.login('admin@test.pt', 'errada')).rejects.toThrow(UnauthorizedException);
    });
  });

  // ── refresh ──────────────────────────────────────────────────────────────────

  describe('refresh', () => {
    it('emite novo par de tokens com token válido', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'rt-1',
        tokenHash: 'hash',
        userId: 'user-1',
        expiresAt: new Date(Date.now() + 60000),
        user: mockUser,
      });
      prisma.refreshToken.delete.mockResolvedValue({});

      const result = await service.refresh('valid-raw-token');

      expect(prisma.refreshToken.delete).toHaveBeenCalledWith({ where: { id: 'rt-1' } });
      expect(result.access_token).toBeDefined();
      expect(result.refresh_token).toBeDefined();
    });

    it('lança UnauthorizedException para token inexistente', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue(null);
      await expect(service.refresh('invalid-token')).rejects.toThrow(UnauthorizedException);
    });

    it('lança UnauthorizedException para token expirado', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'rt-1', tokenHash: 'hash', userId: 'user-1',
        expiresAt: new Date(Date.now() - 1000),
        user: mockUser,
      });
      await expect(service.refresh('expired-token')).rejects.toThrow(UnauthorizedException);
    });

    it('lança UnauthorizedException se utilizador está inativo', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'rt-1', tokenHash: 'hash', userId: 'user-1',
        expiresAt: new Date(Date.now() + 60000),
        user: { ...mockUser, active: false },
      });
      await expect(service.refresh('token')).rejects.toThrow(UnauthorizedException);
    });
  });

  // ── logout ───────────────────────────────────────────────────────────────────

  describe('logout', () => {
    it('apaga o refresh token da base de dados', async () => {
      await service.logout('some-raw-token');
      expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { tokenHash: expect.any(String) } }),
      );
    });

    it('não lança erro se refresh token é undefined', async () => {
      await expect(service.logout(undefined)).resolves.toBeUndefined();
      expect(prisma.refreshToken.deleteMany).not.toHaveBeenCalled();
    });
  });

  // ── validateUser ──────────────────────────────────────────────────────────────

  describe('validateUser', () => {
    it('retorna o utilizador pelo id', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      const result = await service.validateUser('user-1');
      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 'user-1' } });
      expect(result).toEqual(mockUser);
    });

    it('retorna null quando utilizador não existe', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      const result = await service.validateUser('nao-existe');
      expect(result).toBeNull();
    });
  });
});
