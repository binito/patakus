import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { AnomalySeverity } from '@prisma/client';

export class CreateAnomalyDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsEnum(AnomalySeverity)
  @IsOptional()
  severity?: AnomalySeverity;

  @IsString()
  @IsNotEmpty()
  areaId: string;
}
