import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { Role } from '@prisma/client';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8, { message: 'A password deve ter pelo menos 8 caracteres' })
  @Matches(/(?=.*[A-Za-z])(?=.*\d)/, { message: 'A password deve conter pelo menos uma letra e um número' })
  password: string;

  @IsEnum(Role)
  @IsOptional()
  role?: Role;

  @IsString()
  @IsOptional()
  phone?: string;

  // ID do cliente ao qual o utilizador pertence (obrigatório para CLIENT_ADMIN e OPERATOR)
  @IsString()
  @IsOptional()
  clientId?: string;
}
