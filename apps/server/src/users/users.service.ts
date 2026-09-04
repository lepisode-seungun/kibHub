import { Inject, Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../../../../prisma/generated/prisma/client';
import * as bcrypt from 'bcryptjs';
import { UpdateUserDto, PaginatedResponse } from '@kibhub/shared';
import { paginate, parsePagination } from '../common/pagination';

@Injectable()
export class UsersService {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

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

  /** 유저가 참여(합격)한 부트캠프 목록 */
  async findUserBootcamps(userId: number) {
    const applicants = await this.prisma.applicant.findMany({
      where: { userId, status: 'ACCEPTED' },
      include: {
        bootcamp: { select: { id: true, name: true, status: true, startDate: true, endDate: true, createdAt: true } },
      },
      orderBy: { appliedAt: 'desc' },
    });
    return applicants.map(a => ({
      id: a.bootcamp.id,
      status: a.bootcamp.status,
      name: a.bootcamp.name,
      startDate: a.bootcamp.startDate,
      endDate: a.bootcamp.endDate,
      createdAt: a.bootcamp.createdAt,
    }));
  }

  /** 유저가 작성한 콘텐츠 목록 */
  async findUserContents(userId: number) {
    return this.prisma.content.findMany({
      where: { authorId: userId },
      include: {
        category: { select: { name: true } },
        _count: { select: { comments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
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
}
