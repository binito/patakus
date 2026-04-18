import { TempSession } from '@prisma/client';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export class RecordTemperatureDto {
  @IsString()
  equipmentId: string;

  @IsNumber()
  temperature: number;

  @IsEnum(TempSession)
  session: TempSession;

  @IsString()
  @IsOptional()
  notes?: string;
}
