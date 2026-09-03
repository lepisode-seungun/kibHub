import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SiteSettingsService {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  async get(key: string): Promise<{ key: string; value: string } | null> {
    const setting = await this.prisma.siteSetting.findUnique({ where: { key } });
    return setting ? { key: setting.key, value: setting.value } : null;
  }

  async set(key: string, value: string): Promise<{ key: string; value: string }> {
    const setting = await this.prisma.siteSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });

    // 콘텐츠/댓글 자동 숨김 설정 시 기존 데이터 즉시 적용
    if (key === 'autoHideContentReportCount') {
      await this.applyAutoHide('CONTENT', parseInt(value, 10));
    } else if (key === 'autoHideCommentReportCount') {
      await this.applyAutoHide('COMMENT', parseInt(value, 10));
    }

    return { key: setting.key, value: setting.value };
  }

  /**
   * 특정 타입의 신고 데이터를 스캔하여 threshold 이상 누적된 대상을 HIDDEN 처리
   */
  private async applyAutoHide(type: 'CONTENT' | 'COMMENT', threshold: number): Promise<void> {
    if (isNaN(threshold) || threshold < 1) return;

    try {
      const reports = await this.prisma.report.findMany({
        where: { type },
        select: { targetId: true },
      });

      // targetId별 카운트 집계
      const countMap = new Map<number, number>();
      reports.forEach(r => {
        countMap.set(r.targetId, (countMap.get(r.targetId) || 0) + 1);
      });

      const targetIds: number[] = [];
      countMap.forEach((count, id) => {
        if (count >= threshold) targetIds.push(id);
      });

      console.log(`[AutoHide] type=${type}, threshold=${threshold}, targetIds=${targetIds}`);

      if (targetIds.length === 0) return;

      if (type === 'CONTENT') {
        const result = await this.prisma.content.updateMany({
          where: { id: { in: targetIds }, status: 'VISIBLE' },
          data: { status: 'HIDDEN' },
        });
        console.log(`[AutoHide] ${result.count}개 콘텐츠 숨김 처리`);
      } else {
        const result = await this.prisma.comment.updateMany({
          where: { id: { in: targetIds }, status: 'VISIBLE' },
          data: { status: 'HIDDEN' },
        });
        console.log(`[AutoHide] ${result.count}개 댓글 숨김 처리`);
      }
    } catch (e) {
      console.error('자동 숨김 적용 실패:', e);
    }
  }
}
