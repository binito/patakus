import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateProductDto) {
    if (dto.sku) {
      const existe = await this.prisma.product.findUnique({ where: { sku: dto.sku } });
      if (existe) throw new ConflictException('SKU já existe');
    }
    return this.prisma.product.create({ data: dto });
  }

  async findAll(category?: string) {
    return this.prisma.product.findMany({
      where: {
        active: true,
        ...(category ? { category } : {}),
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Produto não encontrado');
    return product;
  }

  async update(id: string, data: Partial<CreateProductDto>) {
    await this.findOne(id);
    return this.prisma.product.update({ where: { id }, data });
  }

  async deactivate(id: string) {
    await this.findOne(id);
    return this.prisma.product.update({
      where: { id },
      data: { active: false },
      select: { id: true, active: true },
    });
  }

  async importFromCsv(buffer: Buffer): Promise<{ created: number; updated: number; skipped: number }> {
    const text = buffer.toString('utf-8');

    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    // Ignorar cabeçalho
    const dataLines = lines.slice(1);

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const line of dataLines) {
      // Parsear CSV com delimitador ";" e aspas
      const cols = line.split(';').map((c) => c.replace(/^"|"$/g, '').trim());
      // Estrutura: [vazio, sku, nome, família, sub-família, marca, stock, stockTécnico, custMédio, preçoVenda, pvpIva, margem, valorLucro, estado, tipoArtigo, vazio]
      const sku  = cols[1];
      const nome = cols[2];
      const familia = cols[3];
      const marca = cols[5];
      const precoVenda = cols[9];
      const tipoArtigo = cols[14]; // N=produto, S=serviço

      // Ignorar linhas inválidas ou serviços
      if (!sku || !nome || sku === '.' || tipoArtigo === 'S') {
        skipped++;
        continue;
      }

      const price = precoVenda ? parseFloat(precoVenda.replace(',', '.')) : null;
      const category = familia || null;
      const description = marca || null;

      const existing = await this.prisma.product.findUnique({ where: { sku } });
      if (existing) {
        await this.prisma.product.update({
          where: { sku },
          data: { name: nome, category, description, price, active: true },
        });
        updated++;
      } else {
        await this.prisma.product.create({
          data: { sku, name: nome, category, description, price, active: true },
        });
        created++;
      }
    }

    return { created, updated, skipped };
  }
}
