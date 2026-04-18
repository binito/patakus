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
import { Role, ConsumableStatus } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { ConsumablesService } from './consumables.service';
import { CreateConsumableReportDto } from './dto/create-consumable-report.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('consumables')
export class ConsumablesController {
  constructor(private readonly consumablesService: ConsumablesService) {}

  // ── Stock ──────────────────────────────────────────────────────────────────

  // Consultar stock: SUPER_ADMIN passa clientId na query; os outros usam o seu
  @Get('stock')
  getStock(@Query('clientId') clientId: string, @CurrentUser() user: any) {
    const cId =
      user.role === Role.SUPER_ADMIN ? clientId : user.clientId;
    return this.consumablesService.getStock(cId);
  }

  // Atualizar/criar stock — apenas SUPER_ADMIN e CLIENT_ADMIN
  @Roles(Role.SUPER_ADMIN, Role.CLIENT_ADMIN)
  @Patch('stock')
  upsertStock(
    @Body('clientId') clientId: string,
    @Body('productId') productId: string,
    @Body('quantity') quantity: number,
    @Body('minQuantity') minQuantity: number,
    @CurrentUser() user: any,
  ) {
    const cId =
      user.role === Role.CLIENT_ADMIN ? user.clientId : clientId;
    return this.consumablesService.upsertStock(cId, productId, quantity, minQuantity);
  }

  // Alertas de stock baixo
  @Roles(Role.SUPER_ADMIN, Role.CLIENT_ADMIN)
  @Get('stock/alerts')
  getLowStockAlerts(@Query('clientId') clientId: string, @CurrentUser() user: any) {
    const cId =
      user.role === Role.CLIENT_ADMIN ? user.clientId : clientId;
    return this.consumablesService.getLowStockAlerts(cId);
  }

  // Todo o stock (super admin) — ver todos os clientes de uma vez
  @Roles(Role.SUPER_ADMIN)
  @Get('stock/all')
  getStockAll() {
    return this.consumablesService.getStockAll();
  }

  // Remover produto de um cliente
  @Roles(Role.SUPER_ADMIN)
  @Delete('stock/:id')
  removeStock(@Param('id') id: string) {
    return this.consumablesService.removeStock(id);
  }

  // ── Reportes ───────────────────────────────────────────────────────────────

  // Todos os papéis podem criar reportes de escassez
  @Post('reports')
  createReport(
    @Body() dto: CreateConsumableReportDto,
    @CurrentUser() user: any,
  ) {
    return this.consumablesService.createReport(dto, user.id);
  }

  @Get('reports')
  findReports(@Query('clientId') clientId: string, @CurrentUser() user: any) {
    const cId =
      user.role === Role.SUPER_ADMIN ? clientId : user.clientId;
    return this.consumablesService.findReports(cId);
  }

  @Roles(Role.SUPER_ADMIN, Role.CLIENT_ADMIN)
  @Patch('reports/:id/status')
  updateReportStatus(
    @Param('id') id: string,
    @Body('status') status: ConsumableStatus,
  ) {
    return this.consumablesService.updateReportStatus(id, status);
  }
}
