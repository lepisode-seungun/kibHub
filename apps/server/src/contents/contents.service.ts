import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ContentsService {
  constructor(private prisma: PrismaService) {}

  // ===== 콘텐츠 =====
  findAll(query?: { search?: string; status?: string; type?: string }) {
    const where: any = {};
    if (query?.status) where.status = query.status;
    if (query?.type) where.type = query.type;
    if (query?.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    return this.prisma.content.findMany({
      where,
      include: {
        author: { select: { id: true, nickname: true, name: true } },
        category: { select: { id: true, name: true } },
        _count: { select: { comments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
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

  create(data: any) {
    return this.prisma.content.create({ data });
  }

  update(id: number, data: any) {
    return this.prisma.content.update({ where: { id }, data });
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

  updateComment(id: number, data: any) {
    return this.prisma.comment.update({ where: { id }, data });
  }

  deleteComment(id: number) {
    return this.prisma.comment.delete({ where: { id } });
  }

  // ===== 신고 =====
  findReports(query?: { type?: string }) {
    const where: any = {};
    if (query?.type) where.type = query.type;
    return this.prisma.report.findMany({
      where,
      include: { reporter: { select: { id: true, nickname: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  createReport(data: any) {
    return this.prisma.report.create({ data });
  }
}
