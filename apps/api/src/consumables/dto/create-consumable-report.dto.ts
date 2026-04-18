import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateConsumableReportDto {
  // ID do registo de stock (ConsumableStock) para o qual se reporta escassez
  @IsString()
  @IsNotEmpty()
  stockId: string;

  // Quantidade estimada em falta
  @IsNumber()
  @Min(0)
  @IsOptional()
  quantity?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
