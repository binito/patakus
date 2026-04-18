import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/types/auth-user.type';
import { assertOwnership } from '../common/utils/tenant.util';
import { CreateAreaDto } from './dto/create-area.dto';

@Injectable()
export class AreasService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateAreaDto, actor: AuthUser) {
    if (actor.role === Role.CLIENT_ADMIN) {
      dto.clientId = actor.clientId!;
    }
    return this.prisma.area.create({ data: dto });
  }

  async findAll(clientId?: string) {
    return this.prisma.area.findMany({
      where: clientId ? { clientId } : undefined,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string, actor?: AuthUser) {
    const area = await this.prisma.area.findUnique({
      where: { id },
      include: { checklistTemplates: true },
    });
    if (!area) throw new NotFoundException('Área não encontrada');
    if (actor) assertOwnership(actor, area.clientId);
    return area;
  }

  async update(id: string, data: Partial<CreateAreaDto>, actor: AuthUser) {
    await this.findOne(id, actor);
    return this.prisma.area.update({ where: { id }, data });
  }

  async deactivate(id: string, actor: AuthUser) {
    await this.findOne(id, actor);
    return this.prisma.area.update({
      where: { id },
      data: { active: false },
      select: { id: true, active: true },
    });
  }

  async delete(id: string, actor: AuthUser) {
    await this.findOne(id, actor);

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
