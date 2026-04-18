import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/types/auth-user.type';
import { buildDateRange } from '../common/utils/date-range.util';
import { CreateDesinfecaoDto } from './dto/create-desinfecao.dto';

@Injectable()
export class DesinfecaoService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateDesinfecaoDto, operatorId: string, clientId: string) {
    return this.prisma.desinfecaoRecord.create({
      data: { ...dto, data: new Date(dto.data), clientId, operatorId },
      include: { operator: { select: { id: true, name: true } } },
    });
  }

  async findAll(clientId: string, startDate?: string, endDate?: string, page = 1, limit = 50) {
    const dateRange = buildDateRange(startDate, endDate);
    const where = {
      ...(clientId ? { clientId } : {}),
      ...(dateRange ? { data: dateRange } : {}),
    };
    const safeLimit = Math.min(limit, 200);
    const [data, total] = await this.prisma.$transaction([
      this.prisma.desinfecaoRecord.findMany({
        where,
        orderBy: { data: 'desc' },
        include: { operator: { select: { id: true, name: true } } },
        skip: (page - 1) * safeLimit,
        take: safeLimit,
      }),
      this.prisma.desinfecaoRecord.count({ where }),
    ]);
    return { data, total, page, limit: safeLimit };
  }

  async remove(id: string, actor: AuthUser) {
    const rec = await this.prisma.desinfecaoRecord.findUnique({ where: { id }, select: { clientId: true } });
    if (!rec) throw new NotFoundException('Registo não encontrado');
    if (actor.role !== Role.SUPER_ADMIN && rec.clientId !== actor.clientId) {
      throw new ForbiddenException('Acesso negado a este registo');
    }
    return this.prisma.desinfecaoRecord.delete({ where: { id } });
  }
}
