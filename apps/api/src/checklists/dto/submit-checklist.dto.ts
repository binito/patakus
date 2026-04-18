import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

// Resultado de cada tarefa ao submeter a checklist
export class TaskResultDto {
  @IsString()
  @IsNotEmpty()
  taskId: string;

  @IsBoolean()
  done: boolean;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class SubmitChecklistDto {
  @IsString()
  @IsNotEmpty()
  templateId: string;

  @IsString()
  @IsNotEmpty()
  areaId: string;

  // Observações gerais sobre a execução
  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TaskResultDto)
  taskResults: TaskResultDto[];
}
