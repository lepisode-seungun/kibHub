import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { FaqsController } from './faqs.controller';
import { FaqsService } from './faqs.service';

@Module({
  imports: [AuthModule],
  controllers: [FaqsController],
  providers: [FaqsService],
})
export class FaqsModule {}
