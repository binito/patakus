import { Module } from '@nestjs/common';
import { HigienizacaoController } from './higienizacao.controller';
import { HigienizacaoService } from './higienizacao.service';

@Module({
  controllers: [HigienizacaoController],
  providers: [HigienizacaoService],
})
export class HigienizacaoModule {}
