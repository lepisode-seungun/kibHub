import { Component, signal, computed, OnDestroy, OnInit, inject, NgZone, ApplicationRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HeroBannerComponent, FloatingCard } from '../../components/hero-banner/hero-banner.component';
import { ApiService } from '../../services/api.service';

interface PortfolioCard {
  id: number;
  thumbnailGradient: string;
  thumbnailUrl?: string;
  badgeText: string | null;
  statusText: string;
  bootcampName: string;
  summary: string;
  link: string;
  title?: string;
  studentName?: string;
  cohort?: string;
  platform?: string;
  platformLink?: string;
  description?: string;
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
  private ngZone = inject(NgZone);
  private appRef = inject(ApplicationRef);
  private platformId = inject(PLATFORM_ID);
  private route = inject(ActivatedRoute);
  isLoading = signal(false);
  selectedCard = signal<PortfolioCard | null>(null);

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadPortfolios();
    }
  }

  private loadPortfolios(): void {
    this.isLoading.set(true);
    this.ngZone.run(async () => {
      try {
        const data = await this.api.portfolios.findHallOfFame();
        console.log('[HallOfFame] API 응답:', data?.length, '개', data);
        this.cards.set(data.map((p: any, i: number) => {
          const bgStyle = p.thumbnail
            ? `url('${p.thumbnail}') center/cover no-repeat`
            : this.gradients[i % this.gradients.length];
          return {
            id: p.id,
            thumbnailGradient: bgStyle,
            thumbnailUrl: p.thumbnail || '',
            badgeText: p.genre || '명예의 전당',
            statusText: p.userName ? `${p.userName} 수강생` : '수강생',
            bootcampName: p.workTitle || p.bootcampName || '작품명 미정',
            summary: p.workIntro || p.bootcampName || '',
            link: p.launchUrl || '#',
            title: p.workTitle || '작품명 미정',
            studentName: p.userName || p.authorName || '수강생',
            cohort: p.bootcampName || '',
            platform: p.launchPlatform || '플랫폼',
            platformLink: p.launchUrl || '#',
            description: p.workIntro || '',
          };
        }));
      } catch (e) {
        console.error('포트폴리오 로드 실패:', e);
      } finally {
        this.isLoading.set(false);
        this.appRef.tick();

        // 검색에서 ?open=id 로 진입 시 자동으로 모달 열기
        this.route.queryParams.subscribe(params => {
          const openId = params['open'];
          if (openId) {
            const card = this.cards().find(c => c.id === Number(openId));
            if (card) this.openCard(card);
          }
        });
      }
    });
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

  cards = signal<PortfolioCard[]>([]);

  /** 히어로 배너에 전달할 카드 (최대 6장) */
  bannerCards = computed<FloatingCard[]>(() =>
    this.cards().map(c => ({
      id: c.id,
      bootcampName: c.bootcampName,
      summary: c.summary,
      statusText: c.statusText,
      thumbnailGradient: c.thumbnailGradient,
      thumbnailUrl: c.thumbnailUrl,
    }))
  );

  cardRows = computed<PortfolioCard[][]>(() => {
    const rows: PortfolioCard[][] = [];
    const allCards = this.cards();
    for (let i = 0; i < allCards.length; i += 4) {
      rows.push(allCards.slice(i, i + 4));
    }
    return rows;
  });

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
