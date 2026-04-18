import { Module } from '@nestjs/common';
import { DesinfecaoController } from './desinfecao.controller';
import { DesinfecaoService } from './desinfecao.service';

@Module({
  controllers: [DesinfecaoController],
  providers: [DesinfecaoService],
})
export class DesinfecaoModule {}
