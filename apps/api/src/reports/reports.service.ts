import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AnomalyStatus, Role } from '@prisma/client';
import { unlink } from 'fs/promises';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/types/auth-user.type';
import { assertOwnership } from '../common/utils/tenant.util';
import { validateFileMagicBytes } from '../common/utils/file-magic.util';
import { CursorPaginationDto, PaginatedResult, paginate } from '../common/dto/pagination.dto';
import { CreateAnomalyDto } from './dto/create-anomaly.dto';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async createAnomaly(dto: CreateAnomalyDto, reporterId: string, files: Express.Multer.File[], actor: AuthUser) {
    if (files.length > 0) {
      await validateFileMagicBytes(files);
    }

    if (actor.role !== Role.SUPER_ADMIN) {
      const area = await this.prisma.area.findUnique({ where: { id: dto.areaId }, select: { clientId: true } });
      if (!area) throw new NotFoundException('Área não encontrada');
      assertOwnership(actor, area.clientId);
    }

    return this.prisma.anomalyReport.create({
      data: {
        title: dto.title,
        description: dto.description,
        severity: dto.severity,
        areaId: dto.areaId,
        reporterId,
        photos: {
          create: files.map((f) => ({
            filename: f.filename,
            url: `/uploads/${f.filename}`,
          })),
        },
      },
      include: { photos: true, area: true },
    });
  }

  async findAll(
    clientId?: string,
    areaId?: string,
    status?: AnomalyStatus,
    pagination: CursorPaginationDto = {},
  ): Promise<PaginatedResult<any>> {
    const take = pagination.take ?? 50;
    const items = await this.prisma.anomalyReport.findMany({
      where: {
        ...(areaId ? { areaId } : {}),
        ...(clientId ? { area: { clientId } } : {}),
        ...(status ? { status } : {}),
      },
      include: {
        photos: true,
        area: { select: { name: true, clientId: true } },
        reporter: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: take + 1,
      skip: pagination.cursor ? 1 : 0,
      cursor: pagination.cursor ? { id: pagination.cursor } : undefined,
    });
    return paginate(items, take);
  }

  async findOne(id: string, actor: AuthUser) {
    const report = await this.prisma.anomalyReport.findUnique({
      where: { id },
      include: { photos: true, area: true, reporter: { select: { name: true } } },
    });
    if (!report) throw new NotFoundException('Relatório não encontrado');
    assertOwnership(actor, report.area.clientId);
    return report;
  }

  async deleteAnomaly(id: string, actor: AuthUser) {
    const report = await this.findOne(id, actor);
    if (report.status !== AnomalyStatus.RESOLVED) {
      throw new BadRequestException('Só é possível apagar anomalias resolvidas');
    }

    const uploadDir = process.env.UPLOAD_DIR ?? './uploads';

    await this.prisma.anomalyPhoto.deleteMany({ where: { reportId: id } });
    await this.prisma.anomalyReport.delete({ where: { id } });

    // Limpar ficheiros do disco após commit da transacção
    await Promise.allSettled(
      report.photos.map((photo) => unlink(`${uploadDir}/${photo.filename}`)),
    );

    return { id };
  }

  async updateStatus(id: string, status: AnomalyStatus, resolvedNote: string | undefined, actor: AuthUser) {
    await this.findOne(id, actor);
    return this.prisma.anomalyReport.update({
      where: { id },
      data: {
        status,
        resolvedNote,
        resolvedAt: status === AnomalyStatus.RESOLVED ? new Date() : undefined,
      },
    });
  }
}
