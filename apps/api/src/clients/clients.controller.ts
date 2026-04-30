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
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AuthUser } from '../common/types/auth-user.type';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

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

  @Roles(Role.SUPER_ADMIN, Role.CLIENT_ADMIN)
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.clientsService.findOne(id, user);
  }

  @Roles(Role.SUPER_ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateClientDto) {
    return this.clientsService.update(id, dto);
  }

  @Roles(Role.SUPER_ADMIN)
  @Delete(':id/permanent')
  permanentDelete(@Param('id') id: string) {
    return this.clientsService.permanentDelete(id);
  }

  @Roles(Role.SUPER_ADMIN)
  @Delete(':id')
  deactivate(@Param('id') id: string) {
    return this.clientsService.deactivate(id);
  }
}
