import { Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateOrderDto) {
    const { items, ...orderData } = dto;

    // Calcular valor total da encomenda
    const totalAmount = items.reduce(
      (sum, i) => sum + i.quantity * (i.unitPrice ?? 0),
      0,
    );

    return this.prisma.order.create({
      data: {
        ...orderData,
        totalAmount: totalAmount || undefined,
        items: {
          create: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            notes: i.notes,
          })),
        },
      },
      include: { items: { include: { product: true } } },
    });
  }

  async findAll(clientId?: string) {
    return this.prisma.order.findMany({
      where: clientId ? { clientId } : undefined,
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: { include: { product: true } }, client: true },
    });
    if (!order) throw new NotFoundException('Encomenda não encontrada');
    return order;
  }

  async updateStatus(id: string, status: OrderStatus, deliveredAt?: Date) {
    await this.findOne(id);
    return this.prisma.order.update({
      where: { id },
      data: {
        status,
        deliveredAt: status === OrderStatus.DELIVERED ? (deliveredAt ?? new Date()) : undefined,
      },
    });
  }

  /**
   * Calcula o consumo médio mensal por produto para um cliente
   * e sugere quantidades de reencomenda com base nos últimos 3 meses.
   */
  async getSuggestions(clientId: string) {
    // Data limite: 3 meses atrás
    const tresMesesAtras = new Date();
    tresMesesAtras.setMonth(tresMesesAtras.getMonth() - 3);

    const consumptions = await this.prisma.consumption.findMany({
      where: {
        clientId,
        date: { gte: tresMesesAtras },
      },
      include: { product: true },
    });

    if (!consumptions.length) return [];

    // Agrupar consumo por produto
    const porProduto = consumptions.reduce(
      (acc, c) => {
        if (!acc[c.productId]) {
          acc[c.productId] = { product: c.product, totalQty: 0, count: 0 };
        }
        acc[c.productId].totalQty += c.quantity;
        acc[c.productId].count += 1;
        return acc;
      },
      {} as Record<string, { product: any; totalQty: number; count: number }>,
    );

    // Buscar stocks atuais do cliente
    const stocks = await this.prisma.consumableStock.findMany({
      where: { clientId },
    });
    const stockMap = Object.fromEntries(stocks.map((s) => [s.productId, s.quantity]));

    // Calcular média mensal e sugestão de reencomenda
    const sugestoes = Object.values(porProduto).map(({ product, totalQty }) => {
      const mediaMensal = totalQty / 3;
      const stockAtual = stockMap[product.id] ?? 0;
      // Sugerir para cobrir 2 meses, descontando stock atual
      const sugestao = Math.max(0, mediaMensal * 2 - stockAtual);
      return {
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        unit: product.unit,
        mediaMensalConsumo: Math.round(mediaMensal * 100) / 100,
        stockAtual,
        quantidadeSugerida: Math.ceil(sugestao),
      };
    });

    // Ordenar por maior necessidade
    return sugestoes.sort((a, b) => b.quantidadeSugerida - a.quantidadeSugerida);
  }
}
