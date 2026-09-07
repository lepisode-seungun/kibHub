import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/generated';
import { CreateContentDto, CreateReportDto, PaginatedResponse } from '@kibhub/shared';
import { paginate, parsePagination } from '../common/pagination';

@Injectable()
export class ContentsService {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  // ===== 콘텐츠 =====
  async findAll(query?: { search?: string; status?: string; type?: string; showAll?: string; page?: string | number; limit?: string | number }): Promise<PaginatedResponse<unknown> | unknown[]> {
    const where: Prisma.ContentWhereInput = {};

    // 기본적으로 VISIBLE만 조회, showAll=true면 전체 조회 (어드민용)
    if (query?.showAll === 'true') {
      if (query?.status) where.status = query.status as Prisma.ContentWhereInput['status'];
    } else {
      where.status = (query?.status || 'VISIBLE') as Prisma.ContentWhereInput['status'];
    }

    if (query?.type) where.type = query.type as Prisma.ContentWhereInput['type'];
    if (query?.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { author: { nickname: { contains: query.search, mode: 'insensitive' } } },
        { author: { email: { contains: query.search, mode: 'insensitive' } } },
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

      // 각 콘텐츠의 첫 번째 댓글 (좋아요 내림차순)
      const topComments = await this.prisma.comment.findMany({
        where: { contentId: { in: ids }, status: 'VISIBLE', markerNum: { not: null } },
        orderBy: [{ likeCount: 'desc' }, { createdAt: 'desc' }],
        distinct: ['contentId'],
        select: {
          contentId: true,
          body: true,
          author: { select: { nickname: true, name: true } },
        },
      });
      const commentMap = new Map(topComments.map(c => [c.contentId, c]));

      return contents.map(c => ({
        ...c,
        feedbackCount: countMap.get(c.id) || 0,
        topComment: commentMap.get(c.id) || null,
      }));
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


  async findOne(id: number) {
    const content = await this.prisma.content.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, nickname: true, name: true, role: true, profileImage: true } },
        category: true,
        comments: {
          include: { author: { select: { id: true, nickname: true } } },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { comments: true } },
      },
    });

    if (!content) return null;

    // 조회수 증가 (비동기, 응답 차단 안 함)
    this.prisma.content.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    }).catch(() => {});

    // 북마크 카운트: BOOKMARK 타입 앨범에 속한 AlbumContent 수
    const bookmarkCount = await this.prisma.albumContent.count({
      where: {
        contentId: id,
        album: { type: 'BOOKMARK' },
      },
    });

    return { ...content, bookmarkCount };
  }

  create(data: CreateContentDto & { authorId: number }) {
    return this.prisma.content.create({ data: data as Prisma.ContentUncheckedCreateInput });
  }

  update(id: number, data: Partial<CreateContentDto>) {
    return this.prisma.content.update({ where: { id }, data: data as Prisma.ContentUpdateInput });
  }

  async delete(id: number) {
    // 해당 콘텐츠의 댓글 ID 조회 (댓글 신고 삭제용)
    const comments = await this.prisma.comment.findMany({
      where: { contentId: id },
      select: { id: true },
    });
    const commentIds = comments.map(c => c.id);

    // 콘텐츠 신고 + 댓글 신고 일괄 삭제
    await this.prisma.report.deleteMany({
      where: {
        OR: [
          { type: 'CONTENT', targetId: id },
          ...(commentIds.length > 0 ? [{ type: 'COMMENT' as const, targetId: { in: commentIds } }] : []),
        ],
      },
    });

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
  async findComments(contentId: number, userId?: number, showAll = false) {
    const likesInclude = userId
      ? { likes: { where: { userId }, select: { id: true } } }
      : {};
    const statusFilter = showAll ? {} : { status: 'VISIBLE' as const };
    const comments = await this.prisma.comment.findMany({
      where: { contentId, parentId: null, ...statusFilter },
      include: {
        author: { select: { id: true, nickname: true, name: true, role: true, profileImage: true } },
        ...likesInclude,
        replies: {
          ...(showAll ? {} : { where: { status: 'VISIBLE' as const } }),
          include: {
            author: { select: { id: true, nickname: true, name: true, role: true, profileImage: true } },
            ...likesInclude,
          },
          orderBy: { createdAt: 'asc' as const },
        },
      },
      orderBy: { createdAt: 'desc' as const },
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

  findBestComments(take = 10) {
    return this.prisma.comment.findMany({
      take,
      where: { status: 'VISIBLE', likeCount: { gt: 0 } },
      orderBy: { likeCount: 'desc' },
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

  async updateComment(id: number, data: { body?: string; status?: string }) {
    const result = await this.prisma.comment.update({ where: { id }, data: data as Prisma.CommentUncheckedUpdateInput });

    // 상태 변경 시 하위 대댓글도 연쇄 적용
    if (data.status) {
      await this.prisma.comment.updateMany({
        where: { parentId: id },
        data: { status: data.status as any },
      });
    }

    return result;
  }

  async deleteComment(id: number, hard = false) {
    if (hard) {
      // 영구 삭제: 관련 신고, 좋아요도 함께 삭제
      await this.prisma.report.deleteMany({ where: { type: 'COMMENT', targetId: id } });
      await this.prisma.commentLike.deleteMany({ where: { commentId: id } });
      // 대댓글이면 바로 삭제, 부모 댓글이면 대댓글도 삭제
      const replies = await this.prisma.comment.findMany({ where: { parentId: id }, select: { id: true } });
      if (replies.length > 0) {
        const replyIds = replies.map(r => r.id);
        await this.prisma.report.deleteMany({ where: { type: 'COMMENT', targetId: { in: replyIds } } });
        await this.prisma.commentLike.deleteMany({ where: { commentId: { in: replyIds } } });
        await this.prisma.comment.deleteMany({ where: { parentId: id } });
      }
      return this.prisma.comment.delete({ where: { id } });
    }
    // 소프트 삭제 + 대댓글 연쇄 적용
    await this.prisma.comment.updateMany({
      where: { parentId: id },
      data: { status: 'DELETED' },
    });
    return this.prisma.comment.update({
      where: { id },
      data: { status: 'DELETED' },
    });
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
  async findReports(query?: { type?: string; targetId?: string }) {
    const where: Prisma.ReportWhereInput = {};
    if (query?.type) where.type = query.type as Prisma.ReportWhereInput['type'];
    if (query?.targetId) where.targetId = parseInt(query.targetId);
    const reports = await this.prisma.report.findMany({
      where,
      include: { reporter: { select: { id: true, nickname: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });

    // 대상 콘텐츠/댓글 정보 조인
    const contentIds = reports.filter(r => r.type === 'CONTENT').map(r => r.targetId);
    const commentIds = reports.filter(r => r.type === 'COMMENT').map(r => r.targetId);

    const contentsMap = new Map<number, string>();
    const commentsMap = new Map<number, { body: string; contentTitle: string }>();

    if (contentIds.length > 0) {
      const contents = await this.prisma.content.findMany({
        where: { id: { in: contentIds } },
        select: { id: true, title: true },
      });
      contents.forEach(c => contentsMap.set(c.id, c.title));
    }

    if (commentIds.length > 0) {
      const comments = await this.prisma.comment.findMany({
        where: { id: { in: commentIds } },
        select: { id: true, body: true, content: { select: { title: true } } },
      });
      comments.forEach(c => commentsMap.set(c.id, { body: c.body, contentTitle: c.content.title }));
    }

    // 삭제된 대상을 가리키는 고아 신고 정리
    const orphanIds = reports
      .filter(r =>
        (r.type === 'CONTENT' && !contentsMap.has(r.targetId)) ||
        (r.type === 'COMMENT' && !commentsMap.has(r.targetId))
      )
      .map(r => r.id);

    if (orphanIds.length > 0) {
      await this.prisma.report.deleteMany({ where: { id: { in: orphanIds } } });
    }

    // 유효한 신고만 반환
    return reports
      .filter(r => !orphanIds.includes(r.id))
      .map(r => ({
        ...r,
        targetTitle: r.type === 'CONTENT'
          ? contentsMap.get(r.targetId)
          : commentsMap.get(r.targetId)?.contentTitle,
        targetBody: r.type === 'COMMENT'
          ? commentsMap.get(r.targetId)?.body
          : undefined,
      }));
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

    // 자동 숨김 처리: 누적 신고 횟수가 설정값 이상이면 해당 콘텐츠/댓글 숨김
    try {
      const settingKey = data.type === 'CONTENT' ? 'autoHideContentReportCount' : 'autoHideCommentReportCount';
      const setting = await this.prisma.siteSetting.findUnique({ where: { key: settingKey } });
      if (setting) {
        const threshold = parseInt(setting.value, 10);
        if (!isNaN(threshold) && threshold > 0) {
          const totalReports = await this.prisma.report.count({
            where: { type: data.type, targetId: data.targetId },
          });
          if (totalReports >= threshold) {
            if (data.type === 'CONTENT') {
              await this.prisma.content.update({
                where: { id: data.targetId },
                data: { status: 'HIDDEN' },
              }).catch(() => {});
            } else if (data.type === 'COMMENT') {
              await this.prisma.comment.update({
                where: { id: data.targetId },
                data: { status: 'HIDDEN' },
              }).catch(() => {});
            }
          }
        }
      }
    } catch {
      // 자동 숨김 실패해도 신고 자체는 성공
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
