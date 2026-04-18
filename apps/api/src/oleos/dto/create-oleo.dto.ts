import { IsString, IsOptional, IsNumber, IsDateString, IsInt, Min, Max } from 'class-validator';

export class CreateOleoDto {
  @IsDateString()
  data: string;

  @IsString()
  fritadeira: string;

  @IsNumber()
  temperatura: number;

  @IsInt()
  @Min(1)
  @Max(5)
  resultado: number; // 1=<5% Bom, 2=6-12%, 3=13-16%, 4=17-23%, 5=>24% Mau

  @IsOptional()
  @IsString()
  acoes?: string;
}
