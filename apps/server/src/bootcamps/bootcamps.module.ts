import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { BootcampsController } from './bootcamps.controller';
import { BootcampsService } from './bootcamps.service';

@Module({
  imports: [AuthModule],
  controllers: [BootcampsController],
  providers: [BootcampsService],
})
export class BootcampsModule {}
