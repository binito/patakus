import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [
    // Diretório de upload configurado também no controller via diskStorage
    MulterModule.register({ dest: './uploads' }),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
