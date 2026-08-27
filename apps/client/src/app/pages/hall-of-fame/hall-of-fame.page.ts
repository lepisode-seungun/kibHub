import { Component, signal, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeroBannerComponent } from '../../components/hero-banner/hero-banner.component';
import { ApiService } from '../../services/api.service';

interface PortfolioCard {
  id: number;
  thumbnailGradient: string;
  badgeText: string | null;
  statusText: string;
  bootcampName: string;
  summary: string;
  link: string;
  // 상세 데이터
  title?: string;
  studentName?: string;
  cohort?: string;
  platform?: string;
  platformLink?: string;
  description?: string;
  thumbnailUrl?: string;
}

@Component({
  selector: 'app-hall-of-fame-page',
  standalone: true,
  imports: [CommonModule, HeroBannerComponent],
  templateUrl: './hall-of-fame.page.html',
  styleUrl: './hall-of-fame.page.css',
})
export class HallOfFamePage implements OnInit, OnDestroy {
  private api = inject(ApiService);
  isLoading = signal(false);
  selectedCard = signal<PortfolioCard | null>(null);

  ngOnInit(): void { this.loadPortfolios(); }

  private async loadPortfolios(): Promise<void> {
    this.isLoading.set(true);
    try {
      const data = await this.api.portfolios.findHallOfFame();
      if (data.length > 0) {
        // API 데이터를 기존 더미 카드 앞에 병합 (API 데이터 우선)
        const apiCards: PortfolioCard[] = data.map((p, i) => ({
          id: p.id,
          thumbnailGradient: this.gradients[i % this.gradients.length],
          badgeText: null,
          statusText: p.genre || '',
          bootcampName: p.bootcampName || '',
          summary: p.workIntro || '',
          link: p.link || '#',
          title: p.workTitle || '',
          studentName: p.userName || p.authorName || '',
          cohort: p.bootcampName || '',
          platform: '',
          platformLink: p.link || '#',
          description: p.workIntro || '',
        }));
        // API 카드로 교체하되, 부족하면 기존 더미 유지
        if (apiCards.length >= 4) {
          this.cards = apiCards;
        } else {
          // API 카드를 앞에 배치, 나머지는 기존 더미로 채움
          this.cards = [...apiCards, ...this.cards.slice(apiCards.length)];
        }
      }
    } catch (e) {
      console.error('포트폴리오 로드 실패:', e);
    } finally {
      this.isLoading.set(false);
    }
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
  }

  private readonly gradients = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
    'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)',
    'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
    'linear-gradient(135deg, #f5576c 0%, #ff6a88 100%)',
    'linear-gradient(135deg, #667eea 0%, #00c6fb 100%)',
    'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)',
    'linear-gradient(135deg, #fddb92 0%, #d1fdff 100%)',
  ];

  cards: PortfolioCard[] = [
    { id: 1, thumbnailGradient: this.gradients[0], badgeText: null, statusText: '01.15 모집 마감', bootcampName: '코드잇', summary: '풀스택 웹 개발 부트캠프', link: '#', title: '식혜의 모험', studentName: '고예림', cohort: '케나즈 아카데미 초급반 13기', platform: '네이버 웹툰', platformLink: '#', description: '케나즈 아카데미 초급반 13기를 통해 제작한 식혜의 모험 웹툰입니다. 기획부터 원고까지 블라블라 블라블라케나즈 아카데미 초급반 13기를 통해 제작한 식혜의 모험 웹툰입니다. 기획부터 원고까지 블라블라 블라블라케나즈 아카데미 초급반 13기를 통해 제작한 식혜의 모험 웹툰입니다. 기획부터 원고까지 블라블라 블라블라케나즈 아카 여기까지가 200자' },
    { id: 2, thumbnailGradient: this.gradients[1], badgeText: null, statusText: '02.01 모집 마감', bootcampName: '엘리스', summary: 'AI 엔지니어링 트랙', link: '#', title: 'AI 엔지니어링', studentName: '김철수', cohort: '엘리스 AI 2기', platform: 'GitHub', description: 'AI 엔지니어링 트랙 프로젝트입니다.' },
    { id: 3, thumbnailGradient: this.gradients[2], badgeText: null, statusText: '01.20 모집 마감', bootcampName: '항해99', summary: '프론트엔드 심화 과정', link: '#', title: '프론트엔드 심화', studentName: '박지영', cohort: '항해 99 5기', platform: 'Vercel', description: '프론트엔드 심화 과정 프로젝트입니다.' },
    { id: 4, thumbnailGradient: this.gradients[3], badgeText: null, statusText: '03.01 모집 마감', bootcampName: '우테코', summary: '백엔드 프리코스 6기', link: '#', title: '백엔드 프리코스', studentName: '이수진', cohort: '우테코 6기', platform: 'AWS', description: '백엔드 프리코스 프로젝트입니다.' },
    { id: 5, thumbnailGradient: this.gradients[4], badgeText: null, statusText: '01.31 모집 마감', bootcampName: '삼성', summary: 'SSAFY 12기 모집', link: '#', title: 'SSAFY 프로젝트', studentName: '최민호', cohort: 'SSAFY 12기', platform: 'Play Store', description: 'SSAFY 12기 프로젝트입니다.' },
    { id: 6, thumbnailGradient: this.gradients[5], badgeText: null, statusText: '02.15 모집 마감', bootcampName: '카카오', summary: '클라우드 스쿨 3기', link: '#', title: '클라우드 스쿨', studentName: '정은지', cohort: '카카오 3기', platform: 'AWS', description: '클라우드 스쿨 프로젝트입니다.' },
    { id: 7, thumbnailGradient: this.gradients[6], badgeText: null, statusText: '02.28 모집 마감', bootcampName: '네이버', summary: '부스트캠프 웹·모바일', link: '#', title: '부스트캠프', studentName: '한지민', cohort: '네이버 부스트캠프', platform: 'GitHub', description: '부스트캠프 프로젝트입니다.' },
    { id: 8, thumbnailGradient: this.gradients[7], badgeText: null, statusText: '01.10 모집 마감', bootcampName: '패캠', summary: '데이터 사이언스 부트캠프', link: '#', title: '데이터 사이언스', studentName: '오서연', cohort: '패캠 DS 4기', platform: 'Kaggle', description: '데이터 사이언스 프로젝트입니다.' },
    { id: 9, thumbnailGradient: this.gradients[8], badgeText: null, statusText: '03.15 모집 마감', bootcampName: '스파르타', summary: '내일배움캠프 Spring', link: '#', title: 'Spring 프로젝트', studentName: '김영희', cohort: '스파르타 Spring 3기', platform: 'Heroku', description: 'Spring 프로젝트입니다.' },
    { id: 10, thumbnailGradient: this.gradients[9], badgeText: null, statusText: '02.20 모집 마감', bootcampName: '제로베', summary: '프론트엔드 스쿨', link: '#', title: 'FE 스쿨', studentName: '이준호', cohort: '제로베 FE 5기', platform: 'Netlify', description: 'FE 스쿨 프로젝트입니다.' },
    { id: 11, thumbnailGradient: this.gradients[10], badgeText: null, statusText: '01.25 모집 마감', bootcampName: '멋쟁이', summary: '사자처럼 백엔드 스쿨', link: '#', title: '백엔드 스쿨', studentName: '박수진', cohort: '멋쟁이 BE 8기', platform: 'Docker Hub', description: '백엔드 스쿨 프로젝트입니다.' },
    { id: 12, thumbnailGradient: this.gradients[11], badgeText: null, statusText: '03.05 모집 마감', bootcampName: '크래프톤', summary: '정글 6기 모집', link: '#', title: '정글 프로젝트', studentName: '손지우', cohort: '크래프톤 정글 6기', platform: 'App Store', description: '정글 6기 프로젝트입니다.' },
  ];

  get cardRows(): PortfolioCard[][] {
    const rows: PortfolioCard[][] = [];
    for (let i = 0; i < this.cards.length; i += 4) {
      rows.push(this.cards.slice(i, i + 4));
    }
    return rows;
  }

  trackByCardId(_index: number, card: PortfolioCard): number {
    return card.id;
  }

  openCard(card: PortfolioCard): void {
    this.selectedCard.set(card);
    document.body.style.overflow = 'hidden';
  }

  closeCard(): void {
    this.selectedCard.set(null);
    document.body.style.overflow = '';
  }
}
