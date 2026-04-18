import { EquipmentType } from '@prisma/client';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateEquipmentDto {
  @IsString()
  name: string;

  @IsEnum(EquipmentType)
  @IsOptional()
  type?: EquipmentType;

  @IsString()
  @IsOptional()
  location?: string;

  @IsNumber()
  @IsOptional()
  minTemp?: number;

  @IsNumber()
  @IsOptional()
  maxTemp?: number;

  @IsString()
  clientId: string;
}
