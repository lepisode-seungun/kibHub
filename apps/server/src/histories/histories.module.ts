import { Module } from '@nestjs/common';
import { HistoriesController } from './histories.controller';
import { HistoriesService } from './histories.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [HistoriesController],
  providers: [HistoriesService],
})
export class HistoriesModule {}
