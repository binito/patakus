import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { RecordTemperatureDto } from './dto/record-temperature.dto';
import { TemperatureService } from './temperature.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('temperature')
export class TemperatureController {
  constructor(private readonly temperatureService: TemperatureService) {}

  @Get('equipment')
  findAllEquipment(@Query('clientId') clientId: string, @CurrentUser() user: any) {
    const filter = user.role === Role.SUPER_ADMIN ? clientId : user.clientId;
    return this.temperatureService.findAllEquipment(filter);
  }

  @Roles(Role.SUPER_ADMIN, Role.CLIENT_ADMIN)
  @Post('equipment')
  createEquipment(@Body() dto: CreateEquipmentDto, @CurrentUser() user: any) {
    if (user.role !== Role.SUPER_ADMIN) dto.clientId = user.clientId;
    return this.temperatureService.createEquipment(dto);
  }

  @Roles(Role.SUPER_ADMIN, Role.CLIENT_ADMIN)
  @Patch('equipment/:id')
  updateEquipment(@Param('id') id: string, @Body() dto: Partial<CreateEquipmentDto>) {
    return this.temperatureService.updateEquipment(id, dto);
  }

  @Roles(Role.SUPER_ADMIN, Role.CLIENT_ADMIN)
  @Delete('equipment/:id')
  deleteEquipment(@Param('id') id: string) {
    return this.temperatureService.deleteEquipment(id);
  }

  @Post('records')
  record(@Body() dto: RecordTemperatureDto, @CurrentUser() user: any) {
    return this.temperatureService.recordTemperature(dto, user.id);
  }

  @Get('records')
  getRecords(
    @Query('equipmentId') equipmentId: string,
    @Query('date') date: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @CurrentUser() user: any,
  ) {
    const clientId = user.role === Role.SUPER_ADMIN ? undefined : user.clientId;
    return this.temperatureService.getRecords(equipmentId, date, clientId, startDate, endDate);
  }

  @Get('today')
  getToday(@CurrentUser() user: any, @Query('clientId') clientId: string) {
    const id = user.role === Role.SUPER_ADMIN ? clientId : user.clientId;
    return this.temperatureService.getTodayStatus(id);
  }
}
