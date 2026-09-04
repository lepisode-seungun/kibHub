import { Module } from '@nestjs/common';
import { AdminsController } from './admins.controller';
import { AdminsService } from './admins.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [AdminsController],
  providers: [AdminsService, PrismaService],
  exports: [AdminsService],
})
export class AdminsModule {}
