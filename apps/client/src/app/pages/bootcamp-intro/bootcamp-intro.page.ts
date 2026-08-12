import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HomeBannerComponent } from '../../components/home-banner/home-banner.component';

export interface BootcampCard {
  id: number;
  name: string;
  summary: string;
  status: 'recruiting' | 'closed';
  statusText: string;
  deadline: string | null;
  thumbnailGradient: string;
}

@Component({
  selector: 'app-bootcamp-intro',
  standalone: true,
  imports: [CommonModule, RouterModule, HomeBannerComponent],
  templateUrl: './bootcamp-intro.page.html',
  styleUrl: './bootcamp-intro.page.css',
})
export class BootcampIntroPage {
  bootcampCards: BootcampCard[] = [
    {
      id: 1,
      name: '코드잇 스프린트',
      summary: '풀스택 웹 개발 부트캠프',
      status: 'recruiting',
      statusText: '모집중',
      deadline: '01.15 모집 마감',
      thumbnailGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    },
    {
      id: 2,
      name: '엘리스',
      summary: 'AI 트랙',
      status: 'recruiting',
      statusText: '모집중',
      deadline: '02.01 모집 마감',
      thumbnailGradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    },
    {
      id: 3,
      name: '항해99 프론트엔드',
      summary: '프론트엔드 심화 과정',
      status: 'closed',
      statusText: '모집마감',
      deadline: null,
      thumbnailGradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    },
    {
      id: 4,
      name: '우테코',
      summary: '6기 모집',
      status: 'recruiting',
      statusText: '모집중',
      deadline: '03.01 모집 마감',
      thumbnailGradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    },
  ];

  // History 쇼케이스 캐러셀
  showcaseImages: string[] = [
    '/images/history-showcase.png',
  ];
  showcaseIndex = 0;

  get showcaseCurrent(): number {
    return this.showcaseIndex + 1;
  }

  get showcaseTotal(): number {
    return this.showcaseImages.length;
  }

  get showcaseImageSrc(): string {
    return this.showcaseImages[this.showcaseIndex];
  }

  prevShowcase(): void {
    if (this.showcaseIndex > 0) {
      this.showcaseIndex--;
    }
  }

  nextShowcase(): void {
    if (this.showcaseIndex < this.showcaseImages.length - 1) {
      this.showcaseIndex++;
    }
  }
}
