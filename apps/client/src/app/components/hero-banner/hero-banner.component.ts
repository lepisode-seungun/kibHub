import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';

export interface FloatingCard {
  id: number;
  bootcampName?: string;
  summary?: string;
  statusText?: string;
  thumbnailGradient?: string;
  thumbnailUrl?: string;
}

@Component({
  selector: 'app-hero-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hero-banner.component.html',
  styleUrl: './hero-banner.component.css',
})
export class HeroBannerComponent implements OnInit {
  private api = inject(ApiService);

  @Input() inputCards?: FloatingCard[];

  floatingCards: FloatingCard[] = [];

  private readonly gradients = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  ];

  ngOnInit(): void {
    if (this.inputCards && this.inputCards.length > 0) {
      this.floatingCards = this.inputCards;
    } else {
      this.loadHallOfFameCards();
    }
  }

  private async loadHallOfFameCards(): Promise<void> {
    try {
      const data = await this.api.portfolios.findHallOfFame();
      if (data && data.length > 0) {
        this.floatingCards = data.map((p: any, i: number) => ({
          id: p.id,
          bootcampName: p.bootcampName || '',
          summary: p.workIntro || '',
          statusText: p.genre || '',
          thumbnailUrl: p.thumbnail || '',
          thumbnailGradient: p.thumbnail
            ? `url('${p.thumbnail}') center/cover no-repeat`
            : this.gradients[i % this.gradients.length],
        }));
      }
    } catch (e) {
      console.error('히어로 배너 명예의 전당 로드 실패:', e);
    }
  }
}
