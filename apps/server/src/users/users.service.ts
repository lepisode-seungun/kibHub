import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  findAll(query?: { search?: string; status?: string; role?: string }) {
    const where: any = {};
    if (query?.status) where.status = query.status;
    if (query?.role) where.role = query.role;
    if (query?.search) {
      where.OR = [
        { email: { contains: query.search, mode: 'insensitive' } },
        { name: { contains: query.search, mode: 'insensitive' } },
        { nickname: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    return this.prisma.user.findMany({
      where,
      select: {
        id: true, email: true, nickname: true, name: true, phone: true,
        countryCode: true, role: true, status: true, adminRole: true,
        loginId: true, createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true, email: true, nickname: true, name: true, phone: true,
        countryCode: true, birthday: true, intro: true, profileImage: true,
        role: true, status: true, adminRole: true, loginId: true,
        createdAt: true, updatedAt: true,
        sns: true,
      },
    });
  }

  update(id: number, data: any) {
    return this.prisma.user.update({ where: { id }, data });
  }

  updateStatus(id: number, status: 'ACTIVE' | 'BLOCKED') {
    return this.prisma.user.update({ where: { id }, data: { status } });
  }

  updateRole(id: number, role: string) {
    return this.prisma.user.update({ where: { id }, data: { role: role as any } });
  }

  delete(id: number) {
    return this.prisma.user.update({
      where: { id },
      data: { status: 'WITHDRAWN' },
    });
  }
}
