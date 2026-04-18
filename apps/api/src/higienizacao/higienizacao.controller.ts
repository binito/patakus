import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AuthUser } from '../common/types/auth-user.type';
import { CreateHigienizacaoDto } from './dto/create-higienizacao.dto';
import { HigienizacaoService } from './higienizacao.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('registos/higienizacao')
export class HigienizacaoController {
  constructor(private readonly service: HigienizacaoService) {}

  @Get()
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('zona') zona?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('clientId') clientId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const id = user.role === Role.SUPER_ADMIN ? clientId ?? user.clientId : user.clientId;
    return this.service.findAll(id, zona, startDate, endDate, page ? +page : 1, limit ? +limit : 50);
  }

  @Post()
  create(@Body() dto: CreateHigienizacaoDto, @CurrentUser() user: AuthUser) {
    return this.service.create(dto, user.id, user.clientId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
