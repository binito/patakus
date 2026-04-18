import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  // Apenas SUPER_ADMIN gere clientes
  @Roles(Role.SUPER_ADMIN)
  @Post()
  create(@Body() dto: CreateClientDto) {
    return this.clientsService.create(dto);
  }

  @Roles(Role.SUPER_ADMIN)
  @Get()
  findAll() {
    return this.clientsService.findAll();
  }

  // CLIENT_ADMIN pode ver o detalhe do seu próprio cliente
  @Roles(Role.SUPER_ADMIN, Role.CLIENT_ADMIN)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.clientsService.findOne(id);
  }

  @Roles(Role.SUPER_ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: Partial<CreateClientDto>) {
    return this.clientsService.update(id, dto);
  }

  // Desativar cliente (soft delete)
  @Roles(Role.SUPER_ADMIN)
  @Delete(':id')
  deactivate(@Param('id') id: string) {
    return this.clientsService.deactivate(id);
  }
}
