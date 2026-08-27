import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InquiriesService {
  constructor(private prisma: PrismaService) {}

  findAll(query?: { search?: string; status?: string }) {
    const where: any = {};
    if (query?.status) where.status = query.status;
    if (query?.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { body: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    return this.prisma.inquiry.findMany({
      where,
      include: {
        author: { select: { id: true, name: true, nickname: true } },
        repliedBy: { select: { id: true, name: true, nickname: true } },
        files: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(id: number) {
    return this.prisma.inquiry.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true, nickname: true, email: true } },
        repliedBy: { select: { id: true, name: true, nickname: true } },
        files: true,
      },
    });
  }

  create(data: any) {
    return this.prisma.inquiry.create({ data });
  }

  update(id: number, data: any) {
    return this.prisma.inquiry.update({ where: { id }, data });
  }

  reply(id: number, data: { reply: string; repliedById: number }) {
    return this.prisma.inquiry.update({
      where: { id },
      data: {
        reply: data.reply,
        repliedById: data.repliedById,
        repliedAt: new Date(),
        status: 'COMPLETED',
      },
    });
  }

  delete(id: number) {
    return this.prisma.inquiry.delete({ where: { id } });
  }
}
