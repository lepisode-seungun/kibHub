import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../../../../prisma/generated/prisma/client';
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
        countryCode: true, birthday: true, intro: true, profileImage: true,
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
}
