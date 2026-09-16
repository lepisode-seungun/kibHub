import { Injectable, ForbiddenException, NotFoundException, ConflictException, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReviewsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  /** 전체 리뷰 목록 (어드민) */
  async findAll() {
    return this.prisma.review.findMany({
      include: {
        user: { select: { id: true, nickname: true, name: true, email: true, profileImage: true } },
        bootcamp: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** 리뷰 목록 + 통계 */
  async findByBootcamp(bootcampId: number, approvedOnly = false) {
    const where: any = { bootcampId };
    if (approvedOnly) where.isApproved = true;

    const reviews = await this.prisma.review.findMany({
      where,
      include: {
        user: { select: { id: true, nickname: true, profileImage: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 별점 분포
    const ratingDist = [0, 0, 0, 0, 0]; // index 0 = 1점, index 4 = 5점
    reviews.forEach(r => { ratingDist[r.rating - 1]++; });
    const totalCount = reviews.length;
    const avgRating = totalCount > 0
      ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / totalCount) * 10) / 10
      : 0;

    return { reviews, avgRating, totalCount, ratingDist };
  }

  /** 내 리뷰 조회 (최신 1건) */
  async findMine(bootcampId: number, userId: number) {
    return this.prisma.review.findFirst({
      where: { userId, bootcampId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** 리뷰 작성 */
  async create(bootcampId: number, userId: number, data: { rating: number; body: string; images?: string[] }) {
    // 참여자 검증
    const applicant = await this.prisma.applicant.findUnique({
      where: { userId_bootcampId: { userId, bootcampId } },
    });
    if (!applicant || (applicant.status !== 'ACCEPTED' && applicant.status !== 'COMPLETED')) {
      throw new ForbiddenException('부트캠프 참여자만 리뷰를 작성할 수 있습니다.');
    }

    return this.prisma.review.create({
      data: {
        rating: data.rating,
        body: data.body,
        images: data.images || [],
        userId,
        bootcampId,
      },
    });
  }

  /** 리뷰 수정 */
  async update(id: number, userId: number, data: { rating?: number; body?: string; images?: string[] }) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) throw new NotFoundException('리뷰를 찾을 수 없습니다.');
    if (review.userId !== userId) throw new ForbiddenException('본인의 리뷰만 수정할 수 있습니다.');

    return this.prisma.review.update({ where: { id }, data });
  }

  /** 리뷰 삭제 */
  async remove(id: number, userId: number) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) throw new NotFoundException('리뷰를 찾을 수 없습니다.');
    if (review.userId !== userId) throw new ForbiddenException('본인의 리뷰만 삭제할 수 있습니다.');

    return this.prisma.review.delete({ where: { id } });
  }

  /** 리뷰 읽음 처리 */
  async markAsRead(id: number) {
    return this.prisma.review.update({
      where: { id },
      data: { isApproved: true },
    });
  }

  /** 리뷰 일괄 읽음 처리 */
  async markManyAsRead(ids: number[]) {
    return this.prisma.review.updateMany({
      where: { id: { in: ids } },
      data: { isApproved: true },
    });
  }
}
