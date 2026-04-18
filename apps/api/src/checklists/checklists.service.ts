import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { SubmitChecklistDto } from './dto/submit-checklist.dto';
import { CreateChecklistTaskDto } from './dto/create-template.dto';

@Injectable()
export class ChecklistsService {
  constructor(private prisma: PrismaService) {}

  // ── Templates ──────────────────────────────────────────────────────────────

  async createTemplate(dto: CreateTemplateDto) {
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

  async findOneTemplate(id: string) {
    const tmpl = await this.prisma.checklistTemplate.findUnique({
      where: { id },
      include: { tasks: { orderBy: { order: 'asc' } } },
    });
    if (!tmpl) throw new NotFoundException('Template não encontrado');
    return tmpl;
  }

  async updateTemplate(id: string, dto: Partial<CreateTemplateDto>) {
    await this.findOneTemplate(id);
    const { tasks, ...templateData } = dto;

    // Se foram enviadas tarefas, substituir todas (apagar + recriar)
    if (tasks) {
      await this.prisma.checklistTask.deleteMany({ where: { templateId: id } });
    }

    return this.prisma.checklistTemplate.update({
      where: { id },
      data: {
        ...templateData,
        ...(tasks ? {
          tasks: {
            create: tasks.map((t: CreateChecklistTaskDto, i: number) => ({
              description: t.description,
              order: t.order ?? i,
            })),
          },
        } : {}),
      },
      include: { tasks: { orderBy: { order: 'asc' } } },
    });
  }

  async deleteTemplate(id: string) {
    await this.findOneTemplate(id);

    // 1. Apagar resultados de tarefas ligados às entradas deste template
    await this.prisma.checklistTaskResult.deleteMany({
      where: { entry: { templateId: id } },
    });
    // 2. Apagar as entradas (execuções) deste template
    await this.prisma.checklistEntry.deleteMany({ where: { templateId: id } });
    // 3. Apagar as tarefas do template
    await this.prisma.checklistTask.deleteMany({ where: { templateId: id } });
    // 4. Apagar o template
    await this.prisma.checklistTemplate.delete({ where: { id } });

    return { deleted: true };
  }

  // ── Submissões ─────────────────────────────────────────────────────────────

  async submitChecklist(dto: SubmitChecklistDto, operatorId: string) {
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
      include: {
        taskResults: true,
        template: true,
        area: true,
      },
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
    });
  }

  async findOneEntry(id: string) {
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
    return entry;
  }
}
