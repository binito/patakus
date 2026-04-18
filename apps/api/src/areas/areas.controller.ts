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
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AuthUser } from '../common/types/auth-user.type';
import { AreasService } from './areas.service';
import { CreateAreaDto } from './dto/create-area.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('areas')
export class AreasController {
  constructor(private readonly areasService: AreasService) {}

  @Roles(Role.SUPER_ADMIN, Role.CLIENT_ADMIN)
  @Post()
  create(@Body() dto: CreateAreaDto, @CurrentUser() user: AuthUser) {
    return this.areasService.create(dto, user);
  }

  @Get()
  findAll(@TenantId() clientId: string, @CurrentUser() user: AuthUser) {
    return this.areasService.findAll(user.role === Role.SUPER_ADMIN ? (clientId || undefined) : clientId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.areasService.findOne(id, user);
  }

  @Roles(Role.SUPER_ADMIN, Role.CLIENT_ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: Partial<CreateAreaDto>, @CurrentUser() user: AuthUser) {
    return this.areasService.update(id, dto, user);
  }

  @Roles(Role.SUPER_ADMIN, Role.CLIENT_ADMIN)
  @Delete(':id')
  deactivate(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.areasService.deactivate(id, user);
  }

  @Roles(Role.SUPER_ADMIN, Role.CLIENT_ADMIN)
  @Delete(':id/delete')
  delete(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.areasService.delete(id, user);
  }
}
