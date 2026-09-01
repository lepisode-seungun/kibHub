import { Module } from '@nestjs/common';
import { PostersController } from './posters.controller';
import { PostersService } from './posters.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PostersController],
  providers: [PostersService],
})
export class PostersModule {}
