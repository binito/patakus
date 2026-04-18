import { Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/types/auth-user.type';
import { assertOwnership } from '../common/utils/tenant.util';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateOrderDto, actor: AuthUser) {
    if (actor.role === Role.CLIENT_ADMIN) dto.clientId = actor.clientId!;

    const { items, ...orderData } = dto;
    const totalAmount = items.reduce((sum, i) => sum + i.quantity * (i.unitPrice ?? 0), 0);

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
      take: 200,
    });
  }

  async findOne(id: string, actor: AuthUser) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: { include: { product: true } }, client: true },
    });
    if (!order) throw new NotFoundException('Encomenda não encontrada');
    assertOwnership(actor, order.clientId);
    return order;
  }

  async updateStatus(id: string, status: OrderStatus, deliveredAt: Date | undefined, actor: AuthUser) {
    await this.findOne(id, actor);
    return this.prisma.order.update({
      where: { id },
      data: {
        status,
        deliveredAt: status === OrderStatus.DELIVERED ? (deliveredAt ?? new Date()) : undefined,
      },
    });
  }

  async getSuggestions(clientId: string) {
    const tresMesesAtras = new Date();
    tresMesesAtras.setMonth(tresMesesAtras.getMonth() - 3);

    const consumptions = await this.prisma.consumption.findMany({
      where: { clientId, date: { gte: tresMesesAtras } },
      include: { product: true },
    });

    if (!consumptions.length) return [];

    const porProduto = consumptions.reduce(
      (acc, c) => {
        if (!acc[c.productId]) acc[c.productId] = { product: c.product, totalQty: 0 };
        acc[c.productId].totalQty += c.quantity;
        return acc;
      },
      {} as Record<string, { product: any; totalQty: number }>,
    );

    const stocks = await this.prisma.consumableStock.findMany({ where: { clientId } });
    const stockMap = Object.fromEntries(stocks.map((s) => [s.productId, s.quantity]));

    return Object.values(porProduto)
      .map(({ product, totalQty }) => {
        const mediaMensal = totalQty / 3;
        const stockAtual = stockMap[product.id] ?? 0;
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
      })
      .sort((a, b) => b.quantidadeSugerida - a.quantidadeSugerida);
  }
}
