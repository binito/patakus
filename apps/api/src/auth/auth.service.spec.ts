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

describe('AuthService', () => {
  let service: AuthService;
  let prisma: { user: { findUnique: jest.Mock } };
  let jwt: { sign: jest.Mock };

  beforeEach(async () => {
    mockUser.password = await bcrypt.hash('senha123', 10);

    prisma = { user: { findUnique: jest.fn() } };
    jwt = { sign: jest.fn().mockReturnValue('mock-token') };

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  describe('login', () => {
    it('retorna token e user quando credenciais são válidas', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.login('admin@test.pt', 'senha123');

      expect(result.access_token).toBe('mock-token');
      expect(result.user.email).toBe('admin@test.pt');
      expect(result.user).not.toHaveProperty('password');
    });

    it('lança UnauthorizedException quando utilizador não existe', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.login('naoexiste@test.pt', 'qualquer')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('lança UnauthorizedException quando utilizador está inativo', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...mockUser, active: false });

      await expect(service.login('admin@test.pt', 'senha123')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('lança UnauthorizedException quando password está errada', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.login('admin@test.pt', 'errada')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('não expõe a password no objeto retornado', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.login('admin@test.pt', 'senha123');

      expect((result.user as any).password).toBeUndefined();
    });
  });

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
