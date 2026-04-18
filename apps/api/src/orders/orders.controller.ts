import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role, OrderStatus } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrdersService } from './orders.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // SUPER_ADMIN e CLIENT_ADMIN podem criar encomendas
  @Roles(Role.SUPER_ADMIN, Role.CLIENT_ADMIN)
  @Post()
  create(@Body() dto: CreateOrderDto, @CurrentUser() user: any) {
    // CLIENT_ADMIN usa sempre o seu próprio clientId
    if (user.role === Role.CLIENT_ADMIN) {
      dto.clientId = user.clientId;
    }
    return this.ordersService.create(dto);
  }

  @Roles(Role.SUPER_ADMIN, Role.CLIENT_ADMIN)
  @Get()
  findAll(@Query('clientId') clientId: string, @CurrentUser() user: any) {
    const cId =
      user.role === Role.CLIENT_ADMIN ? user.clientId : clientId;
    return this.ordersService.findAll(cId);
  }

  @Roles(Role.SUPER_ADMIN, Role.CLIENT_ADMIN)
  @Get('suggestions')
  getSuggestions(@Query('clientId') clientId: string, @CurrentUser() user: any) {
    const cId =
      user.role === Role.CLIENT_ADMIN ? user.clientId : clientId;
    return this.ordersService.getSuggestions(cId);
  }

  @Roles(Role.SUPER_ADMIN, Role.CLIENT_ADMIN)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  // Atualizar estado da encomenda (ex: CONFIRMED, DELIVERED, CANCELLED)
  @Roles(Role.SUPER_ADMIN, Role.CLIENT_ADMIN)
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: OrderStatus,
    @Body('deliveredAt') deliveredAt: Date,
  ) {
    return this.ordersService.updateStatus(id, status, deliveredAt);
  }
}
