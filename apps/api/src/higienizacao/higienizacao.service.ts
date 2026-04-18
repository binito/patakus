import { Injectable } from '@nestjs/common';
import { HigienizacaoZona } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { buildDateRange } from '../common/utils/date-range.util';
import { CreateHigienizacaoDto } from './dto/create-higienizacao.dto';

@Injectable()
export class HigienizacaoService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateHigienizacaoDto, operatorId: string, clientId: string) {
    return this.prisma.higienizacaoRecord.create({
      data: {
        zona: dto.zona as HigienizacaoZona,
        dia: new Date(dto.dia),
        itens: dto.itens,
        observacoes: dto.observacoes,
        clientId,
        operatorId,
      },
      include: { operator: { select: { id: true, name: true } } },
    });
  }

  async findAll(clientId: string, zona?: string, startDate?: string, endDate?: string, page = 1, limit = 50) {
    const dateRange = buildDateRange(startDate, endDate);
    const where = {
      ...(clientId ? { clientId } : {}),
      ...(zona ? { zona: zona as HigienizacaoZona } : {}),
      ...(dateRange ? { dia: dateRange } : {}),
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.higienizacaoRecord.findMany({
        where,
        orderBy: { dia: 'desc' },
        include: { operator: { select: { id: true, name: true } } },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.higienizacaoRecord.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async remove(id: string) {
    return this.prisma.higienizacaoRecord.delete({ where: { id } });
  }
}
