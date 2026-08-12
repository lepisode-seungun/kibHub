import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface FloatingCard {
  id: number;
  bootcampName: string;
  summary: string;
  statusText: string;
  thumbnailGradient: string;
}

@Component({
  selector: 'app-hero-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hero-banner.component.html',
  styleUrl: './hero-banner.component.css',
})
export class HeroBannerComponent {
  /** Real portfolio cards that float over the Figma background */
  floatingCards: FloatingCard[] = [
    { id: 1, bootcampName: '코드잇', summary: '풀스택 웹 개발 부트캠프', statusText: '01.15 모집 마감', thumbnailGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    { id: 2, bootcampName: '엘리스', summary: 'AI 엔지니어링 트랙', statusText: '02.01 모집 마감', thumbnailGradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
    { id: 3, bootcampName: '항해99', summary: '프론트엔드 심화 과정', statusText: '01.20 모집 마감', thumbnailGradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
    { id: 4, bootcampName: '우테코', summary: '백엔드 프리코스 6기', statusText: '03.01 모집 마감', thumbnailGradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
    { id: 5, bootcampName: '삼성 SSAFY', summary: 'SSAFY 12기 모집', statusText: '01.31 모집 마감', thumbnailGradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
    { id: 6, bootcampName: '카카오', summary: '클라우드 스쿨 3기', statusText: '02.15 모집 마감', thumbnailGradient: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)' },
  ];
}
