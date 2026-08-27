import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../../../../prisma/generated/prisma/client';
import { CreateContentDto, CreateReportDto, PaginatedResponse } from '@kibhub/shared';
import { paginate, parsePagination } from '../common/pagination';

@Injectable()
export class ContentsService {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  // ===== 콘텐츠 =====
  async findAll(query?: { search?: string; status?: string; type?: string; page?: string | number; limit?: string | number }): Promise<PaginatedResponse<unknown> | unknown[]> {
    const where: Prisma.ContentWhereInput = {};
    if (query?.status) where.status = query.status as Prisma.ContentWhereInput['status'];
    if (query?.type) where.type = query.type as Prisma.ContentWhereInput['type'];
    if (query?.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const include = {
      author: { select: { id: true, nickname: true, name: true } },
      category: { select: { id: true, name: true } },
      _count: { select: { comments: true } },
    };

    // 페이지네이션 파라미터 있으면 페이지네이션 응답
    if (query?.page || query?.limit) {
      const { page, limit, skip } = parsePagination(query);
      const [data, total] = await Promise.all([
        this.prisma.content.findMany({ where, include, orderBy: { createdAt: 'desc' }, skip, take: limit }),
        this.prisma.content.count({ where }),
      ]);
      return paginate(data, total, page, limit);
    }

    return this.prisma.content.findMany({ where, include, orderBy: { createdAt: 'desc' } });
  }


  findOne(id: number) {
    return this.prisma.content.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, nickname: true, name: true } },
        category: true,
        comments: {
          include: { author: { select: { id: true, nickname: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  create(data: CreateContentDto & { authorId: number }) {
    return this.prisma.content.create({ data: data as Prisma.ContentUncheckedCreateInput });
  }

  update(id: number, data: Partial<CreateContentDto>) {
    return this.prisma.content.update({ where: { id }, data: data as Prisma.ContentUpdateInput });
  }

  delete(id: number) {
    return this.prisma.content.delete({ where: { id } });
  }

  // ===== 카테고리 =====
  findCategories() {
    return this.prisma.contentCategory.findMany({ orderBy: { sortOrder: 'asc' } });
  }

  createCategory(data: { name: string; sortOrder?: number }) {
    return this.prisma.contentCategory.create({ data });
  }

  updateCategory(id: number, data: { name?: string; sortOrder?: number }) {
    return this.prisma.contentCategory.update({ where: { id }, data });
  }

  deleteCategory(id: number) {
    return this.prisma.contentCategory.delete({ where: { id } });
  }

  // ===== 댓글 =====
  findComments(contentId: number) {
    return this.prisma.comment.findMany({
      where: { contentId },
      include: { author: { select: { id: true, nickname: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  createComment(contentId: number, data: { body: string; authorId: number }) {
    return this.prisma.comment.create({ data: { ...data, contentId } });
  }

  updateComment(id: number, data: { body?: string }) {
    return this.prisma.comment.update({ where: { id }, data });
  }

  deleteComment(id: number) {
    return this.prisma.comment.delete({ where: { id } });
  }

  // ===== 신고 =====
  findReports(query?: { type?: string }) {
    const where: Prisma.ReportWhereInput = {};
    if (query?.type) where.type = query.type as Prisma.ReportWhereInput['type'];
    return this.prisma.report.findMany({
      where,
      include: { reporter: { select: { id: true, nickname: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  createReport(data: CreateReportDto & { reporterId: number }) {
    return this.prisma.report.create({ data: data as Prisma.ReportUncheckedCreateInput });
  }
}
