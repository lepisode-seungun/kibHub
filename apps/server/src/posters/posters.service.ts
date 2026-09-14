import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PostersService {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  findAll() {
    return this.prisma.poster.findMany({ orderBy: { displayOrder: 'asc' } });
  }

  findOne(id: number) {
    return this.prisma.poster.findUnique({ where: { id } });
  }

  create(data: { imageUrl: string; title?: string; displayOrder?: number }) {
    return this.prisma.poster.create({
      data: {
        imageUrl: data.imageUrl,
        title: data.title || '',
        displayOrder: data.displayOrder || 0,
      },
    });
  }

  update(id: number, data: { imageUrl?: string; title?: string; displayOrder?: number }) {
    const updateData: Record<string, string | number> = {};
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
    if (data.title !== undefined) updateData.title = data.title;
    if (data.displayOrder !== undefined) updateData.displayOrder = data.displayOrder;
    return this.prisma.poster.update({ where: { id }, data: updateData });
  }

  delete(id: number) {
    return this.prisma.poster.delete({ where: { id } });
  }
}
