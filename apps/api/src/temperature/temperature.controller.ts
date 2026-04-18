import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AuthUser } from '../common/types/auth-user.type';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { RecordTemperatureDto } from './dto/record-temperature.dto';
import { TemperatureService } from './temperature.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('temperature')
export class TemperatureController {
  constructor(private readonly temperatureService: TemperatureService) {}

  @Get('equipment')
  findAllEquipment(@TenantId() clientId: string, @CurrentUser() user: AuthUser) {
    return this.temperatureService.findAllEquipment(
      user.role === Role.SUPER_ADMIN ? (clientId || undefined) : clientId,
    );
  }

  @Roles(Role.SUPER_ADMIN, Role.CLIENT_ADMIN)
  @Post('equipment')
  createEquipment(@Body() dto: CreateEquipmentDto, @CurrentUser() user: AuthUser) {
    return this.temperatureService.createEquipment(dto, user);
  }

  @Roles(Role.SUPER_ADMIN, Role.CLIENT_ADMIN)
  @Patch('equipment/:id')
  updateEquipment(@Param('id') id: string, @Body() dto: Partial<CreateEquipmentDto>, @CurrentUser() user: AuthUser) {
    return this.temperatureService.updateEquipment(id, dto, user);
  }

  @Roles(Role.SUPER_ADMIN, Role.CLIENT_ADMIN)
  @Delete('equipment/:id')
  deleteEquipment(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.temperatureService.deleteEquipment(id, user);
  }

  @Post('records')
  record(@Body() dto: RecordTemperatureDto, @CurrentUser() user: AuthUser) {
    return this.temperatureService.recordTemperature(dto, user.id, user);
  }

  @Get('records')
  getRecords(
    @Query('equipmentId') equipmentId: string,
    @Query('date') date: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @CurrentUser() user: AuthUser,
  ) {
    const clientId = user.role === Role.SUPER_ADMIN ? undefined : user.clientId ?? undefined;
    return this.temperatureService.getRecords(equipmentId, date, clientId, startDate, endDate);
  }

  @Get('today')
  getToday(@TenantId() clientId: string) {
    return this.temperatureService.getTodayStatus(clientId);
  }
}
