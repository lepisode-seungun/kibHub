import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../../../../prisma/generated/prisma/client';
import { CreateBootcampDto, PaginatedResponse } from '@kibhub/shared';
import { paginate, parsePagination } from '../common/pagination';

@Injectable()
export class BootcampsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query?: { search?: string; status?: string; page?: string | number; limit?: string | number }): Promise<PaginatedResponse<unknown> | unknown[]> {
    const where: Prisma.BootcampWhereInput = {};
    if (query?.status) where.status = query.status as Prisma.BootcampWhereInput['status'];
    if (query?.search) {
      where.name = { contains: query.search, mode: 'insensitive' };
    }

    if (query?.page || query?.limit) {
      const { page, limit, skip } = parsePagination(query);
      const [data, total] = await Promise.all([
        this.prisma.bootcamp.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
        this.prisma.bootcamp.count({ where }),
      ]);
      return paginate(data, total, page, limit);
    }
    return this.prisma.bootcamp.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  findOne(id: number) {
    return this.prisma.bootcamp.findUnique({
      where: { id },
      include: { courses: { include: { lectures: true, assignments: true } } },
    });
  }

  create(data: CreateBootcampDto) {
    return this.prisma.bootcamp.create({ data: data as Prisma.BootcampCreateInput });
  }

  update(id: number, data: Partial<CreateBootcampDto>) {
    return this.prisma.bootcamp.update({ where: { id }, data: data as Prisma.BootcampUpdateInput });
  }

  delete(id: number) {
    return this.prisma.bootcamp.delete({ where: { id } });
  }
}
