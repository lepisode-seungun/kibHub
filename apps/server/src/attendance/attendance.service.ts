import { Injectable, ConflictException, ForbiddenException, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/** KST(한국 표준시) 기준 오늘 날짜 문자열 (YYYY-MM-DD) */
function todayKST(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });
}

@Injectable()
export class AttendanceService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  /** 출석 체크 (오늘 날짜) */
  async checkIn(userId: number, bootcampId: number) {
    // 종료된 부트캠프는 출석 체크 차단
    const bootcamp = await this.prisma.bootcamp.findUnique({
      where: { id: bootcampId },
      select: { status: true, startDate: true, endDate: true },
    });
    if (bootcamp?.status === 'ENDED') {
      throw new ForbiddenException('종료된 부트캠프에는 출석 체크를 할 수 없습니다.');
    }

    // 부트캠프 기간 검증
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (bootcamp?.startDate) {
      const start = new Date(bootcamp.startDate);
      start.setHours(0, 0, 0, 0);
      if (today < start) {
        throw new ForbiddenException('부트캠프 시작 전에는 출석 체크를 할 수 없습니다.');
      }
    }
    if (bootcamp?.endDate) {
      const end = new Date(bootcamp.endDate);
      end.setHours(23, 59, 59, 999);
      if (today > end) {
        throw new ForbiddenException('부트캠프 기간이 종료되어 출석 체크를 할 수 없습니다.');
      }
    }

    const todayStr = todayKST(); // KST 기준 YYYY-MM-DD
    try {
      return await this.prisma.attendance.create({
        data: { userId, bootcampId, date: todayStr },
      });
    } catch (e: unknown) {
      if (e instanceof Error && 'code' in e && (e as { code: string }).code === 'P2002') {
        throw new ConflictException('이미 오늘 출석 체크를 완료했습니다.');
      }
      throw e;
    }
  }

  /** 내 출석 기록 (날짜 배열) */
  async getMyAttendance(userId: number, bootcampId: number) {
    const records = await this.prisma.attendance.findMany({
      where: { userId, bootcampId },
      select: { date: true, checkedAt: true },
      orderBy: { date: 'asc' },
    });
    return records;
  }

  /** 출석률 계산 */
  async getAttendanceRate(userId: number, bootcampId: number) {
    const bootcamp = await this.prisma.bootcamp.findUnique({
      where: { id: bootcampId },
      select: { startDate: true, endDate: true },
    });

    const attendanceDays = await this.prisma.attendance.count({
      where: { userId, bootcampId },
    });

    // 교육 기간 일수 계산 (시작~종료 전체 기간, 진행 중이면 시작~오늘)
    let totalDays = 0;
    let elapsedDays = 0;
    if (bootcamp?.startDate && bootcamp?.endDate) {
      const start = new Date(bootcamp.startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(bootcamp.endDate);
      end.setHours(0, 0, 0, 0);
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      // 전체 기간 (시작일~종료일)
      totalDays = Math.max(1, Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);

      // 경과 일수 (시작일~오늘, 단 종료일 이후면 전체)
      if (now < start) {
        elapsedDays = 0;
      } else if (now > end) {
        elapsedDays = totalDays;
      } else {
        elapsedDays = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      }
    }

    return {
      attendanceDays,
      totalDays,
      elapsedDays,
      rate: elapsedDays > 0 ? Math.round((attendanceDays / elapsedDays) * 100) : 0,
    };
  }

  /** 오늘 출석 여부 확인 */
  async checkTodayStatus(userId: number, bootcampId: number) {
    const today = todayKST();
    const record = await this.prisma.attendance.findUnique({
      where: { userId_bootcampId_date: { userId, bootcampId, date: today } },
    });
    return { checkedIn: !!record };
  }

  /** 관리자용: 부트캠프 출석 현황 */
  async getBootcampAttendance(bootcampId: number, date?: string) {
    const targetDate = date || todayKST();

    // 전체 수강생
    const students = await this.prisma.applicant.findMany({
      where: { bootcampId, status: { in: ['ACCEPTED', 'COMPLETED'] } },
      include: { user: { select: { id: true, name: true, nickname: true, email: true } } },
    });

    // 해당 날짜 출석 기록
    const attendances = await this.prisma.attendance.findMany({
      where: { bootcampId, date: targetDate },
    });

    const attendedUserIds = new Set(attendances.map(a => a.userId));

    // 전체 수강생의 전체 출석 기록 (통계용)
    const allAttendances = await this.prisma.attendance.groupBy({
      by: ['userId'],
      where: { bootcampId },
      _count: { id: true },
    });

    const attendanceCountMap = new Map(
      allAttendances.map(a => [a.userId, a._count.id])
    );

    const result = students.map(s => {
      const iq = s.interviewQuestions as Record<string, string> | null;
      const displayName = iq?.['applicantName'] || s.user?.name || s.user?.nickname || '';
      return {
        userId: s.user?.id || 0,
        name: displayName,
        email: iq?.['email'] || s.user?.email || '',
        todayChecked: attendedUserIds.has(s.user?.id || 0),
        totalAttendance: attendanceCountMap.get(s.user?.id || 0) || 0,
      };
    });

    return {
      date: targetDate,
      totalStudents: students.length,
      todayAttended: attendances.length,
      students: result,
    };
  }
}
