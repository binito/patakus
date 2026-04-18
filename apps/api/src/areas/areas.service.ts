import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAreaDto } from './dto/create-area.dto';

@Injectable()
export class AreasService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateAreaDto) {
    return this.prisma.area.create({ data: dto });
  }

  async findAll(clientId?: string) {
    return this.prisma.area.findMany({
      where: clientId ? { clientId } : undefined,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const area = await this.prisma.area.findUnique({
      where: { id },
      include: { checklistTemplates: true },
    });
    if (!area) throw new NotFoundException('Área não encontrada');
    return area;
  }

  async update(id: string, data: Partial<CreateAreaDto>) {
    await this.findOne(id);
    return this.prisma.area.update({ where: { id }, data });
  }

  async deactivate(id: string) {
    await this.findOne(id);
    return this.prisma.area.update({
      where: { id },
      data: { active: false },
      select: { id: true, active: true },
    });
  }

  async delete(id: string) {
    await this.findOne(id);

    const [entries, anomalies] = await Promise.all([
      this.prisma.checklistEntry.count({ where: { areaId: id } }),
      this.prisma.anomalyReport.count({ where: { areaId: id } }),
    ]);

    if (entries > 0 || anomalies > 0) {
      throw new BadRequestException(
        `Não é possível eliminar esta área porque tem ${entries} registo(s) de checklist e ${anomalies} anomalia(s) associadas.`,
      );
    }

    await this.prisma.checklistTemplate.deleteMany({ where: { areaId: id } });
    await this.prisma.area.delete({ where: { id } });
    return { id };
  }
}
