import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Frequency } from '@prisma/client';

// DTO para cada tarefa dentro do template
export class CreateChecklistTaskDto {
  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @IsOptional()
  order?: number;
}

export class CreateTemplateDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(Frequency)
  @IsOptional()
  frequency?: Frequency;

  @IsString()
  @IsNotEmpty()
  areaId: string;

  // Lista de tarefas que compõem o template
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateChecklistTaskDto)
  tasks: CreateChecklistTaskDto[];
}
