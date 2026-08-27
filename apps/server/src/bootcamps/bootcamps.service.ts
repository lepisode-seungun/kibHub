import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BootcampsService {
  constructor(private prisma: PrismaService) {}

  findAll(query?: { search?: string; status?: string }) {
    const where: any = {};
    if (query?.status) where.status = query.status;
    if (query?.search) {
      where.name = { contains: query.search, mode: 'insensitive' };
    }
    return this.prisma.bootcamp.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(id: number) {
    return this.prisma.bootcamp.findUnique({
      where: { id },
      include: { courses: { include: { lectures: true, assignments: true } } },
    });
  }

  create(data: any) {
    return this.prisma.bootcamp.create({ data });
  }

  update(id: number, data: any) {
    return this.prisma.bootcamp.update({ where: { id }, data });
  }

  delete(id: number) {
    return this.prisma.bootcamp.delete({ where: { id } });
  }
}
