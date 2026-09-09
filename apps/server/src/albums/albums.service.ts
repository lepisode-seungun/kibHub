import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AlbumsService {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  async findAll(ownerId: number, type?: 'ALBUM' | 'BOOKMARK') {
    return this.prisma.album.findMany({
      where: { ownerId, ...(type ? { type } : {}) },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { albumContents: true } },
        albumContents: {
          orderBy: { createdAt: 'desc' },
          include: {
            content: {
              select: {
                id: true, thumbnail: true, title: true,
                author: { select: { id: true, nickname: true, name: true } },
                _count: { select: { comments: true } },
                comments: {
                  take: 1,
                  orderBy: { likeCount: 'desc' },
                  where: { parentId: null, status: 'VISIBLE', markerNum: { not: null } },
                  select: { body: true, createdAt: true, author: { select: { nickname: true, name: true } } },
                },
              },
            },
          },
        },
      },
    });
  }

  async findOne(id: number) {
    return this.prisma.album.findUnique({
      where: { id },
      include: {
        _count: { select: { albumContents: true } },
        albumContents: {
          orderBy: { createdAt: 'desc' },
          include: {
            content: {
              include: {
                author: { select: { id: true, nickname: true, name: true } },
                _count: { select: { comments: true } },
              },
            },
          },
        },
      },
    });
  }

  async create(data: { name: string; ownerId: number; type?: 'ALBUM' | 'BOOKMARK' }) {
    return this.prisma.album.create({ data: { name: data.name, ownerId: data.ownerId, type: data.type || 'ALBUM' } });
  }

  async update(id: number, data: { name?: string }) {
    return this.prisma.album.update({ where: { id }, data });
  }

  async delete(id: number) {
    // 앨범에 속한 콘텐츠 ID 조회
    const albumContents = await this.prisma.albumContent.findMany({
      where: { albumId: id },
      select: { contentId: true },
    });
    const contentIds = albumContents.map(ac => ac.contentId);

    // 트랜잭션으로 앨범 + 하위 콘텐츠 일괄 삭제
    return this.prisma.$transaction(async (tx) => {
      // 1) 조인 테이블 삭제
      await tx.albumContent.deleteMany({ where: { albumId: id } });
      // 2) 콘텐츠 삭제
      if (contentIds.length > 0) {
        await tx.content.deleteMany({ where: { id: { in: contentIds } } });
      }
      // 3) 앨범 삭제
      return tx.album.delete({ where: { id } });
    });
  }

  async addContent(albumId: number, contentId: number) {
    return this.prisma.albumContent.create({
      data: { albumId, contentId },
    });
  }

  async removeContent(albumId: number, contentId: number) {
    return this.prisma.albumContent.deleteMany({
      where: { albumId, contentId },
    });
  }
}
