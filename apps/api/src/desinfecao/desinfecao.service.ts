import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
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
    const [data, total] = await this.prisma.$transaction([
      this.prisma.desinfecaoRecord.findMany({
        where,
        orderBy: { data: 'desc' },
        include: { operator: { select: { id: true, name: true } } },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.desinfecaoRecord.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async remove(id: string) {
    return this.prisma.desinfecaoRecord.delete({ where: { id } });
  }
}
