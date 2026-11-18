import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AuthUser } from '../common/types/auth-user.type';
import { CompletePasswordResetDto, ResetTokenDto } from './password-resets.dto';
import { PasswordResetsService } from './password-resets.service';

@Controller()
export class PasswordResetsController {
  constructor(private readonly resets: PasswordResetsService) {}

  @Post('users/:id/password-reset')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.CLIENT_ADMIN)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  create(@Param('id') id: string, @CurrentUser() actor: AuthUser) {
    return this.resets.create(id, actor);
  }

  @Post('password-resets/validate')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  validate(@Body() dto: ResetTokenDto) {
    return this.resets.validate(dto.token);
  }

  @Post('password-resets/complete')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  complete(@Body() dto: CompletePasswordResetDto) {
    return this.resets.complete(dto.token, dto.password);
  }
}
