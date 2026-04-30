import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Role, OrderStatus } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AuthUser } from '../common/types/auth-user.type';
import { CursorPaginationDto } from '../common/dto/pagination.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrdersService } from './orders.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Roles(Role.SUPER_ADMIN, Role.CLIENT_ADMIN)
  @Post()
  create(@Body() dto: CreateOrderDto, @CurrentUser() user: AuthUser) {
    return this.ordersService.create(dto, user);
  }

  @Roles(Role.SUPER_ADMIN, Role.CLIENT_ADMIN)
  @Get()
  findAll(
    @TenantId() clientId: string,
    @Query() pagination: CursorPaginationDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.ordersService.findAll(
      user.role === Role.SUPER_ADMIN ? (clientId || undefined) : clientId,
      pagination,
    );
  }

  @Roles(Role.SUPER_ADMIN, Role.CLIENT_ADMIN)
  @Get('suggestions')
  getSuggestions(@TenantId() clientId: string) {
    return this.ordersService.getSuggestions(clientId);
  }

  @Roles(Role.SUPER_ADMIN, Role.CLIENT_ADMIN)
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.ordersService.findOne(id, user);
  }

  @Roles(Role.SUPER_ADMIN, Role.CLIENT_ADMIN)
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: OrderStatus,
    @Body('deliveredAt') deliveredAt: Date,
    @CurrentUser() user: AuthUser,
  ) {
    return this.ordersService.updateStatus(id, status, deliveredAt, user);
  }
}
