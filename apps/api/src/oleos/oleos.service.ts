import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/types/auth-user.type';
import { buildDateRange } from '../common/utils/date-range.util';
import { CreateOleoDto } from './dto/create-oleo.dto';

@Injectable()
export class OleosService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateOleoDto, responsavelId: string, clientId: string) {
    return this.prisma.oleoFrituraRecord.create({
      data: { ...dto, data: new Date(dto.data), clientId, responsavelId },
      include: { responsavel: { select: { id: true, name: true } } },
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
      this.prisma.oleoFrituraRecord.findMany({
        where,
        orderBy: { data: 'desc' },
        include: { responsavel: { select: { id: true, name: true } } },
        skip: (page - 1) * safeLimit,
        take: safeLimit,
      }),
      this.prisma.oleoFrituraRecord.count({ where }),
    ]);
    return { data, total, page, limit: safeLimit };
  }

  async remove(id: string, actor: AuthUser) {
    const rec = await this.prisma.oleoFrituraRecord.findUnique({ where: { id }, select: { clientId: true } });
    if (!rec) throw new NotFoundException('Registo não encontrado');
    if (actor.role !== Role.SUPER_ADMIN && rec.clientId !== actor.clientId) {
      throw new ForbiddenException('Acesso negado a este registo');
    }
    return this.prisma.oleoFrituraRecord.delete({ where: { id } });
  }
}
