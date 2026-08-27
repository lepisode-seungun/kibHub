import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../../../../prisma/generated/prisma/client';
import { CreatePortfolioDto, PaginatedResponse } from '@kibhub/shared';
import { paginate, parsePagination } from '../common/pagination';

@Injectable()
export class PortfoliosService {
  constructor(private prisma: PrismaService) {}

  async findAll(query?: { search?: string; isHallOfFame?: boolean; page?: string | number; limit?: string | number }): Promise<PaginatedResponse<unknown> | unknown[]> {
    const where: Prisma.PortfolioWhereInput = {};
    if (query?.isHallOfFame !== undefined) where.isHallOfFame = query.isHallOfFame;
    if (query?.search) {
      where.OR = [
        { userName: { contains: query.search, mode: 'insensitive' } },
        { workTitle: { contains: query.search, mode: 'insensitive' } },
        { bootcampName: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const include = { files: true };

    if (query?.page || query?.limit) {
      const { page, limit, skip } = parsePagination(query);
      const [data, total] = await Promise.all([
        this.prisma.portfolio.findMany({ where, include, orderBy: { createdAt: 'desc' }, skip, take: limit }),
        this.prisma.portfolio.count({ where }),
      ]);
      return paginate(data, total, page, limit);
    }
    return this.prisma.portfolio.findMany({ where, include, orderBy: { createdAt: 'desc' } });
  }

  findOne(id: number) {
    return this.prisma.portfolio.findUnique({
      where: { id },
      include: { files: { orderBy: { episode: 'asc' } } },
    });
  }

  create(data: CreatePortfolioDto) {
    return this.prisma.portfolio.create({ data: data as Prisma.PortfolioCreateInput });
  }

  update(id: number, data: Partial<CreatePortfolioDto>) {
    return this.prisma.portfolio.update({ where: { id }, data: data as Prisma.PortfolioUpdateInput });
  }

  delete(id: number) {
    return this.prisma.portfolio.delete({ where: { id } });
  }
}
