import { Test } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { ChecklistsService } from './checklists.service';
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

const otherAdmin: AuthUser = {
  id: 'ca-2', email: 'admin@other.pt', role: Role.CLIENT_ADMIN,
  clientId: 'client-2', name: 'Other Admin', active: true,
};

const mockArea = { id: 'area-1', clientId: 'client-1' };

const mockTemplate = {
  id: 'tmpl-1',
  name: 'Limpeza Cozinha',
  areaId: 'area-1',
  frequency: 'DAILY',
  active: true,
  isDefault: false,
  createdAt: new Date(),
  area: { clientId: 'client-1' },
  tasks: [],
};

const mockEntry = {
  id: 'entry-1',
  completedAt: new Date(),
  areaId: 'area-1',
  templateId: 'tmpl-1',
  operatorId: 'op-1',
  area: { name: 'Cozinha', clientId: 'client-1' },
  taskResults: [],
  template: { name: 'Limpeza', frequency: 'DAILY' },
  operator: { name: 'Operador' },
};

function makePrisma() {
  return {
    area: { findUnique: jest.fn() },
    checklistTemplate: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    checklistTask: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
    checklistTaskResult: { deleteMany: jest.fn() },
    checklistEntry: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn((ops: any[]) => Promise.all(ops)),
  };
}

describe('ChecklistsService', () => {
  let service: ChecklistsService;
  let prisma: ReturnType<typeof makePrisma>;

  beforeEach(async () => {
    prisma = makePrisma();
    const module = await Test.createTestingModule({
      providers: [
        ChecklistsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get(ChecklistsService);
  });

  // ── createTemplate ───────────────────────────────────────────────────────────

  describe('createTemplate', () => {
    const dto = { name: 'Limpeza', areaId: 'area-1', tasks: [{ description: 'Varrer', order: 1 }] };

    it('SUPER_ADMIN cria template sem validar área', async () => {
      prisma.checklistTemplate.create.mockResolvedValue(mockTemplate);

      await service.createTemplate(dto as any, superAdmin);

      expect(prisma.area.findUnique).not.toHaveBeenCalled();
      expect(prisma.checklistTemplate.create).toHaveBeenCalled();
    });

    it('CLIENT_ADMIN cria template da sua área', async () => {
      prisma.area.findUnique.mockResolvedValue(mockArea);
      prisma.checklistTemplate.create.mockResolvedValue(mockTemplate);

      await service.createTemplate(dto as any, clientAdmin);

      expect(prisma.area.findUnique).toHaveBeenCalledWith({ where: { id: 'area-1' }, select: { clientId: true } });
      expect(prisma.checklistTemplate.create).toHaveBeenCalled();
    });

    it('CLIENT_ADMIN não pode criar template em área de outro cliente', async () => {
      prisma.area.findUnique.mockResolvedValue({ clientId: 'client-2' });

      await expect(service.createTemplate(dto as any, clientAdmin)).rejects.toThrow(ForbiddenException);
    });

    it('lança NotFoundException se área não existe', async () => {
      prisma.area.findUnique.mockResolvedValue(null);

      await expect(service.createTemplate(dto as any, clientAdmin)).rejects.toThrow(NotFoundException);
    });
  });

  // ── findOneTemplate ──────────────────────────────────────────────────────────

  describe('findOneTemplate', () => {
    it('devolve template se ownership válida', async () => {
      prisma.checklistTemplate.findUnique.mockResolvedValue(mockTemplate);
      const result = await service.findOneTemplate('tmpl-1', clientAdmin);
      expect(result).toEqual(mockTemplate);
    });

    it('lança NotFoundException para template inexistente', async () => {
      prisma.checklistTemplate.findUnique.mockResolvedValue(null);
      await expect(service.findOneTemplate('nao-existe', clientAdmin)).rejects.toThrow(NotFoundException);
    });

    it('lança ForbiddenException para template de outro cliente', async () => {
      prisma.checklistTemplate.findUnique.mockResolvedValue({ ...mockTemplate, area: { clientId: 'client-99' } });
      await expect(service.findOneTemplate('tmpl-1', clientAdmin)).rejects.toThrow(ForbiddenException);
    });
  });

  // ── findEntries ──────────────────────────────────────────────────────────────

  describe('findEntries', () => {
    it('devolve resultado paginado com nextCursor quando há mais', async () => {
      const items = Array.from({ length: 51 }, (_, i) => ({ ...mockEntry, id: `entry-${i}` }));
      prisma.checklistEntry.findMany.mockResolvedValue(items);

      const result = await service.findEntries('client-1', undefined, { take: 50 });

      expect(result.data).toHaveLength(50);
      expect(result.hasMore).toBe(true);
      expect(result.nextCursor).toBe('entry-49');
    });

    it('devolve nextCursor null quando não há mais resultados', async () => {
      prisma.checklistEntry.findMany.mockResolvedValue([mockEntry]);

      const result = await service.findEntries('client-1', undefined, { take: 50 });

      expect(result.hasMore).toBe(false);
      expect(result.nextCursor).toBeNull();
    });

    it('passa cursor ao Prisma quando fornecido', async () => {
      prisma.checklistEntry.findMany.mockResolvedValue([mockEntry]);

      await service.findEntries('client-1', undefined, { cursor: 'entry-10', take: 50 });

      expect(prisma.checklistEntry.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ cursor: { id: 'entry-10' }, skip: 1 }),
      );
    });
  });

  // ── submitChecklist ──────────────────────────────────────────────────────────

  describe('submitChecklist', () => {
    const dto = {
      areaId: 'area-1', templateId: 'tmpl-1',
      taskResults: [{ taskId: 'task-1', done: true, notes: null }],
    };

    it('SUPER_ADMIN submete sem validar área', async () => {
      prisma.checklistEntry.create.mockResolvedValue(mockEntry);

      await service.submitChecklist(dto as any, 'op-1', superAdmin);

      expect(prisma.area.findUnique).not.toHaveBeenCalled();
      expect(prisma.checklistEntry.create).toHaveBeenCalled();
    });

    it('CLIENT_ADMIN submete na sua área', async () => {
      prisma.area.findUnique.mockResolvedValue(mockArea);
      prisma.checklistEntry.create.mockResolvedValue(mockEntry);

      await service.submitChecklist(dto as any, 'op-1', clientAdmin);

      expect(prisma.checklistEntry.create).toHaveBeenCalled();
    });

    it('CLIENT_ADMIN não pode submeter em área de outro cliente', async () => {
      prisma.area.findUnique.mockResolvedValue({ clientId: 'client-2' });

      await expect(service.submitChecklist(dto as any, 'op-1', clientAdmin)).rejects.toThrow(ForbiddenException);
    });
  });

  // ── deleteTemplate ───────────────────────────────────────────────────────────

  describe('deleteTemplate', () => {
    it('apaga template e todos os dados associados', async () => {
      prisma.checklistTemplate.findUnique.mockResolvedValue(mockTemplate);
      prisma.checklistTaskResult.deleteMany.mockResolvedValue({ count: 0 });
      prisma.checklistEntry.deleteMany.mockResolvedValue({ count: 0 });
      prisma.checklistTask.deleteMany.mockResolvedValue({ count: 0 });
      prisma.checklistTemplate.delete.mockResolvedValue(mockTemplate);

      const result = await service.deleteTemplate('tmpl-1', clientAdmin);

      expect(prisma.checklistTemplate.delete).toHaveBeenCalledWith({ where: { id: 'tmpl-1' } });
      expect(result).toEqual({ deleted: true });
    });

    it('lança ForbiddenException se outro cliente tenta apagar', async () => {
      prisma.checklistTemplate.findUnique.mockResolvedValue({ ...mockTemplate, area: { clientId: 'client-99' } });

      await expect(service.deleteTemplate('tmpl-1', clientAdmin)).rejects.toThrow(ForbiddenException);
    });
  });
});
