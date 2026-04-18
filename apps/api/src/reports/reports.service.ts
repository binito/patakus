import { Injectable, NotFoundException } from '@nestjs/common';
import { AnomalyStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAnomalyDto } from './dto/create-anomaly.dto';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async createAnomaly(
    dto: CreateAnomalyDto,
    reporterId: string,
    files: Express.Multer.File[],
  ) {
    const report = await this.prisma.anomalyReport.create({
      data: {
        title: dto.title,
        description: dto.description,
        severity: dto.severity,
        areaId: dto.areaId,
        reporterId,
        // Guardar referências das fotos enviadas
        photos: {
          create: files.map((f) => ({
            filename: f.filename,
            url: `/uploads/${f.filename}`,
          })),
        },
      },
      include: { photos: true, area: true },
    });
    return report;
  }

  async findAll(clientId?: string, areaId?: string, status?: AnomalyStatus) {
    return this.prisma.anomalyReport.findMany({
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
    });
  }

  async findOne(id: string) {
    const report = await this.prisma.anomalyReport.findUnique({
      where: { id },
      include: { photos: true, area: true, reporter: { select: { name: true } } },
    });
    if (!report) throw new NotFoundException('Relatório não encontrado');
    return report;
  }

  async updateStatus(
    id: string,
    status: AnomalyStatus,
    resolvedNote?: string,
  ) {
    await this.findOne(id);
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
