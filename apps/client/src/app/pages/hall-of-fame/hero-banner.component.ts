import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface FloatingCard {
  id: number;
  bootcampName: string;
  summary: string;
  statusText: string;
  thumbnailGradient: string;
  thumbnailUrl?: string;
}

/** 이미지 없는 카드를 위한 테마 어울리는 그라데이션 팔레트 */
const THEME_GRADIENTS = [
  'linear-gradient(135deg, #2d1b69 0%, #11071f 100%)',
  'linear-gradient(135deg, #1a2a6c 0%, #0b0c2a 100%)',
  'linear-gradient(135deg, #3a1c71 0%, #1a0a3e 100%)',
  'linear-gradient(135deg, #141e30 0%, #243b55 100%)',
  'linear-gradient(135deg, #0f0c29 0%, #302b63 100%)',
  'linear-gradient(135deg, #1f1235 0%, #2b1055 100%)',
];

@Component({
  selector: 'app-hero-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hero-banner.component.html',
  styleUrl: './hero-banner.component.css',
})
export class HeroBannerComponent {
  /** 외부에서 전달받는 카드 데이터 (최대 6장) */
  cards = input<FloatingCard[]>([]);

  /** 외부 카드만 사용, 없으면 빈 배열.
   *  반응형에서 숨겨지지 않는 위치(1, 4)를 먼저 채움 */
  private readonly positionOrder = [1, 4, 0, 3, 2, 5];

  floatingCards = computed(() => {
    const raw = this.cards().slice(0, 6);
    return raw.map((c, i) => ({
      ...c,
      posIndex: this.positionOrder[i] ?? i,
      thumbnailGradient: c.thumbnailGradient || THEME_GRADIENTS[i % THEME_GRADIENTS.length],
    }));
  });
}
