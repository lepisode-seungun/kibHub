import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBannerDto } from '@kibhub/shared';


@Injectable()
export class BannersService {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  findAll() {
    return this.prisma.banner.findMany({ orderBy: { sortOrder: 'asc' } });
  }

  findVisible() {
    return this.prisma.banner.findMany({
      where: { status: 'VISIBLE' },
      orderBy: { sortOrder: 'asc' },
    });
  }

  findOne(id: number) {
    return this.prisma.banner.findUnique({ where: { id } });
  }

  create(data: CreateBannerDto) {
    return this.prisma.banner.create({
      data: {
        status: (data.status as 'VISIBLE' | 'HIDDEN' | 'DELETED') || 'VISIBLE',
        header: data.header,
        content: data.content || '',
        link: data.link || null,
        vimeoLink: data.vimeoLink || null,
        pcImage: data.pcImage || null,
        mobileImage: data.mobileImage || null,
        sortOrder: data.sortOrder || 0,
      },
    });
  }

  update(id: number, data: Partial<CreateBannerDto>) {
    const updateData: Record<string, string | number | null> = {};
    if (data.status !== undefined) updateData.status = data.status;
    if (data.header !== undefined) updateData.header = data.header;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.link !== undefined) updateData.link = data.link || null;
    if (data.vimeoLink !== undefined) updateData.vimeoLink = data.vimeoLink || null;
    if (data.pcImage !== undefined) updateData.pcImage = data.pcImage || null;
    if (data.mobileImage !== undefined) updateData.mobileImage = data.mobileImage || null;
    if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;

    return this.prisma.banner.update({ where: { id }, data: updateData });
  }

  delete(id: number) {
    return this.prisma.banner.delete({ where: { id } });
  }
}
