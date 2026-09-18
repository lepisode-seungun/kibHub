import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminDashboardService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  /** 요약 통계 (회원수, 콘텐츠수, 활성 부트캠프수, 미답변 문의수) */
  async getSummary() {
    const [users, contents, activeBootcamps, pendingInquiries] =
      await Promise.all([
        this.prisma.user.count({ where: { status: 'ACTIVE', role: 'STUDENT' } }),
        this.prisma.content.count({ where: { status: 'VISIBLE' } }),
        this.prisma.bootcamp.count({
          where: { status: { in: ['RECRUITING', 'OPERATING'] } },
        }),
        this.prisma.inquiry.count({ where: { status: 'PENDING' } }),
      ]);

    return { users, contents, activeBootcamps, pendingInquiries };
  }

  /** 가입자 추이 */
  async getSignupTrend(period: 'daily' | 'weekly' | 'monthly', days: number) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const users = await this.prisma.user.findMany({
      where: { createdAt: { gte: since }, role: 'STUDENT' },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const grouped = new Map<string, number>();

    for (const u of users) {
      const d = new Date(u.createdAt);
      let key: string;
      if (period === 'daily') {
        key = d.toISOString().substring(0, 10);
      } else if (period === 'weekly') {
        // ISO week start (Monday)
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(d);
        monday.setDate(diff);
        key = monday.toISOString().substring(0, 10);
      } else {
        key = d.toISOString().substring(0, 7); // YYYY-MM
      }
      grouped.set(key, (grouped.get(key) || 0) + 1);
    }

    return Array.from(grouped.entries()).map(([date, count]) => ({
      date,
      count,
    }));
  }

  /** 콘텐츠 업로드 추이 (타입별, 월별) */
  async getContentTrend(months: number) {
    const since = new Date();
    since.setMonth(since.getMonth() - months);

    // 빈 월도 포함하도록 전체 월 목록 생성
    const allMonths: string[] = [];
    const cursor = new Date(since);
    cursor.setDate(1);
    const now = new Date();
    while (cursor <= now) {
      allMonths.push(cursor.toISOString().substring(0, 7));
      cursor.setMonth(cursor.getMonth() + 1);
    }

    const contents = await this.prisma.content.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true, type: true },
      orderBy: { createdAt: 'asc' },
    });

    const grouped = new Map<string, { WEBTOON: number; ILLUSTRATION: number; WRITING: number }>();
    for (const m of allMonths) {
      grouped.set(m, { WEBTOON: 0, ILLUSTRATION: 0, WRITING: 0 });
    }

    for (const c of contents) {
      const key = new Date(c.createdAt).toISOString().substring(0, 7);
      const entry = grouped.get(key);
      if (entry && c.type in entry) {
        entry[c.type as keyof typeof entry]++;
      }
    }

    return allMonths.map(date => ({
      date,
      ...grouped.get(date)!,
    }));
  }

  /** 부트캠프 현황 */
  async getBootcampOverview() {
    const bootcamps = await this.prisma.bootcamp.findMany({
      select: {
        id: true,
        name: true,
        status: true,
        startDate: true,
        endDate: true,
        _count: {
          select: {
            applicants: true,
            courses: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 각 부트캠프의 합격(수강중) 인원 수
    const result = [];
    for (const b of bootcamps) {
      const acceptedCount = await this.prisma.applicant.count({
        where: {
          bootcampId: b.id,
          status: { in: ['ACCEPTED', 'COMPLETED'] },
        },
      });
      result.push({
        id: b.id,
        name: b.name,
        status: b.status,
        startDate: b.startDate,
        endDate: b.endDate,
        applicantCount: b._count.applicants,
        studentCount: acceptedCount,
        courseCount: b._count.courses,
      });
    }

    return result;
  }

  /** 최근 활동 */
  async getRecentActivity() {
    const [recentUsers, recentContents, recentInquiries] = await Promise.all([
      this.prisma.user.findMany({
        where: { role: 'STUDENT' },
        select: { id: true, nickname: true, email: true, createdAt: true, profileImage: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      this.prisma.content.findMany({
        where: { status: 'VISIBLE' },
        select: {
          id: true,
          title: true,
          type: true,
          thumbnail: true,
          createdAt: true,
          author: { select: { nickname: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      this.prisma.inquiry.findMany({
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
          author: { select: { nickname: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    return { recentUsers, recentContents, recentInquiries };
  }
}
