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
import { ChecklistsService } from './checklists.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { SubmitChecklistDto } from './dto/submit-checklist.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('checklists')
export class ChecklistsController {
  constructor(private readonly checklistsService: ChecklistsService) {}

  // ── Templates ──────────────────────────────────────────────────────────────

  // Apenas SUPER_ADMIN e CLIENT_ADMIN criam templates
  @Roles(Role.SUPER_ADMIN, Role.CLIENT_ADMIN)
  @Post('templates')
  createTemplate(@Body() dto: CreateTemplateDto) {
    return this.checklistsService.createTemplate(dto);
  }

  // Todos os papéis podem consultar templates (necessário para o OPERATOR submeter)
  @Get('templates')
  findAllTemplates(@Query('areaId') areaId: string, @CurrentUser() user: any) {
    const clientId = user.role === Role.SUPER_ADMIN ? undefined : user.clientId;
    return this.checklistsService.findAllTemplates(areaId, clientId);
  }

  @Get('templates/:id')
  findOneTemplate(@Param('id') id: string) {
    return this.checklistsService.findOneTemplate(id);
  }

  @Roles(Role.SUPER_ADMIN, Role.CLIENT_ADMIN)
  @Patch('templates/:id')
  updateTemplate(@Param('id') id: string, @Body() dto: any) {
    return this.checklistsService.updateTemplate(id, dto);
  }

  @Roles(Role.SUPER_ADMIN, Role.CLIENT_ADMIN)
  @Delete('templates/:id')
  deleteTemplate(@Param('id') id: string) {
    return this.checklistsService.deleteTemplate(id);
  }

  // ── Submissões ─────────────────────────────────────────────────────────────

  // Todos os papéis podem submeter (OPERATOR é o caso principal)
  @Post('submit')
  submitChecklist(
    @Body() dto: SubmitChecklistDto,
    @CurrentUser() user: any,
  ) {
    return this.checklistsService.submitChecklist(dto, user.id);
  }

  // Listagem de entradas: SUPER_ADMIN vê tudo, os outros filtram pelo seu cliente
  @Get('entries')
  findEntries(@Query('clientId') clientId: string, @Query('areaId') areaId: string, @CurrentUser() user: any) {
    const cId =
      user.role === Role.SUPER_ADMIN ? clientId : user.clientId;
    return this.checklistsService.findEntries(cId, areaId);
  }

  @Get('entries/:id')
  findOneEntry(@Param('id') id: string) {
    return this.checklistsService.findOneEntry(id);
  }
}
