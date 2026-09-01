import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HistoriesService {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  async findAll() {
    const items = await this.prisma.history.findMany({
      orderBy: [{ year: 'desc' }, { displayOrder: 'asc' }],
    });
    // 연도별 그룹핑
    const groups: { year: string; items: typeof items }[] = [];
    const map = new Map<string, typeof items>();
    for (const item of items) {
      if (!map.has(item.year)) map.set(item.year, []);
      map.get(item.year)!.push(item);
    }
    for (const [year, yearItems] of map) {
      groups.push({ year, items: yearItems });
    }
    return groups;
  }

  async findAllFlat() {
    return this.prisma.history.findMany({
      orderBy: [{ year: 'desc' }, { displayOrder: 'asc' }],
    });
  }

  findOne(id: number) {
    return this.prisma.history.findUnique({ where: { id } });
  }

  create(data: { year: string; title: string; description?: string; period: string; displayOrder?: number }) {
    return this.prisma.history.create({
      data: {
        year: data.year,
        title: data.title,
        description: data.description || null,
        period: data.period,
        displayOrder: data.displayOrder || 0,
      },
    });
  }

  update(id: number, data: { year?: string; title?: string; description?: string; period?: string; displayOrder?: number }) {
    const updateData: Record<string, any> = {};
    if (data.year !== undefined) updateData.year = data.year;
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description || null;
    if (data.period !== undefined) updateData.period = data.period;
    if (data.displayOrder !== undefined) updateData.displayOrder = data.displayOrder;
    return this.prisma.history.update({ where: { id }, data: updateData });
  }

  delete(id: number) {
    return this.prisma.history.delete({ where: { id } });
  }

  async deleteByYear(year: string) {
    return this.prisma.history.deleteMany({ where: { year } });
  }
}
