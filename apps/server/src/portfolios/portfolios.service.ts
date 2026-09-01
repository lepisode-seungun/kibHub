import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../../../../prisma/generated/prisma/client';
import { CreatePortfolioDto, PaginatedResponse } from '@kibhub/shared';
import { paginate, parsePagination } from '../common/pagination';

@Injectable()
export class PortfoliosService {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  async findAll(query?: { search?: string; isHallOfFame?: boolean; status?: string; page?: string | number; limit?: string | number }): Promise<PaginatedResponse<unknown> | unknown[]> {
    const where: Prisma.PortfolioWhereInput = {};
    if (query?.isHallOfFame !== undefined) where.isHallOfFame = query.isHallOfFame;
    if (query?.status) where.status = query.status as any;
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

  create(data: CreatePortfolioDto & { files?: { name: string; url: string; size: number; mimeType: string; episode?: number }[] }) {
    const { files, ...rest } = data;
    return this.prisma.portfolio.create({
      data: {
        ...(rest as Prisma.PortfolioCreateInput),
        ...(files?.length ? { files: { create: files } } : {}),
      },
      include: { files: true },
    });
  }

  async update(id: number, data: Partial<CreatePortfolioDto> & { files?: { name: string; url: string; size: number; mimeType: string; episode?: number }[] }) {
    const { files, ...rest } = data;
    // 파일이 있으면 기존 파일 삭제 후 새로 생성
    if (files?.length) {
      await this.prisma.portfolioFile.deleteMany({ where: { portfolioId: id } });
    }
    return this.prisma.portfolio.update({
      where: { id },
      data: {
        ...(rest as Prisma.PortfolioUpdateInput),
        ...(files?.length ? { files: { create: files } } : {}),
      },
      include: { files: true },
    });
  }

  delete(id: number) {
    return this.prisma.portfolio.delete({ where: { id } });
  }
}
