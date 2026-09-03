import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ContentsController } from './contents.controller';
import { ContentsService } from './contents.service';

// Report 관리 포함
@Module({
  imports: [AuthModule],
  controllers: [ContentsController],
  providers: [ContentsService],
})
export class ContentsModule {}
