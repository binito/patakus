import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class ResetTokenDto {
  @IsString()
  @Matches(/^[a-f0-9]{64}$/, { message: 'Link inválido ou expirado' })
  token: string;
}

export class CompletePasswordResetDto extends ResetTokenDto {
  @IsString()
  @MinLength(8, { message: 'A password deve ter pelo menos 8 caracteres' })
  @MaxLength(72)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+{};:,<.>]).{8,}$/, {
    message: 'A password deve conter maiúscula, minúscula, número e símbolo',
  })
  password: string;
}
