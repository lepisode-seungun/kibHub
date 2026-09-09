import { Component, OnInit, OnDestroy, AfterViewInit, inject, signal, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';

export interface BootcampCard {
  id: number;
  name: string;
  summary: string;
  status: string;
  statusText: string;
  deadline: string | null;
  thumbnailGradient: string;
  thumbnailUrl: string | null;
}

@Component({
  selector: 'app-k-digital',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './k-digital.page.html',
  styleUrls: ['./k-digital.page.css'],
})
export class KDigitalPage implements OnInit, OnDestroy, AfterViewInit {
  private api = inject(ApiService);

  heroTitle = '부트캠프';
  heroSubtitle = '전문가가 알려주는 실전 노하우!';

  bootcampCards = signal<BootcampCard[]>([]);
  isLoading = signal(false);
  hasMore = signal(true);
  private currentPage = 1;
  private readonly pageSize = 8;

  private readonly gradients = [
    'linear-gradient(135deg, #5a3a8c, #2a1a50)',
    'linear-gradient(135deg, #667eea, #764ba2)',
    'linear-gradient(135deg, #f093fb, #f5576c)',
    'linear-gradient(135deg, #4facfe, #00f2fe)',
    'linear-gradient(135deg, #43e97b, #38f9d7)',
    'linear-gradient(135deg, #fa709a, #fee140)',
    'linear-gradient(135deg, #a18cd1, #fbc2eb)',
    'linear-gradient(135deg, #ffecd2, #fcb69f)',
  ];

  // IntersectionObserver로 무한 스크롤
  @ViewChild('scrollSentinel') sentinelRef!: ElementRef<HTMLDivElement>;
  private observer: IntersectionObserver | null = null;

  ngOnInit(): void {
    this.loadMore();
  }

  ngAfterViewInit(): void {
    this.setupObserver();
  }

  private setupObserver(): void {
    this.observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && this.hasMore() && !this.isLoading()) {
          this.loadMore();
        }
      },
      { threshold: 0.1 }
    );
    if (this.sentinelRef?.nativeElement) {
      this.observer.observe(this.sentinelRef.nativeElement);
    }
  }

  private readonly STATUS_MAP: Record<string, { status: string; text: string }> = {
    PREPARING: { status: 'preparing', text: '준비중' },
    RECRUITING: { status: 'recruiting', text: '모집중' },
    OPERATING: { status: 'operating', text: '운영중' },
    CLOSED: { status: 'closed', text: '마감' },
    ENDED: { status: 'ended', text: '종료' },
  };

  async loadMore(): Promise<void> {
    if (this.isLoading() || !this.hasMore()) return;
    this.isLoading.set(true);

    try {
      const result = await this.api.bootcamps.findPaged(this.currentPage, this.pageSize);
      const newCards = result.data.map((b, i) => {
        const mapped = this.STATUS_MAP[b.status] || { status: 'closed', text: b.status };
        return {
          id: b.id,
          name: b.name,
          summary: b.description || '',
          status: mapped.status,
          statusText: mapped.text,
          deadline: null,
          thumbnailGradient: this.gradients[(this.bootcampCards().length + i) % this.gradients.length],
          thumbnailUrl: b.thumbnail || null,
        };
      });

      this.bootcampCards.update(prev => [...prev, ...newCards]);
      this.hasMore.set(this.currentPage < result.meta.totalPages);
      this.currentPage++;
    } catch (e) {
      console.error('부트캠프 로드 실패:', e);
    } finally {
      this.isLoading.set(false);
    }
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
