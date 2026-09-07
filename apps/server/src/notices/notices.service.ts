import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/generated';
import { CreateNoticeDto, PaginatedResponse } from '@kibhub/shared';
import { paginate, parsePagination } from '../common/pagination';

@Injectable()
export class NoticesService {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  async findAll(query?: { search?: string; type?: string; bootcampId?: number; page?: string | number; limit?: string | number; excludeHidden?: boolean }): Promise<PaginatedResponse<unknown> | unknown[]> {
    const where: Prisma.NoticeWhereInput = {};
    if (query?.type) where.type = query.type as Prisma.NoticeWhereInput['type'];
    if (query?.bootcampId) where.bootcampId = query.bootcampId;
    if (query?.search) {
      where.title = { contains: query.search, mode: 'insensitive' };
    }
    if (query?.excludeHidden) {
      where.status = { not: 'HIDDEN' };
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

  create(data: CreateNoticeDto & { type?: string; bootcampId?: number; authorId?: number; files?: { name: string; url: string; size: number; mimeType: string }[] }) {
    const { files, ...rest } = data as any;
    const createData: any = {
      title: rest.title,
      body: rest.body || '',
      pinned: rest.pinned ?? false,
      status: rest.status || 'VISIBLE',
      type: rest.type || 'BOOTCAMP',
      authorId: rest.authorId,
    };
    if (rest.bootcampId) {
      createData.bootcampId = rest.bootcampId;
    }
    if (files && files.length > 0) {
      createData.files = {
        create: files.map((f: any) => ({
          name: f.name,
          url: f.url,
          size: f.size || 0,
          mimeType: f.mimeType || '',
        })),
      };
    }
    return this.prisma.notice.create({ data: createData, include: { files: true } });
  }

  async update(id: number, data: Partial<CreateNoticeDto> & { files?: any[] }) {
    const { files, type, title, body, pinned, status } = data as any;
    const updateData: any = {};

    // 허용 필드만 명시적으로 설정
    if (title !== undefined) updateData.title = title;
    if (body !== undefined) updateData.body = body;
    if (pinned !== undefined) updateData.pinned = pinned;
    if (status !== undefined) updateData.status = status;
    if (type !== undefined) updateData.type = type;

    // files가 전달되면 기존 파일 삭제 후 새로 생성
    if (files && files.length > 0) {
      await this.prisma.noticeFile.deleteMany({ where: { noticeId: id } });
      updateData.files = {
        create: files.map((f: any) => ({
          name: f.name,
          url: f.url,
          size: f.size || 0,
          mimeType: f.mimeType || '',
        })),
      };
    }

    return this.prisma.notice.update({
      where: { id },
      data: updateData,
      include: { files: true },
    });
  }

  delete(id: number) {
    return this.prisma.notice.delete({ where: { id } });
  }
}
