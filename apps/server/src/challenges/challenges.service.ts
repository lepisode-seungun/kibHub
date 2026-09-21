import { Injectable, NotFoundException, ForbiddenException, ConflictException, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChallengesService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  // ===== 클라이언트 API =====

  /** 챌린지 목록 (클라이언트: isVisible=true만) */
  async findAll(status?: string, includeHidden = false) {
    const where: any = {};
    if (!includeHidden) where.isVisible = true;
    if (status) where.status = status;

    const challenges = await this.prisma.challenge.findMany({
      where,
      include: {
        _count: { select: { entries: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return challenges.map(c => ({
      ...c,
      entryCount: (c as any)._count.entries,
      _count: undefined,
    }));
  }

  /** 챌린지 상세 */
  async findOne(id: number) {
    const challenge = await this.prisma.challenge.findUnique({
      where: { id },
      include: {
        _count: { select: { entries: true } },
      },
    });
    if (!challenge) throw new NotFoundException('챌린지를 찾을 수 없습니다.');

    return {
      ...challenge,
      entryCount: (challenge as any)._count.entries,
      _count: undefined,
    };
  }

  /** 출품작 목록 */
  async findEntries(challengeId: number, sort: string = 'latest', userId?: number) {
    const orderBy = sort === 'likes' ? { likeCount: 'desc' as const } : { createdAt: 'desc' as const };

    const entries = await this.prisma.challengeEntry.findMany({
      where: { challengeId },
      include: {
        user: { select: { id: true, nickname: true, profileImage: true } },
        likes: userId ? { where: { userId }, select: { id: true } } : false,
      },
      orderBy,
    });

    return entries.map(e => ({
      ...e,
      isLiked: userId ? (e as any).likes?.length > 0 : false,
      likes: undefined,
    }));
  }

  /** 내 출품작 조회 */
  async findMyEntry(challengeId: number, userId: number) {
    return this.prisma.challengeEntry.findFirst({
      where: { challengeId, userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** 작품 제출 */
  async submitEntry(
    challengeId: number,
    userId: number,
    data: { title: string; description?: string; images?: string[] },
  ) {
    const challenge = await this.prisma.challenge.findUnique({ where: { id: challengeId } });
    if (!challenge) throw new NotFoundException('챌린지를 찾을 수 없습니다.');
    if (challenge.status !== 'ACTIVE') throw new ForbiddenException('현재 작품을 제출할 수 없는 상태입니다.');

    // 제출 수 체크
    const existingCount = await this.prisma.challengeEntry.count({
      where: { challengeId, userId },
    });
    if (existingCount >= challenge.maxSubmissions) {
      throw new ConflictException(`최대 ${challenge.maxSubmissions}개까지 제출 가능합니다.`);
    }

    // 부트캠프 전용 체크
    if (challenge.isBootcampOnly && challenge.bootcampId) {
      const applicant = await this.prisma.applicant.findUnique({
        where: { userId_bootcampId: { userId, bootcampId: challenge.bootcampId } },
      });
      if (!applicant || (applicant.status !== 'ACCEPTED' && applicant.status !== 'COMPLETED')) {
        throw new ForbiddenException('부트캠프 수강생만 참여할 수 있습니다.');
      }
    }

    return this.prisma.challengeEntry.create({
      data: {
        challengeId,
        userId,
        title: data.title,
        description: data.description || '',
        images: data.images || [],
      },
    });
  }

  /** 작품 수정 */
  async updateEntry(entryId: number, userId: number, data: { title?: string; description?: string; images?: string[] }) {
    const entry = await this.prisma.challengeEntry.findUnique({ where: { id: entryId } });
    if (!entry) throw new NotFoundException('출품작을 찾을 수 없습니다.');
    if (entry.userId !== userId) throw new ForbiddenException('본인의 작품만 수정할 수 있습니다.');

    return this.prisma.challengeEntry.update({
      where: { id: entryId },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.images !== undefined && { images: data.images }),
      },
    });
  }

  /** 작품 삭제 */
  async deleteEntry(entryId: number, userId: number) {
    const entry = await this.prisma.challengeEntry.findUnique({ where: { id: entryId } });
    if (!entry) throw new NotFoundException('출품작을 찾을 수 없습니다.');
    if (entry.userId !== userId) throw new ForbiddenException('본인의 작품만 삭제할 수 있습니다.');

    await this.prisma.challengeEntryLike.deleteMany({ where: { entryId } });
    await this.prisma.challengeEntry.delete({ where: { id: entryId } });
    return { deleted: true };
  }

  /** 좋아요 토글 */
  async toggleLike(entryId: number, userId: number) {
    const entry = await this.prisma.challengeEntry.findUnique({
      where: { id: entryId },
      include: { challenge: { select: { status: true } } },
    });
    if (!entry) throw new NotFoundException('출품작을 찾을 수 없습니다.');
    if (entry.challenge.status !== 'ACTIVE') throw new ForbiddenException('좋아요를 누를 수 없는 상태입니다.');
    if (entry.userId === userId) throw new ForbiddenException('본인 게시물에는 좋아요를 누를 수 없습니다.');

    const existing = await this.prisma.challengeEntryLike.findUnique({
      where: { entryId_userId: { entryId, userId } },
    });

    if (existing) {
      // 좋아요 취소
      await this.prisma.challengeEntryLike.delete({ where: { id: existing.id } });
      await this.prisma.challengeEntry.update({
        where: { id: entryId },
        data: { likeCount: { decrement: 1 } },
      });
      return { liked: false };
    } else {
      // 좋아요
      await this.prisma.challengeEntryLike.create({
        data: { entryId, userId },
      });
      await this.prisma.challengeEntry.update({
        where: { id: entryId },
        data: { likeCount: { increment: 1 } },
      });
      return { liked: true };
    }
  }

  /** 좋아요 여부 확인 */
  async checkLike(entryId: number, userId: number) {
    const like = await this.prisma.challengeEntryLike.findUnique({
      where: { entryId_userId: { entryId, userId } },
    });
    return { liked: !!like };
  }

  // ===== 어드민 API =====

  /** 챌린지 생성 */
  async create(data: {
    title: string;
    description?: string;
    thumbnail?: string;
    referenceImages?: string[];
    category: string;
    difficulty?: string;
    startDate: string;
    endDate: string;
    maxSubmissions?: number;
    isBootcampOnly?: boolean;
    bootcampId?: number;
    prize?: string;
  }) {
    return this.prisma.challenge.create({
      data: {
        title: data.title,
        description: data.description || '',
        thumbnail: data.thumbnail,
        referenceImages: data.referenceImages || [],
        category: data.category,
        difficulty: data.difficulty,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        maxSubmissions: data.maxSubmissions || 1,
        isBootcampOnly: data.isBootcampOnly || false,
        bootcampId: data.bootcampId,
        prize: data.prize,
      },
    });
  }

  /** 챌린지 수정 */
  async update(id: number, data: any) {
    const challenge = await this.prisma.challenge.findUnique({ where: { id } });
    if (!challenge) throw new NotFoundException('챌린지를 찾을 수 없습니다.');

    const updateData: any = { ...data };
    if (data.startDate) updateData.startDate = new Date(data.startDate);
    if (data.endDate) updateData.endDate = new Date(data.endDate);

    return this.prisma.challenge.update({ where: { id }, data: updateData });
  }

  /** 챌린지 삭제 */
  async remove(id: number) {
    return this.prisma.challenge.delete({ where: { id } });
  }

  /** 출품작 삭제 (어드민) */
  async removeEntry(entryId: number) {
    return this.prisma.challengeEntry.delete({ where: { id: entryId } });
  }

  /** 상태 변경 */
  async updateStatus(id: number, status: string) {
    // ENDED → ACTIVE 전환 시 출품작 + 좋아요 전부 초기화 (빈 상태)
    console.log(`[updateStatus] id=${id}, newStatus=${status}`);
    if (status === 'ACTIVE') {
      const challenge = await this.prisma.challenge.findUnique({ where: { id }, select: { status: true } });
      if (challenge?.status === 'ENDED') {
        // 해당 챌린지의 entry ID 목록 조회
        const entries = await this.prisma.challengeEntry.findMany({
          where: { challengeId: id },
          select: { id: true },
        });
        const entryIds = entries.map(e => e.id);

        if (entryIds.length > 0) {
          // 좋아요 먼저 삭제
          await this.prisma.challengeEntryLike.deleteMany({
            where: { entryId: { in: entryIds } },
          });
          // 출품작 삭제
          await this.prisma.challengeEntry.deleteMany({
            where: { id: { in: entryIds } },
          });
        }
      }
    }

    return this.prisma.challenge.update({
      where: { id },
      data: { status: status as any },
    });
  }

  /** 노출/숨김 변경 */
  async updateVisibility(id: number, isVisible: boolean) {
    return this.prisma.challenge.update({
      where: { id },
      data: { isVisible },
    });
  }

  /** 수상작 선정 */
  async setWinners(id: number, winners: { entryId: number; rank: number }[]) {
    // 기존 수상 초기화
    await this.prisma.challengeEntry.updateMany({
      where: { challengeId: id },
      data: { isWinner: false, rank: null },
    });

    // 수상작 설정
    for (const w of winners) {
      await this.prisma.challengeEntry.update({
        where: { id: w.entryId },
        data: { isWinner: true, rank: w.rank },
      });
    }

    return { success: true };
  }

  /** 챌린지 통계 */
  async getStats(id: number) {
    const challenge = await this.prisma.challenge.findUnique({
      where: { id },
      include: {
        entries: {
          include: {
            user: { select: { id: true, nickname: true, profileImage: true } },
          },
          orderBy: { likeCount: 'desc' },
        },
        _count: { select: { entries: true } },
      },
    });
    if (!challenge) throw new NotFoundException('챌린지를 찾을 수 없습니다.');

    const totalLikes = challenge.entries.reduce((sum, e) => sum + e.likeCount, 0);
    return {
      ...challenge,
      entryCount: (challenge as any)._count.entries,
      totalLikes,
      _count: undefined,
    };
  }
}
