import { Inject, Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { Prisma } from '@prisma/generated';
import * as bcrypt from 'bcryptjs';
import { UpdateUserDto, PaginatedResponse } from '@kibhub/shared';
import { paginate, parsePagination } from '../common/pagination';

@Injectable()
export class UsersService {
  constructor(
    @Inject(PrismaService) private prisma: PrismaService,
    @Inject(NotificationsService) private notiService: NotificationsService,
  ) {}

  async findAll(query?: { search?: string; status?: string; role?: string; excludeRole?: string; page?: string | number; limit?: string | number }): Promise<PaginatedResponse<unknown> | unknown[]> {
    const where: Prisma.UserWhereInput = {};
    if (query?.status) where.status = query.status as Prisma.UserWhereInput['status'];
    if (query?.role) where.role = query.role as Prisma.UserWhereInput['role'];
    if (query?.excludeRole) where.role = { not: query.excludeRole } as any;
    if (query?.search) {
      where.OR = [
        { email: { contains: query.search, mode: 'insensitive' } },
        { name: { contains: query.search, mode: 'insensitive' } },
        { nickname: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const select = {
      id: true, email: true, nickname: true, name: true, phone: true,
      countryCode: true, role: true, status: true, adminRole: true,
      loginId: true, createdAt: true,
    };

    if (query?.page || query?.limit) {
      const { page, limit, skip } = parsePagination(query);
      const [data, total] = await Promise.all([
        this.prisma.user.findMany({ where, select, orderBy: { createdAt: 'desc' }, skip, take: limit }),
        this.prisma.user.count({ where }),
      ]);
      return paginate(data, total, page, limit);
    }
    return this.prisma.user.findMany({ where, select, orderBy: { createdAt: 'desc' } });
  }

  findOne(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true, email: true, nickname: true, name: true, phone: true,
        countryCode: true, birthday: true, intro: true, profileImage: true, coverImage: true,
        role: true, status: true, adminRole: true, loginId: true,
        createdAt: true, updatedAt: true,
        sns: true,
      },
    });
  }

  async update(id: number, data: UpdateUserDto) {
    const { sns, ...userData } = data;

    // 사용자 기본 정보 업데이트
    const user = await this.prisma.user.update({
      where: { id },
      data: userData as Prisma.UserUpdateInput,
    });

    // SNS 업데이트 (전체 교체 방식)
    if (sns !== undefined) {
      await this.prisma.userSns.deleteMany({ where: { userId: id } });
      if (sns.length > 0) {
        await this.prisma.userSns.createMany({
          data: sns.map(s => ({ ...s, userId: id })),
        });
      }
    }

    return user;
  }

  updateStatus(id: number, status: 'ACTIVE' | 'BLOCKED') {
    return this.prisma.user.update({ where: { id }, data: { status } });
  }

  updateRole(id: number, role: string) {
    return this.prisma.user.update({
      where: { id },
      data: { role: role as Prisma.UserUpdateInput['role'] },
    });
  }

  delete(id: number) {
    return this.prisma.user.update({
      where: { id },
      data: { status: 'WITHDRAWN' },
    });
  }

  /** 유저가 참여(합격)한 부트캠프 + 강사로 참여한 부트캠프 목록 */
  async findUserBootcamps(userId: number) {
    // 1. 지원자(합격) 부트캠프
    const applicants = await this.prisma.applicant.findMany({
      where: { userId, status: 'ACCEPTED' },
      include: {
        bootcamp: { select: { id: true, name: true, status: true, startDate: true, endDate: true, createdAt: true } },
      },
      orderBy: { appliedAt: 'desc' },
    });
    const fromApplicant = applicants.map(a => ({
      id: a.bootcamp.id,
      status: a.bootcamp.status,
      name: a.bootcamp.name,
      startDate: a.bootcamp.startDate,
      endDate: a.bootcamp.endDate,
      createdAt: a.bootcamp.createdAt,
    }));

    // 2. 강사 초대 부트캠프
    const instructorRecords = await this.prisma.bootcampInstructor.findMany({
      where: { userId },
      include: {
        bootcamp: { select: { id: true, name: true, status: true, startDate: true, endDate: true, createdAt: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    const fromInstructor = instructorRecords.map(r => ({
      id: r.bootcamp.id,
      status: r.bootcamp.status,
      name: r.bootcamp.name,
      startDate: r.bootcamp.startDate,
      endDate: r.bootcamp.endDate,
      createdAt: r.bootcamp.createdAt,
    }));

    // 3. 중복 제거 후 합산
    const seen = new Set<number>();
    const merged = [];
    for (const b of [...fromApplicant, ...fromInstructor]) {
      if (!seen.has(b.id)) {
        seen.add(b.id);
        merged.push(b);
      }
    }
    return merged;
  }

  /** 유저가 작성한 콘텐츠 목록 */
  async findUserContents(userId: number) {
    const contents = await this.prisma.content.findMany({
      where: { authorId: userId },
      include: {
        category: { select: { name: true } },
        _count: { select: { comments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 각 콘텐츠의 피드백 댓글 수 + 최상위 피드백 댓글
    const ids = contents.map(c => c.id);
    if (ids.length === 0) return contents;

    const feedbackCounts = await this.prisma.comment.groupBy({
      by: ['contentId'],
      where: { contentId: { in: ids }, markerNum: { not: null } },
      _count: true,
    });
    const feedbackCountMap = new Map(feedbackCounts.map(c => [c.contentId, c._count]));

    const topComments = await this.prisma.comment.findMany({
      where: { contentId: { in: ids }, status: 'VISIBLE', markerNum: { not: null } },
      orderBy: [{ likeCount: 'desc' }, { createdAt: 'desc' }],
      distinct: ['contentId'],
      select: {
        contentId: true,
        body: true,
        createdAt: true,
        author: { select: { nickname: true, name: true } },
      },
    });
    const commentMap = new Map(topComments.map(c => [c.contentId, c]));

    return contents.map(c => ({
      ...c,
      feedbackCount: feedbackCountMap.get(c.id) || 0,
      topComment: commentMap.get(c.id) || null,
    }));
  }

  /** 유저가 작성한 댓글 목록 */
  async findUserComments(userId: number) {
    return this.prisma.comment.findMany({
      where: { authorId: userId },
      include: {
        content: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** 유저 댓글 통계: 피드백 댓글, 일반 댓글, 받은 좋아요 */
  async findUserCommentStats(userId: number) {
    const [feedbackCount, generalCount, likeResult] = await Promise.all([
      this.prisma.comment.count({ where: { authorId: userId, type: 'feedback' } }),
      this.prisma.comment.count({ where: { authorId: userId, type: 'general' } }),
      this.prisma.comment.aggregate({
        where: { authorId: userId },
        _sum: { likeCount: true },
      }),
    ]);
    return {
      feedbackCount,
      generalCount,
      receivedLikes: likeResult._sum.likeCount || 0,
    };
  }

  async createAdmin(data: { loginId: string; password: string; name: string; adminRole?: string }) {
    if (!data.loginId || !data.password || !data.name) {
      throw new BadRequestException('아이디, 비밀번호, 이름은 필수입니다.');
    }

    // loginId 중복 체크
    const existingByLoginId = await this.prisma.user.findFirst({
      where: { loginId: data.loginId },
    });
    if (existingByLoginId) throw new ConflictException('이미 사용 중인 아이디입니다.');

    // 관리자 전용 이메일 생성 (일반 회원 email과 충돌 방지)
    const adminEmail = `${data.loginId}@admin.kibhub.local`;
    const existingByEmail = await this.prisma.user.findUnique({
      where: { email: adminEmail },
    });
    if (existingByEmail) throw new ConflictException('이미 사용 중인 아이디입니다.');

    const hashedPassword = await bcrypt.hash(data.password, 10);
    return this.prisma.user.create({
      data: {
        email: adminEmail,
        loginId: data.loginId,
        password: hashedPassword,
        name: data.name,
        nickname: data.name,
        role: 'ADMIN',
        adminRole: data.adminRole === 'SUPER' ? 'SUPER' : 'NORMAL',
      },
    });
  }

  async checkLoginId(loginId: string): Promise<boolean> {
    if (!loginId) return false;
    const existing = await this.prisma.user.findFirst({
      where: { loginId },
    });
    return !existing;
  }
  // ===== 팔로우 =====
  async toggleFollow(followerId: number, followingId: number) {
    if (followerId === followingId) {
      throw new BadRequestException('자기 자신을 팔로우할 수 없습니다.');
    }
    const existing = await this.prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    });
    if (existing) {
      await this.prisma.follow.delete({ where: { id: existing.id } });
      return { followed: false };
    } else {
      await this.prisma.follow.create({ data: { followerId, followingId } });
      // 팔로우 알림
      try {
        const follower = await this.prisma.user.findUnique({ where: { id: followerId }, select: { nickname: true } });
        await this.notiService.create({
          userId: followingId,
          type: 'FOLLOW',
          message: `${follower?.nickname || '사용자'}님이 회원님을 팔로우했습니다.`,
          actorId: followerId,
        });
      } catch { /* 알림 실패해도 팔로우는 정상 */ }
      return { followed: true };
    }
  }

  async isFollowing(followerId: number, followingId: number) {
    const follow = await this.prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    });
    return { isFollowing: !!follow };
  }

  async getFollowCounts(userId: number) {
    const [followerCount, followingCount] = await Promise.all([
      this.prisma.follow.count({ where: { followingId: userId } }),
      this.prisma.follow.count({ where: { followerId: userId } }),
    ]);
    return { followerCount, followingCount };
  }

  /** 팔로워 목록 (나를 팔로우하는 사람들) */
  async getFollowers(userId: number) {
    const follows = await this.prisma.follow.findMany({
      where: { followingId: userId },
      select: {
        follower: {
          select: { id: true, nickname: true, profileImage: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return follows.map(f => f.follower);
  }

  /** 팔로잉 목록 (내가 팔로우하는 사람들) */
  async getFollowing(userId: number) {
    const follows = await this.prisma.follow.findMany({
      where: { followerId: userId },
      select: {
        following: {
          select: { id: true, nickname: true, profileImage: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return follows.map(f => f.following);
  }

  /** 학습 대시보드 — 부트캠프 학습 중심 */
  async getDashboard(userId: number) {
    const now = new Date();
    const oneYearAgo = new Date(now);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    oneYearAgo.setHours(0, 0, 0, 0);

    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    // 유저가 참여한 부트캠프 ID 목록 (합격 지원자 + 강사)
    const [applicantRecords, instructorRecords] = await Promise.all([
      this.prisma.applicant.findMany({
        where: { userId, status: 'ACCEPTED' },
        select: { bootcampId: true },
      }),
      this.prisma.bootcampInstructor.findMany({
        where: { userId },
        select: { bootcampId: true },
      }),
    ]);
    const bootcampIds = [...new Set([
      ...applicantRecords.map(a => a.bootcampId),
      ...instructorRecords.map(r => r.bootcampId),
    ])];

    // 참여 부트캠프 정보
    const bootcamps = bootcampIds.length > 0
      ? await this.prisma.bootcamp.findMany({
          where: { id: { in: bootcampIds } },
          select: { id: true, name: true, status: true, thumbnail: true, startDate: true, endDate: true },
        })
      : [];

    // 해당 부트캠프들의 과제 전체
    const assignments = bootcampIds.length > 0
      ? await this.prisma.assignment.findMany({
          where: { course: { bootcampId: { in: bootcampIds } } },
          select: {
            id: true,
            title: true,
            dueDate: true,
            dueDateEnd: true,
            course: { select: { bootcampId: true, bootcamp: { select: { name: true } } } },
          },
        })
      : [];

    // 유저의 제출(SUBMISSION 타입만)
    const assignmentIds = assignments.map(a => a.id);
    const submissions = assignmentIds.length > 0
      ? await this.prisma.submission.findMany({
          where: { authorId: userId, assignmentId: { in: assignmentIds }, type: 'SUBMISSION' },
          select: { id: true, assignmentId: true, createdAt: true },
        })
      : [];

    const submittedAssignmentIds = new Set(submissions.map(s => s.assignmentId));

    // 과제에 대한 피드백 (FEEDBACK 타입 제출물)
    const feedbackSubmissions = assignmentIds.length > 0
      ? await this.prisma.submission.findMany({
          where: {
            assignmentId: { in: assignmentIds },
            type: 'FEEDBACK',
            parent: { authorId: userId },
          },
          select: { assignmentId: true },
        })
      : [];
    const feedbackAssignmentIds = new Set(feedbackSubmissions.map(f => f.assignmentId));

    // 1. 요약 통계
    const totalAssignments = assignments.length;
    const submittedCount = submittedAssignmentIds.size;
    const completionRate = totalAssignments > 0 ? Math.round((submittedCount / totalAssignments) * 100) : 0;
    const feedbackReceivedCount = feedbackAssignmentIds.size;

    const summary = {
      bootcampCount: bootcamps.length,
      completionRate,
      submittedCount,
      feedbackReceivedCount,
    };

    // 2. 과제별 현황
    const assignmentStatus = assignments.map(a => ({
      id: a.id,
      title: a.title,
      bootcampId: a.course.bootcampId,
      bootcampName: a.course.bootcamp.name,
      dueDate: a.dueDate,
      status: feedbackAssignmentIds.has(a.id) ? 'FEEDBACK_DONE'
        : submittedAssignmentIds.has(a.id) ? 'SUBMITTED'
        : 'NOT_SUBMITTED',
    }));

    // 3. 활동 히트맵 (365일) — 과제 제출 + 콘텐츠 업로드
    const [submissionDates, contentDates] = await Promise.all([
      this.prisma.submission.findMany({
        where: { authorId: userId, type: 'SUBMISSION', createdAt: { gte: oneYearAgo } },
        select: { createdAt: true },
      }),
      this.prisma.content.findMany({
        where: { authorId: userId, createdAt: { gte: oneYearAgo } },
        select: { createdAt: true },
      }),
    ]);

    const heatmapMap = new Map<string, number>();
    for (const s of submissionDates) {
      const key = s.createdAt.toISOString().slice(0, 10);
      heatmapMap.set(key, (heatmapMap.get(key) || 0) + 1);
    }
    for (const c of contentDates) {
      const key = c.createdAt.toISOString().slice(0, 10);
      heatmapMap.set(key, (heatmapMap.get(key) || 0) + 1);
    }
    const activityHeatmap = Array.from(heatmapMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // 4. 월별 제출 추이 (6개월)
    const monthlyMap = new Map<string, number>();
    for (let i = 0; i < 6; i++) {
      const d = new Date(now);
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyMap.set(key, 0);
    }
    for (const s of submissions) {
      const key = `${s.createdAt.getFullYear()}-${String(s.createdAt.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyMap.has(key)) {
        monthlyMap.set(key, (monthlyMap.get(key) || 0) + 1);
      }
    }
    const monthlySubmissions = Array.from(monthlyMap.entries())
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // 5. 최근 받은 과제 피드백
    const recentFeedbacks = await this.prisma.submission.findMany({
      where: {
        type: 'FEEDBACK',
        parent: { authorId: userId },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        author: { select: { nickname: true, profileImage: true } },
        assignment: { select: { id: true, title: true, course: { select: { bootcampId: true } } } },
      },
    });

    return {
      summary,
      bootcamps,
      assignmentStatus,
      activityHeatmap,
      monthlySubmissions,
      recentFeedbacks: recentFeedbacks.map(f => ({
        id: f.id,
        body: f.content || f.title,
        assignmentId: f.assignment.id,
        assignmentTitle: f.assignment.title,
        bootcampId: f.assignment.course.bootcampId,
        authorNickname: f.author?.nickname || '익명',
        authorProfileImage: f.author?.profileImage || null,
        createdAt: f.createdAt,
      })),
    };
  }
}
