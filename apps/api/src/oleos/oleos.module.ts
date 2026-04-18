import { Module } from '@nestjs/common';
import { OleosController } from './oleos.controller';
import { OleosService } from './oleos.service';

@Module({
  controllers: [OleosController],
  providers: [OleosService],
})
export class OleosModule {}
