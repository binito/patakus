import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/types/auth-user.type';
import { SharesService } from './shares.service';
import { CreateShareDto } from './dto/create-share.dto';

@Controller('shares')
export class SharesController {
  constructor(private readonly sharesService: SharesService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateShareDto, @CurrentUser() user: AuthUser) {
    return this.sharesService.create(dto, user);
  }

  // Público — sem autenticação
  @Get(':id')
  getPublic(@Param('id') id: string) {
    return this.sharesService.getPublicShare(id);
  }
}
