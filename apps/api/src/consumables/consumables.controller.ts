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
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AuthUser } from '../common/types/auth-user.type';
import { ConsumablesService } from './consumables.service';
import { CreateConsumableReportDto } from './dto/create-consumable-report.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('consumables')
export class ConsumablesController {
  constructor(private readonly consumablesService: ConsumablesService) {}

  // ── Stock ──────────────────────────────────────────────────────────────────

  @Get('stock')
  getStock(@TenantId() clientId: string, @CurrentUser() user: AuthUser) {
    return this.consumablesService.getStock(clientId);
  }

  @Roles(Role.SUPER_ADMIN, Role.CLIENT_ADMIN)
  @Patch('stock')
  upsertStock(
    @Body('clientId') bodyClientId: string,
    @Body('productId') productId: string,
    @Body('quantity') quantity: number,
    @Body('minQuantity') minQuantity: number,
    @CurrentUser() user: AuthUser,
  ) {
    const clientId = user.role === Role.CLIENT_ADMIN ? user.clientId! : bodyClientId;
    return this.consumablesService.upsertStock(clientId, productId, quantity, minQuantity);
  }

  @Roles(Role.SUPER_ADMIN, Role.CLIENT_ADMIN)
  @Get('stock/alerts')
  getLowStockAlerts(@TenantId() clientId: string) {
    return this.consumablesService.getLowStockAlerts(clientId);
  }

  @Roles(Role.SUPER_ADMIN)
  @Get('stock/all')
  getStockAll() {
    return this.consumablesService.getStockAll();
  }

  @Roles(Role.SUPER_ADMIN, Role.CLIENT_ADMIN)
  @Delete('stock/:id')
  removeStock(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.consumablesService.removeStock(id, user);
  }

  // ── Reportes ───────────────────────────────────────────────────────────────

  @Post('reports')
  createReport(@Body() dto: CreateConsumableReportDto, @CurrentUser() user: AuthUser) {
    return this.consumablesService.createReport(dto, user.id, user);
  }

  @Get('reports')
  findReports(@TenantId() clientId: string, @CurrentUser() user: AuthUser) {
    return this.consumablesService.findReports(
      user.role === Role.SUPER_ADMIN ? (clientId || undefined) : clientId,
    );
  }

  @Roles(Role.SUPER_ADMIN, Role.CLIENT_ADMIN)
  @Patch('reports/:id/status')
  updateReportStatus(
    @Param('id') id: string,
    @Body('status') status: ConsumableStatus,
    @CurrentUser() user: AuthUser,
  ) {
    return this.consumablesService.updateReportStatus(id, status, user);
  }
}
