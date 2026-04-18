import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AuthUser } from '../common/types/auth-user.type';
import { CreateOleoDto } from './dto/create-oleo.dto';
import { OleosService } from './oleos.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('registos/oleos')
export class OleosController {
  constructor(private readonly service: OleosService) {}

  @Get()
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('clientId') clientId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const id = user.role === Role.SUPER_ADMIN ? clientId ?? user.clientId : user.clientId;
    return this.service.findAll(id, startDate, endDate, page ? +page : 1, limit ? +limit : 50);
  }

  @Post()
  create(@Body() dto: CreateOleoDto, @CurrentUser() user: AuthUser) {
    return this.service.create(dto, user.id, user.clientId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
