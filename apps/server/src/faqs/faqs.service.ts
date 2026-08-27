import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FaqsService {
  constructor(private prisma: PrismaService) {}

  findAll(query?: { search?: string; status?: string }) {
    const where: any = {};
    if (query?.status) where.status = query.status;
    if (query?.search) {
      where.OR = [
        { question: { contains: query.search, mode: 'insensitive' } },
        { answer: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    return this.prisma.faq.findMany({
      where,
      include: {
        author: { select: { id: true, name: true, nickname: true } },
        files: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(id: number) {
    return this.prisma.faq.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true, nickname: true } },
        files: true,
      },
    });
  }

  create(data: any) {
    return this.prisma.faq.create({ data });
  }

  update(id: number, data: any) {
    return this.prisma.faq.update({ where: { id }, data });
  }

  delete(id: number) {
    return this.prisma.faq.delete({ where: { id } });
  }
}
