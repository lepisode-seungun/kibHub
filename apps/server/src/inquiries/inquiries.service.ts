import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../../../../prisma/generated/prisma/client';
import { CreateInquiryDto, PaginatedResponse } from '@kibhub/shared';
import { paginate, parsePagination } from '../common/pagination';

@Injectable()
export class InquiriesService {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  async findAll(query?: { search?: string; status?: string; page?: string | number; limit?: string | number }): Promise<PaginatedResponse<unknown> | unknown[]> {
    const where: Prisma.InquiryWhereInput = {};
    if (query?.status) where.status = query.status as Prisma.InquiryWhereInput['status'];
    if (query?.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { body: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const include = {
      author: { select: { id: true, name: true, nickname: true } },
      repliedBy: { select: { id: true, name: true, nickname: true } },
      files: true,
    };

    if (query?.page || query?.limit) {
      const { page, limit, skip } = parsePagination(query);
      const [data, total] = await Promise.all([
        this.prisma.inquiry.findMany({ where, include, orderBy: { createdAt: 'desc' }, skip, take: limit }),
        this.prisma.inquiry.count({ where }),
      ]);
      return paginate(data, total, page, limit);
    }
    return this.prisma.inquiry.findMany({ where, include, orderBy: { createdAt: 'desc' } });
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

  create(data: CreateInquiryDto & { authorId: number }) {
    return this.prisma.inquiry.create({ data: data as Prisma.InquiryUncheckedCreateInput });
  }

  update(id: number, data: Partial<CreateInquiryDto>) {
    return this.prisma.inquiry.update({ where: { id }, data: data as Prisma.InquiryUpdateInput });
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
