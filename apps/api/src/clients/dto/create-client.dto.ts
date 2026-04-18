import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateClientDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  // Número de Identificação Fiscal
  @IsString()
  @IsOptional()
  nif?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  address?: string;

  // Setor de atividade (hotel, restaurante, clínica, etc.)
  @IsString()
  @IsOptional()
  sector?: string;
}
