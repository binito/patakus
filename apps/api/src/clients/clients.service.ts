import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/types/auth-user.type';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateClientDto) {
    if (dto.nif) {
      const existe = await this.prisma.client.findUnique({ where: { nif: dto.nif } });
      if (existe) throw new ConflictException('NIF já registado');
    }
    return this.prisma.client.create({ data: dto });
  }

  async findAll() {
    return this.prisma.client.findMany({ orderBy: { name: 'asc' } });
  }

  async findOne(id: string, actor?: AuthUser) {
    if (actor && actor.role === Role.CLIENT_ADMIN && actor.clientId !== id) {
      throw new ForbiddenException('Acesso negado a este cliente');
    }
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: { areas: true },
    });
    if (!client) throw new NotFoundException('Cliente não encontrado');
    return client;
  }

  async update(id: string, data: UpdateClientDto) {
    await this.findOne(id);
    return this.prisma.client.update({ where: { id }, data });
  }

  async deactivate(id: string) {
    await this.findOne(id);
    return this.prisma.client.update({
      where: { id },
      data: { active: false },
      select: { id: true, active: true },
    });
  }
}
