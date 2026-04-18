import { IsString, IsOptional, IsBoolean, IsNumber, IsDateString } from 'class-validator';

export class CreateEntradaDto {
  @IsDateString()
  data: string;

  @IsString()
  materiaPrima: string;

  @IsString()
  fornecedor: string;

  @IsOptional()
  @IsString()
  faturaN?: string;

  @IsBoolean()
  veiculoOk: boolean;

  @IsBoolean()
  embalagemOk: boolean;

  @IsBoolean()
  rotulagemOk: boolean;

  @IsBoolean()
  produtoOk: boolean;

  @IsOptional()
  @IsNumber()
  temperatura?: number;

  @IsOptional()
  @IsString()
  lote?: string;

  @IsOptional()
  @IsString()
  observacoes?: string;
}
