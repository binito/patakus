import { Injectable, NotFoundException } from '@nestjs/common';
import { ReportType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/types/auth-user.type';
import { CreateShareDto } from './dto/create-share.dto';

@Injectable()
export class SharesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateShareDto, actor: AuthUser) {
    const clientId = dto.clientId ?? actor.clientId ?? '';
    return this.prisma.reportShare.create({
      data: {
        type: dto.type,
        label: dto.label,
        params: dto.params as any,
        clientId,
        createdById: actor.id,
      },
      select: { id: true, type: true, label: true, createdAt: true },
    });
  }

  async getPublicShare(id: string) {
    const share = await this.prisma.reportShare.findUnique({ where: { id } });
    if (!share) throw new NotFoundException('Partilha não encontrada');

    const [client, data] = await Promise.all([
      this.prisma.client.findUnique({ where: { id: share.clientId }, select: { name: true } }),
      this.fetchData(share.type, share.clientId, share.params as any),
    ]);

    return {
      type: share.type,
      label: share.label,
      createdAt: share.createdAt,
      params: share.params,
      clientName: client?.name ?? null,
      data,
    };
  }

  private dateWhere(field: string, params: any) {
    if (!params.startDate && !params.endDate) return {};
    const w: any = {};
    if (params.startDate) w.gte = new Date(params.startDate);
    if (params.endDate) {
      const end = new Date(params.endDate);
      end.setDate(end.getDate() + 1);
      w.lt = end;
    }
    return { [field]: w };
  }

  private async fetchData(type: ReportType, clientId: string, params: any) {
    switch (type) {
      case ReportType.ENTRADAS:
        return this.prisma.entradaRecord.findMany({
          where: { clientId, ...this.dateWhere('data', params) },
          include: { operator: { select: { name: true } } },
          orderBy: { data: 'desc' },
          take: 500,
        });

      case ReportType.HIGIENIZACAO:
        return this.prisma.higienizacaoRecord.findMany({
          where: {
            clientId,
            ...this.dateWhere('dia', params),
            ...(params.zona ? { zona: params.zona } : {}),
          },
          include: { operator: { select: { name: true } } },
          orderBy: { dia: 'desc' },
          take: 500,
        });

      case ReportType.DESINFECAO:
        return this.prisma.desinfecaoRecord.findMany({
          where: { clientId, ...this.dateWhere('data', params) },
          include: { operator: { select: { name: true } } },
          orderBy: { data: 'desc' },
          take: 500,
        });

      case ReportType.OLEOS:
        return this.prisma.oleoFrituraRecord.findMany({
          where: { clientId, ...this.dateWhere('data', params) },
          include: { responsavel: { select: { name: true } } },
          orderBy: { data: 'desc' },
          take: 500,
        });

      case ReportType.TEMPERATURAS:
        return this.prisma.temperatureRecord.findMany({
          where: {
            equipment: { clientId },
            ...this.dateWhere('recordedAt', params),
          },
          include: {
            equipment: { select: { name: true, type: true } },
            operator: { select: { name: true } },
          },
          orderBy: { recordedAt: 'desc' },
          take: 500,
        });

      case ReportType.CHECKLISTS:
        return this.prisma.checklistEntry.findMany({
          where: {
            area: { clientId },
            ...this.dateWhere('completedAt', params),
          },
          include: {
            template: { select: { name: true, frequency: true } },
            area: { select: { name: true } },
            operator: { select: { name: true } },
            taskResults: {
              include: { task: { select: { description: true, order: true } } },
              orderBy: { task: { order: 'asc' } },
            },
          },
          orderBy: { completedAt: 'desc' },
          take: 200,
        });

      default:
        return [];
    }
  }
}
