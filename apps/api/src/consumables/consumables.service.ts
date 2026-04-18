import { Injectable, NotFoundException } from '@nestjs/common';
import { ConsumableStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConsumableReportDto } from './dto/create-consumable-report.dto';

@Injectable()
export class ConsumablesService {
  constructor(private prisma: PrismaService) {}

  // ── Stock ──────────────────────────────────────────────────────────────────

  async getStock(clientId: string) {
    return this.prisma.consumableStock.findMany({
      where: { clientId },
      include: { product: true },
      orderBy: { product: { name: 'asc' } },
    });
  }

  async upsertStock(clientId: string, productId: string, quantity: number, minQuantity?: number) {
    return this.prisma.consumableStock.upsert({
      where: { clientId_productId: { clientId, productId } },
      create: { clientId, productId, quantity, minQuantity: minQuantity ?? 0 },
      update: { quantity, ...(minQuantity !== undefined ? { minQuantity } : {}) },
      include: { product: true },
    });
  }

  async removeStock(id: string) {
    // Remover relatórios de falta associados primeiro
    await this.prisma.consumableReport.deleteMany({ where: { stockId: id } });
    await this.prisma.consumableStock.delete({ where: { id } });
    return { deleted: true };
  }

  async getStockAll() {
    return this.prisma.consumableStock.findMany({
      include: {
        product: true,
        client: { select: { id: true, name: true } },
      },
      orderBy: [{ client: { name: 'asc' } }, { product: { name: 'asc' } }],
    });
  }

  // ── Reportes de Escassez ───────────────────────────────────────────────────

  async createReport(dto: CreateConsumableReportDto, reporterId: string) {
    // Verificar se o stock existe
    const stock = await this.prisma.consumableStock.findUnique({
      where: { id: dto.stockId },
    });
    if (!stock) throw new NotFoundException('Stock não encontrado');

    return this.prisma.consumableReport.create({
      data: {
        stockId: dto.stockId,
        quantity: dto.quantity,
        notes: dto.notes,
        reporterId,
      },
      include: { stock: { include: { product: true } } },
    });
  }

  async findReports(clientId?: string) {
    return this.prisma.consumableReport.findMany({
      where: clientId ? { stock: { clientId } } : undefined,
      include: {
        stock: { include: { product: true } },
        reporter: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateReportStatus(id: string, status: ConsumableStatus) {
    return this.prisma.consumableReport.update({
      where: { id },
      data: { status },
    });
  }

  async getLowStockAlerts(clientId: string) {
    const stocks = await this.prisma.consumableStock.findMany({
      where: { clientId },
      include: { product: { select: { name: true, unit: true, sku: true } } },
    });
    return stocks.filter((s) => s.quantity <= s.minQuantity);
  }
}
