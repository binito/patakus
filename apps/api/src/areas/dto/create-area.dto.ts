import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAreaDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  // Piso onde a área se encontra
  @IsString()
  @IsOptional()
  floor?: string;

  @IsString()
  @IsNotEmpty()
  clientId: string;
}
