import { IsEnum, IsObject, IsOptional, IsString } from 'class-validator';
import { ReportType } from '@prisma/client';

export class CreateShareDto {
  @IsEnum(ReportType)
  type: ReportType;

  @IsString()
  label: string;

  @IsObject()
  params: Record<string, string | undefined>;

  @IsString()
  @IsOptional()
  clientId?: string;
}
