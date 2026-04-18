import { IsString, IsOptional, IsDateString, IsObject } from 'class-validator';

export class CreateHigienizacaoDto {
  @IsString()
  zona: string; // COZINHA | PRODUCAO | ARMAZEM | SERVICO

  @IsDateString()
  dia: string;

  @IsObject()
  itens: Record<string, boolean>;

  @IsOptional()
  @IsString()
  observacoes?: string;
}
