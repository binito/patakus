import { Test } from '@nestjs/testing';
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/types/auth-user.type';

const superAdmin: AuthUser = {
  id: 'sa-1', email: 'sa@patakus.pt', role: Role.SUPER_ADMIN,
  clientId: null, name: 'Super Admin', active: true,
};

const clientAdmin: AuthUser = {
  id: 'ca-1', email: 'admin@client.pt', role: Role.CLIENT_ADMIN,
  clientId: 'client-1', name: 'Client Admin', active: true,
};

const mockUser = {
  id: 'u-1', name: 'Operator', email: 'op@client.pt', role: Role.OPERATOR,
  clientId: 'client-1', active: true, phone: null, createdAt: new Date(),
};

function makePrisma() {
  return {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };
}

describe('UsersService', () => {
  let service: UsersService;
  let prisma: ReturnType<typeof makePrisma>;

  beforeEach(async () => {
    prisma = makePrisma();
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get(UsersService);
  });

  // ── create ──────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('cria utilizador quando SUPER_ADMIN e email disponível', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(mockUser);

      const dto = { name: 'Operator', email: 'op@client.pt', password: 'password1', role: Role.OPERATOR };
      const result = await service.create(dto as any, superAdmin);

      expect(prisma.user.create).toHaveBeenCalled();
      const createCall = prisma.user.create.mock.calls[0][0];
      expect(await bcrypt.compare('password1', createCall.data.password)).toBe(true);
      expect(result).toEqual(mockUser);
    });

    it('lança ConflictException se email já existe', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.create({ email: 'op@client.pt', password: 'pw', name: 'X', role: Role.OPERATOR } as any, superAdmin),
      ).rejects.toThrow(ConflictException);
    });

    it('CLIENT_ADMIN não pode criar SUPER_ADMIN', async () => {
      await expect(
        service.create({ email: 'x@x.pt', password: 'pw', name: 'X', role: Role.SUPER_ADMIN } as any, clientAdmin),
      ).rejects.toThrow(ForbiddenException);
    });

    it('CLIENT_ADMIN herda o seu próprio clientId', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({ ...mockUser, clientId: 'client-1' });

      const dto = { name: 'Op', email: 'new@client.pt', password: 'pw', role: Role.OPERATOR };
      await service.create(dto as any, clientAdmin);

      const createCall = prisma.user.create.mock.calls[0][0];
      expect(createCall.data.clientId).toBe('client-1');
    });
  });

  // ── findAll ─────────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('devolve todos os utilizadores sem filtro', async () => {
      prisma.user.findMany.mockResolvedValue([mockUser]);
      const result = await service.findAll();
      expect(prisma.user.findMany).toHaveBeenCalledWith({ where: undefined, select: expect.any(Object) });
      expect(result).toHaveLength(1);
    });

    it('filtra por clientId quando fornecido', async () => {
      prisma.user.findMany.mockResolvedValue([mockUser]);
      await service.findAll('client-1');
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: { clientId: 'client-1' },
        select: expect.any(Object),
      });
    });
  });

  // ── findOne ─────────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('devolve utilizador existente', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      const result = await service.findOne('u-1');
      expect(result).toEqual(mockUser);
    });

    it('lança NotFoundException para id inexistente', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.findOne('nao-existe')).rejects.toThrow(NotFoundException);
    });
  });

  // ── delete ──────────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('SUPER_ADMIN pode apagar qualquer utilizador', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.delete.mockResolvedValue(mockUser);

      await service.delete('u-1', superAdmin);
      expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 'u-1' } });
    });

    it('não pode apagar a própria conta', async () => {
      const self = { ...mockUser, id: 'sa-1' };
      prisma.user.findUnique.mockResolvedValue(self);

      await expect(service.delete('sa-1', superAdmin)).rejects.toThrow(ForbiddenException);
    });

    it('CLIENT_ADMIN não pode apagar utilizador de outro cliente', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...mockUser, clientId: 'outro-cliente' });

      await expect(service.delete('u-1', clientAdmin)).rejects.toThrow(ForbiddenException);
    });
  });

  // ── deactivate ───────────────────────────────────────────────────────────────

  describe('deactivate', () => {
    it('CLIENT_ADMIN pode desativar utilizador do mesmo cliente', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue({ id: 'u-1', active: false });

      await service.deactivate('u-1', clientAdmin);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'u-1' },
        data: { active: false },
        select: { id: true, active: true },
      });
    });

    it('CLIENT_ADMIN não pode desativar utilizador de outro cliente', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...mockUser, clientId: 'outro' });
      await expect(service.deactivate('u-1', clientAdmin)).rejects.toThrow(ForbiddenException);
    });
  });
});
