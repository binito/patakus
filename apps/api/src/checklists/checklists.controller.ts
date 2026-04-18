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
import { ChecklistsService } from './checklists.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { SubmitChecklistDto } from './dto/submit-checklist.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('checklists')
export class ChecklistsController {
  constructor(private readonly checklistsService: ChecklistsService) {}

  // ── Templates ──────────────────────────────────────────────────────────────

  @Roles(Role.SUPER_ADMIN, Role.CLIENT_ADMIN)
  @Post('templates')
  createTemplate(@Body() dto: CreateTemplateDto, @CurrentUser() user: AuthUser) {
    return this.checklistsService.createTemplate(dto, user);
  }

  @Get('templates')
  findAllTemplates(
    @Query('areaId') areaId: string,
    @TenantId() clientId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.checklistsService.findAllTemplates(areaId, user.role === Role.SUPER_ADMIN ? undefined : clientId);
  }

  @Get('templates/:id')
  findOneTemplate(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.checklistsService.findOneTemplate(id, user);
  }

  @Roles(Role.SUPER_ADMIN, Role.CLIENT_ADMIN)
  @Patch('templates/:id')
  updateTemplate(@Param('id') id: string, @Body() dto: Partial<CreateTemplateDto>, @CurrentUser() user: AuthUser) {
    return this.checklistsService.updateTemplate(id, dto, user);
  }

  @Roles(Role.SUPER_ADMIN, Role.CLIENT_ADMIN)
  @Delete('templates/:id')
  deleteTemplate(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.checklistsService.deleteTemplate(id, user);
  }

  // ── Submissões ─────────────────────────────────────────────────────────────

  @Post('submit')
  submitChecklist(@Body() dto: SubmitChecklistDto, @CurrentUser() user: AuthUser) {
    return this.checklistsService.submitChecklist(dto, user.id, user);
  }

  @Get('entries')
  findEntries(
    @Query('areaId') areaId: string,
    @TenantId() clientId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.checklistsService.findEntries(
      user.role === Role.SUPER_ADMIN ? (clientId || undefined) : clientId,
      areaId,
    );
  }

  @Get('entries/:id')
  findOneEntry(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.checklistsService.findOneEntry(id, user);
  }
}
