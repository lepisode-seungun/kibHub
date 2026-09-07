import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  async search(q: string) {
    if (!q.trim()) return { contents: [], bootcamps: [], portfolios: [] };

    const [contents, bootcamps, portfolios] = await Promise.all([
      // 콘텐츠: 제목, 작성자 닉네임/아이디
      this.prisma.content.findMany({
        where: {
          status: 'VISIBLE',
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { author: { nickname: { contains: q, mode: 'insensitive' } } },
            { author: { email: { contains: q, mode: 'insensitive' } } },
          ],
        },
        include: {
          author: { select: { id: true, nickname: true, name: true, profileImage: true } },
          category: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),

      // 부트캠프: 이름, 설명
      this.prisma.bootcamp.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ],
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),

      // 포트폴리오 + 명예의전당: 유저명, 부트캠프명, 작품명, 장르
      this.prisma.portfolio.findMany({
        where: {
          status: 'VISIBLE',
          OR: [
            { userName: { contains: q, mode: 'insensitive' } },
            { bootcampName: { contains: q, mode: 'insensitive' } },
            { workTitle: { contains: q, mode: 'insensitive' } },
            { authorName: { contains: q, mode: 'insensitive' } },
            { genre: { contains: q, mode: 'insensitive' } },
          ],
        },
        include: { files: { take: 1 } },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);

    return { contents, bootcamps, portfolios };
  }
}
