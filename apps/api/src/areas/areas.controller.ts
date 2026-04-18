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
import { AreasService } from './areas.service';
import { CreateAreaDto } from './dto/create-area.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('areas')
export class AreasController {
  constructor(private readonly areasService: AreasService) {}

  @Roles(Role.SUPER_ADMIN, Role.CLIENT_ADMIN)
  @Post()
  create(@Body() dto: CreateAreaDto) {
    return this.areasService.create(dto);
  }

  // OPERATOR pode listar áreas do seu cliente para submeter checklists
  @Get()
  findAll(@Query('clientId') clientId: string, @CurrentUser() user: any) {
    const filter =
      user.role === Role.SUPER_ADMIN ? clientId : user.clientId;
    return this.areasService.findAll(filter);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.areasService.findOne(id);
  }

  @Roles(Role.SUPER_ADMIN, Role.CLIENT_ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: Partial<CreateAreaDto>) {
    return this.areasService.update(id, dto);
  }

  @Roles(Role.SUPER_ADMIN, Role.CLIENT_ADMIN)
  @Delete(':id')
  deactivate(@Param('id') id: string) {
    return this.areasService.deactivate(id);
  }

  @Roles(Role.SUPER_ADMIN, Role.CLIENT_ADMIN)
  @Delete(':id/delete')
  delete(@Param('id') id: string) {
    return this.areasService.delete(id);
  }
}
