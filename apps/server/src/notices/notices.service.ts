import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../../../../prisma/generated/prisma/client';
import { CreateNoticeDto, PaginatedResponse } from '@kibhub/shared';
import { paginate, parsePagination } from '../common/pagination';

@Injectable()
export class NoticesService {
  constructor(private prisma: PrismaService) {}

  async findAll(query?: { search?: string; type?: string; bootcampId?: number; page?: string | number; limit?: string | number }): Promise<PaginatedResponse<unknown> | unknown[]> {
    const where: Prisma.NoticeWhereInput = {};
    if (query?.type) where.type = query.type as Prisma.NoticeWhereInput['type'];
    if (query?.bootcampId) where.bootcampId = query.bootcampId;
    if (query?.search) {
      where.title = { contains: query.search, mode: 'insensitive' };
    }
    const include = { author: { select: { id: true, name: true, nickname: true } }, files: true };
    const orderBy: Prisma.NoticeOrderByWithRelationInput[] = [{ pinned: 'desc' }, { createdAt: 'desc' }];

    if (query?.page || query?.limit) {
      const { page, limit, skip } = parsePagination(query);
      const [data, total] = await Promise.all([
        this.prisma.notice.findMany({ where, include, orderBy, skip, take: limit }),
        this.prisma.notice.count({ where }),
      ]);
      return paginate(data, total, page, limit);
    }
    return this.prisma.notice.findMany({ where, include, orderBy });
  }

  findOne(id: number) {
    return this.prisma.notice.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true, nickname: true } },
        files: true,
      },
    });
  }

  create(data: CreateNoticeDto & { type?: string; bootcampId?: number }) {
    return this.prisma.notice.create({ data: data as Prisma.NoticeUncheckedCreateInput });
  }

  update(id: number, data: Partial<CreateNoticeDto>) {
    return this.prisma.notice.update({ where: { id }, data: data as Prisma.NoticeUpdateInput });
  }

  delete(id: number) {
    return this.prisma.notice.delete({ where: { id } });
  }
}
