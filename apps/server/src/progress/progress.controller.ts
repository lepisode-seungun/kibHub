import { Controller, Get, Post, Delete, Param, Req, ParseIntPipe, UseGuards, Inject } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ProgressService } from './progress.service';
import { AuthGuard } from '../auth/auth.guard';

@ApiTags('progress')
@Controller()
export class ProgressController {
  constructor(
    @Inject(ProgressService)
    private readonly progressService: ProgressService,
  ) {}

  /** 수강 완료 표시 */
  @Post('lectures/:lectureId/progress/complete')
  @UseGuards(AuthGuard)
  markComplete(
    @Param('lectureId', ParseIntPipe) lectureId: number,
    @Req() req: any,
  ) {
    return this.progressService.markComplete(req.userId, lectureId);
  }

  /** 수강 완료 취소 */
  @Delete('lectures/:lectureId/progress/complete')
  @UseGuards(AuthGuard)
  unmarkComplete(
    @Param('lectureId', ParseIntPipe) lectureId: number,
    @Req() req: any,
  ) {
    return this.progressService.unmarkComplete(req.userId, lectureId);
  }

  /** 특정 강의 완료 여부 */
  @Get('lectures/:lectureId/progress/status')
  @UseGuards(AuthGuard)
  isComplete(
    @Param('lectureId', ParseIntPipe) lectureId: number,
    @Req() req: any,
  ) {
    return this.progressService.isComplete(req.userId, lectureId);
  }

  /** 내 전체 진도 (부트캠프) */
  @Get('bootcamps/:bootcampId/progress/mine')
  @UseGuards(AuthGuard)
  getMyProgress(
    @Param('bootcampId', ParseIntPipe) bootcampId: number,
    @Req() req: any,
  ) {
    return this.progressService.getMyProgress(req.userId, bootcampId);
  }

  /** 특정 코스 진도 */
  @Get('courses/:courseId/progress/mine')
  @UseGuards(AuthGuard)
  getCourseProgress(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Req() req: any,
  ) {
    return this.progressService.getCourseProgress(req.userId, courseId);
  }
}
