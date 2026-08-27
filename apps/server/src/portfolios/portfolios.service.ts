import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PortfoliosService {
  constructor(private prisma: PrismaService) {}

  findAll(query?: { search?: string; isHallOfFame?: boolean }) {
    const where: any = {};
    if (query?.isHallOfFame !== undefined) where.isHallOfFame = query.isHallOfFame;
    if (query?.search) {
      where.OR = [
        { userName: { contains: query.search, mode: 'insensitive' } },
        { workTitle: { contains: query.search, mode: 'insensitive' } },
        { bootcampName: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    return this.prisma.portfolio.findMany({
      where,
      include: { files: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(id: number) {
    return this.prisma.portfolio.findUnique({
      where: { id },
      include: { files: { orderBy: { episode: 'asc' } } },
    });
  }

  create(data: any) {
    return this.prisma.portfolio.create({ data });
  }

  update(id: number, data: any) {
    return this.prisma.portfolio.update({ where: { id }, data });
  }

  delete(id: number) {
    return this.prisma.portfolio.delete({ where: { id } });
  }
}
