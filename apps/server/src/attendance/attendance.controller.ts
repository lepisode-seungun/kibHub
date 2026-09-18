import { Controller, Get, Post, Param, Query, Req, ParseIntPipe, UseGuards, Inject } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { AuthGuard } from '../auth/auth.guard';
import { Request } from 'express';

@Controller('bootcamps/:bootcampId/attendance')
export class AttendanceController {
  constructor(
    @Inject(AttendanceService)
    private readonly attendanceService: AttendanceService,
  ) {}

  /** 출석 체크 */
  @Post('check-in')
  @UseGuards(AuthGuard)
  checkIn(
    @Param('bootcampId', ParseIntPipe) bootcampId: number,
    @Req() req: Request & { userId: number },
  ) {
    return this.attendanceService.checkIn(req.userId, bootcampId);
  }

  /** 내 출석 기록 */
  @Get('mine')
  @UseGuards(AuthGuard)
  getMyAttendance(
    @Param('bootcampId', ParseIntPipe) bootcampId: number,
    @Req() req: Request & { userId: number },
  ) {
    return this.attendanceService.getMyAttendance(req.userId, bootcampId);
  }

  /** 내 출석률 */
  @Get('rate')
  @UseGuards(AuthGuard)
  getAttendanceRate(
    @Param('bootcampId', ParseIntPipe) bootcampId: number,
    @Req() req: Request & { userId: number },
  ) {
    return this.attendanceService.getAttendanceRate(req.userId, bootcampId);
  }

  /** 오늘 출석 여부 */
  @Get('today')
  @UseGuards(AuthGuard)
  checkTodayStatus(
    @Param('bootcampId', ParseIntPipe) bootcampId: number,
    @Req() req: Request & { userId: number },
  ) {
    return this.attendanceService.checkTodayStatus(req.userId, bootcampId);
  }

  /** 관리자용: 전체 출석 현황 */
  @Get('all')
  getBootcampAttendance(
    @Param('bootcampId', ParseIntPipe) bootcampId: number,
    @Query('date') date?: string,
  ) {
    return this.attendanceService.getBootcampAttendance(bootcampId, date);
  }
}
