import { IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateDesinfecaoDto {
  @IsDateString()
  data: string;

  @IsString()
  generosAlimenticios: string;

  @IsString()
  nomeDesinfetante: string;

  @IsString()
  dose: string;

  @IsString()
  quantidadeAgua: string;

  @IsString()
  tempoAtuacao: string;

  @IsOptional()
  @IsString()
  observacoes?: string;
}
