import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NoticesService {
  constructor(private prisma: PrismaService) {}

  findAll(query?: { search?: string; type?: string; bootcampId?: number }) {
    const where: any = {};
    if (query?.type) where.type = query.type;
    if (query?.bootcampId) where.bootcampId = query.bootcampId;
    if (query?.search) {
      where.title = { contains: query.search, mode: 'insensitive' };
    }
    return this.prisma.notice.findMany({
      where,
      include: {
        author: { select: { id: true, name: true, nickname: true } },
        files: true,
      },
      orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
    });
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

  create(data: any) {
    return this.prisma.notice.create({ data });
  }

  update(id: number, data: any) {
    return this.prisma.notice.update({ where: { id }, data });
  }

  delete(id: number) {
    return this.prisma.notice.delete({ where: { id } });
  }
}
