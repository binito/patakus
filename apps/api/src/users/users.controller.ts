import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UsersService } from './users.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Apenas SUPER_ADMIN e CLIENT_ADMIN podem criar utilizadores
  @Roles(Role.SUPER_ADMIN, Role.CLIENT_ADMIN)
  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  // SUPER_ADMIN vê todos; CLIENT_ADMIN filtra pelo seu cliente
  @Roles(Role.SUPER_ADMIN, Role.CLIENT_ADMIN)
  @Get()
  findAll(@Query('clientId') clientId: string, @CurrentUser() user: any) {
    const filter =
      user.role === Role.CLIENT_ADMIN ? user.clientId : clientId;
    return this.usersService.findAll(filter);
  }

  @Roles(Role.SUPER_ADMIN, Role.CLIENT_ADMIN)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Roles(Role.SUPER_ADMIN, Role.CLIENT_ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: Partial<CreateUserDto>) {
    return this.usersService.update(id, dto);
  }

  // Desativar utilizador (soft delete)
  @Roles(Role.SUPER_ADMIN, Role.CLIENT_ADMIN)
  @Delete(':id')
  deactivate(@Param('id') id: string) {
    return this.usersService.deactivate(id);
  }
}
