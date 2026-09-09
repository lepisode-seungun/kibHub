import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/generated';
import { CreateFaqDto, PaginatedResponse } from '@kibhub/shared';
import { paginate, parsePagination } from '../common/pagination';

@Injectable()
export class FaqsService {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  async findAll(query?: { search?: string; status?: string; page?: string | number; limit?: string | number }): Promise<PaginatedResponse<unknown> | unknown[]> {
    const where: Prisma.FaqWhereInput = {};
    if (query?.status) where.status = query.status as Prisma.FaqWhereInput['status'];
    if (query?.search) {
      where.OR = [
        { question: { contains: query.search, mode: 'insensitive' } },
        { answer: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const include = { author: { select: { id: true, name: true, nickname: true } }, files: true };

    if (query?.page || query?.limit) {
      const { page, limit, skip } = parsePagination(query);
      const [data, total] = await Promise.all([
        this.prisma.faq.findMany({ where, include, orderBy: { createdAt: 'desc' }, skip, take: limit }),
        this.prisma.faq.count({ where }),
      ]);
      return paginate(data, total, page, limit);
    }
    return this.prisma.faq.findMany({ where, include, orderBy: { createdAt: 'desc' } });
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

  create(data: CreateFaqDto & { authorId: number }) {
    return this.prisma.faq.create({ data: data as Prisma.FaqUncheckedCreateInput });
  }

  update(id: number, data: Partial<CreateFaqDto>) {
    return this.prisma.faq.update({ where: { id }, data: data as Prisma.FaqUpdateInput });
  }

  delete(id: number) {
    return this.prisma.faq.delete({ where: { id } });
  }
}
