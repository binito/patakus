import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
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
    const [data, total] = await this.prisma.$transaction([
      this.prisma.oleoFrituraRecord.findMany({
        where,
        orderBy: { data: 'desc' },
        include: { responsavel: { select: { id: true, name: true } } },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.oleoFrituraRecord.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async remove(id: string) {
    return this.prisma.oleoFrituraRecord.delete({ where: { id } });
  }
}
