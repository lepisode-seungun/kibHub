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
      author: { select: { id: true, nickname: true, name: true, profileImage: true } },
      category: { select: { id: true, name: true } },
      _count: { select: { comments: true } },
    };

    const addFeedbackCount = async (contents: any[]) => {
      const ids = contents.map(c => c.id);
      if (ids.length === 0) return contents;
      const counts = await this.prisma.comment.groupBy({
        by: ['contentId'],
        where: { contentId: { in: ids }, markerNum: { not: null } },
        _count: true,
      });
      const countMap = new Map(counts.map(c => [c.contentId, c._count]));
      return contents.map(c => ({ ...c, feedbackCount: countMap.get(c.id) || 0 }));
    };

    // 페이지네이션 파라미터 있으면 페이지네이션 응답
    if (query?.page || query?.limit) {
      const { page, limit, skip } = parsePagination(query);
      const [data, total] = await Promise.all([
        this.prisma.content.findMany({ where, include, orderBy: { createdAt: 'desc' }, skip, take: limit }),
        this.prisma.content.count({ where }),
      ]);
      return paginate(await addFeedbackCount(data), total, page, limit);
    }

    const data = await this.prisma.content.findMany({ where, include, orderBy: { createdAt: 'desc' } });
    return addFeedbackCount(data);
  }


  findOne(id: number) {
    return this.prisma.content.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, nickname: true, name: true, role: true } },
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
  async findComments(contentId: number, userId?: number) {
    const likesInclude = userId
      ? { likes: { where: { userId }, select: { id: true } } }
      : {};
    const comments = await this.prisma.comment.findMany({
      where: { contentId, parentId: null },
      include: {
        author: { select: { id: true, nickname: true, name: true, role: true, profileImage: true } },
        ...likesInclude,
        replies: {
          include: {
            author: { select: { id: true, nickname: true, name: true, role: true, profileImage: true } },
            ...likesInclude,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 실시간 신고 카운트 계산
    const commentIds = comments.flatMap(c => [c.id, ...((c as any).replies || []).map((r: any) => r.id)]);
    if (commentIds.length > 0) {
      const reportCounts = await this.prisma.report.groupBy({
        by: ['targetId'],
        where: { type: 'COMMENT', targetId: { in: commentIds } },
        _count: { id: true },
      });
      const countMap = new Map(reportCounts.map(r => [r.targetId, r._count.id]));
      for (const cm of comments) {
        (cm as any).reportCount = countMap.get(cm.id) || 0;
        for (const reply of ((cm as any).replies || [])) {
          reply.reportCount = countMap.get(reply.id) || 0;
        }
      }
    }

    return comments;
  }

  findRecentComments(take = 10) {
    return this.prisma.comment.findMany({
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { id: true, nickname: true, name: true, profileImage: true } },
        content: { select: { id: true, title: true, thumbnail: true } },
      },
    });
  }

  createComment(contentId: number, data: { body: string; images?: string[]; authorId: number; parentId?: number; type?: string; markerNum?: number; markerTop?: number; markerLeft?: number; markerImageIndex?: number }) {
    return this.prisma.comment.create({
      data: {
        body: data.body,
        images: data.images || [],
        authorId: data.authorId,
        contentId,
        parentId: data.parentId || null,
        type: data.type || 'general',
        markerNum: data.markerNum ?? null,
        markerTop: data.markerTop ?? null,
        markerLeft: data.markerLeft ?? null,
        markerImageIndex: data.markerImageIndex ?? null,
      },
      include: { author: { select: { id: true, nickname: true, name: true, role: true, profileImage: true } } },
    });
  }

  updateComment(id: number, data: { body?: string; status?: string }) {
    return this.prisma.comment.update({ where: { id }, data: data as Prisma.CommentUncheckedUpdateInput });
  }

  deleteComment(id: number) {
    return this.prisma.comment.delete({ where: { id } });
  }

  async toggleCommentLike(commentId: number, userId: number) {
    const existing = await this.prisma.commentLike.findUnique({
      where: { commentId_userId: { commentId, userId } },
    });

    if (existing) {
      await this.prisma.commentLike.delete({ where: { id: existing.id } });
      await this.prisma.comment.update({ where: { id: commentId }, data: { likeCount: { decrement: 1 } } });
      return { liked: false, likeCount: (await this.prisma.comment.findUnique({ where: { id: commentId } }))!.likeCount };
    } else {
      await this.prisma.commentLike.create({ data: { commentId, userId } });
      await this.prisma.comment.update({ where: { id: commentId }, data: { likeCount: { increment: 1 } } });
      return { liked: true, likeCount: (await this.prisma.comment.findUnique({ where: { id: commentId } }))!.likeCount };
    }
  }

  // ===== 신고 =====
  findReports(query?: { type?: string; targetId?: string }) {
    const where: Prisma.ReportWhereInput = {};
    if (query?.type) where.type = query.type as Prisma.ReportWhereInput['type'];
    if (query?.targetId) where.targetId = parseInt(query.targetId);
    return this.prisma.report.findMany({
      where,
      include: { reporter: { select: { id: true, nickname: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createReport(data: CreateReportDto & { reporterId: number }) {
    const report = await this.prisma.report.create({ data: data as Prisma.ReportUncheckedCreateInput });
    // 댓글 신고 시 해당 댓글의 reportCount 증가
    if (data.type === 'COMMENT') {
      await this.prisma.comment.update({
        where: { id: data.targetId },
        data: { reportCount: { increment: 1 } },
      }).catch(() => {});
    }
    return report;
  }

  async deleteReport(id: number) {
    const report = await this.prisma.report.findUnique({ where: { id } });
    if (report && report.type === 'COMMENT') {
      await this.prisma.comment.update({
        where: { id: report.targetId },
        data: { reportCount: { decrement: 1 } },
      }).catch(() => {});
    }
    return this.prisma.report.delete({ where: { id } });
  }
}
