import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/types/auth-user.type';
import { assertOwnership } from '../common/utils/tenant.util';
import { CreateTemplateDto, CreateChecklistTaskDto } from './dto/create-template.dto';
import { SubmitChecklistDto } from './dto/submit-checklist.dto';

@Injectable()
export class ChecklistsService {
  constructor(private prisma: PrismaService) {}

  // ── Templates ──────────────────────────────────────────────────────────────

  async createTemplate(dto: CreateTemplateDto, actor: AuthUser) {
    if (actor.role !== Role.SUPER_ADMIN) {
      const area = await this.prisma.area.findUnique({ where: { id: dto.areaId }, select: { clientId: true } });
      if (!area) throw new NotFoundException('Área não encontrada');
      assertOwnership(actor, area.clientId);
    }

    const { tasks, ...templateData } = dto;
    return this.prisma.checklistTemplate.create({
      data: {
        ...templateData,
        tasks: {
          create: tasks.map((t, i) => ({
            description: t.description,
            order: t.order ?? i,
          })),
        },
      },
      include: { tasks: { orderBy: { order: 'asc' } } },
    });
  }

  async findAllTemplates(areaId?: string, clientId?: string) {
    return this.prisma.checklistTemplate.findMany({
      where: {
        ...(areaId ? { areaId } : {}),
        ...(clientId ? { area: { clientId } } : {}),
      },
      include: { tasks: { orderBy: { order: 'asc' } } },
    });
  }

  async findOneTemplate(id: string, actor: AuthUser) {
    const tmpl = await this.prisma.checklistTemplate.findUnique({
      where: { id },
      include: { tasks: { orderBy: { order: 'asc' } }, area: { select: { clientId: true } } },
    });
    if (!tmpl) throw new NotFoundException('Template não encontrado');
    assertOwnership(actor, tmpl.area.clientId);
    return tmpl;
  }

  async updateTemplate(id: string, dto: Partial<CreateTemplateDto>, actor: AuthUser) {
    await this.findOneTemplate(id, actor);
    const { tasks, ...templateData } = dto;

    if (tasks) {
      const existing = await this.prisma.checklistTask.findMany({
        where: { templateId: id },
        orderBy: { order: 'asc' },
        select: { id: true },
      });

      // Update existing tasks in-place (preserves task results / historical data)
      await this.prisma.$transaction([
        ...tasks.map((t: CreateChecklistTaskDto, i: number) =>
          existing[i]
            ? this.prisma.checklistTask.update({
                where: { id: existing[i].id },
                data: { description: t.description, order: t.order ?? i + 1 },
              })
            : this.prisma.checklistTask.create({
                data: { templateId: id, description: t.description, order: t.order ?? i + 1 },
              }),
        ),
      ]);

      // Remove surplus tasks (those beyond the new list)
      const surplus = existing.slice(tasks.length).map(t => t.id);
      if (surplus.length) {
        await this.prisma.checklistTaskResult.deleteMany({ where: { taskId: { in: surplus } } });
        await this.prisma.checklistTask.deleteMany({ where: { id: { in: surplus } } });
      }
    }

    return this.prisma.checklistTemplate.update({
      where: { id },
      data: templateData,
      include: { tasks: { orderBy: { order: 'asc' } } },
    });
  }

  async deleteTemplate(id: string, actor: AuthUser) {
    await this.findOneTemplate(id, actor);

    await this.prisma.checklistTaskResult.deleteMany({ where: { entry: { templateId: id } } });
    await this.prisma.checklistEntry.deleteMany({ where: { templateId: id } });
    await this.prisma.checklistTask.deleteMany({ where: { templateId: id } });
    await this.prisma.checklistTemplate.delete({ where: { id } });

    return { deleted: true };
  }

  // ── Submissões ─────────────────────────────────────────────────────────────

  async submitChecklist(dto: SubmitChecklistDto, operatorId: string, actor: AuthUser) {
    if (actor.role !== Role.SUPER_ADMIN) {
      const area = await this.prisma.area.findUnique({ where: { id: dto.areaId }, select: { clientId: true } });
      if (!area) throw new NotFoundException('Área não encontrada');
      assertOwnership(actor, area.clientId);
    }

    const { taskResults, ...entryData } = dto;
    return this.prisma.checklistEntry.create({
      data: {
        ...entryData,
        operatorId,
        taskResults: {
          create: taskResults.map((r) => ({
            taskId: r.taskId,
            done: r.done,
            notes: r.notes,
          })),
        },
      },
      include: { taskResults: true, template: true, area: true },
    });
  }

  async findEntries(clientId?: string, areaId?: string) {
    return this.prisma.checklistEntry.findMany({
      where: {
        ...(areaId ? { areaId } : {}),
        ...(clientId ? { area: { clientId } } : {}),
      },
      include: {
        taskResults: { include: { task: true }, orderBy: { task: { order: 'asc' } } },
        template: { select: { name: true, frequency: true } },
        area: { select: { name: true } },
        operator: { select: { name: true } },
      },
      orderBy: { completedAt: 'desc' },
      take: 200,
    });
  }

  async findOneEntry(id: string, actor: AuthUser) {
    const entry = await this.prisma.checklistEntry.findUnique({
      where: { id },
      include: {
        taskResults: { include: { task: true }, orderBy: { task: { order: 'asc' } } },
        template: { include: { tasks: { orderBy: { order: 'asc' } } } },
        area: { select: { name: true, clientId: true } },
        operator: { select: { name: true, email: true } },
      },
    });
    if (!entry) throw new NotFoundException('Execução não encontrada');
    assertOwnership(actor, entry.area.clientId);
    return entry;
  }
}
