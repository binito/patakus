import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AuthUser } from '../common/types/auth-user.type';
import { CreateEntradaDto } from './dto/create-entrada.dto';
import { EntradasService } from './entradas.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('registos/entradas')
export class EntradasController {
  constructor(private readonly service: EntradasService) {}

  @Get()
  findAll(
    @TenantId() clientId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.findAll(clientId, startDate, endDate, page ? +page : 1, limit ? +limit : 50);
  }

  @Post()
  create(@Body() dto: CreateEntradaDto, @CurrentUser() user: AuthUser) {
    if (!user.clientId && user.role !== Role.SUPER_ADMIN) {
      throw new Error('Utilizador sem cliente associado');
    }
    return this.service.create(dto, user.id, user.clientId!);
  }

  @Roles(Role.SUPER_ADMIN, Role.CLIENT_ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.service.remove(id, user);
  }
}
