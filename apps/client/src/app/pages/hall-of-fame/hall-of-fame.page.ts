import { Component, signal, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeroBannerComponent } from '../../components/hero-banner/hero-banner.component';
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
  isLoading = signal(false);
  selectedCard = signal<PortfolioCard | null>(null);

  ngOnInit(): void { this.loadPortfolios(); }

  private async loadPortfolios(): Promise<void> {
    this.isLoading.set(true);
    try {
      const data = await this.api.portfolios.findHallOfFame();
      this.cards = data.map((p: any, i: number) => ({
        id: p.id,
        thumbnailGradient: this.gradients[i % this.gradients.length],
        thumbnailUrl: p.thumbnail || '',
        badgeText: null,
        statusText: p.genre || '',
        bootcampName: p.bootcampName || '',
        summary: p.workIntro || '',
        link: p.launchUrl || '#',
        title: p.workTitle || '',
        studentName: p.userName || p.authorName || '',
        cohort: p.bootcampName || '',
        platform: p.launchPlatform || '',
        platformLink: p.launchUrl || '#',
        description: p.workIntro || '',
      }));
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

  cards: PortfolioCard[] = [];

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
