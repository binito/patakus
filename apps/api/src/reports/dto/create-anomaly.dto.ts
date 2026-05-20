import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { AnomalySeverity, HigienizacaoZona } from '@prisma/client';

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

  @IsEnum(HigienizacaoZona)
  @IsNotEmpty()
  zona: HigienizacaoZona;
}
