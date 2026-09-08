import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PartnersService {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  findAll() {
    return this.prisma.partner.findMany({ orderBy: { displayOrder: 'asc' } });
  }

  findOne(id: number) {
    return this.prisma.partner.findUnique({ where: { id } });
  }

  create(data: { name: string; logoUrl: string; link?: string; displayOrder?: number }) {
    return this.prisma.partner.create({
      data: {
        name: data.name,
        logoUrl: data.logoUrl,
        link: data.link || '',
        displayOrder: data.displayOrder || 0,
      },
    });
  }

  update(id: number, data: { name?: string; logoUrl?: string; link?: string; displayOrder?: number }) {
    return this.prisma.partner.update({ where: { id }, data });
  }

  delete(id: number) {
    return this.prisma.partner.delete({ where: { id } });
  }
}
