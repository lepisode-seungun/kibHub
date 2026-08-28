import { Component, ViewChild, ElementRef, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HomeBannerComponent } from '../../components/home-banner/home-banner.component';
import { ApiService } from '../../services/api.service';

export interface BootcampCard {
  id: number;
  name: string;
  summary: string;
  status: 'recruiting' | 'closed';
  statusText: string;
  deadline: string | null;
  thumbnailGradient: string;
  thumbnailUrl: string | null;
}

@Component({
  selector: 'app-bootcamp-intro',
  standalone: true,
  imports: [CommonModule, RouterModule, HomeBannerComponent],
  templateUrl: './bootcamp-intro.page.html',
  styleUrl: './bootcamp-intro.page.css',
})
export class BootcampIntroPage implements OnInit, OnDestroy {
  private api = inject(ApiService);

  private readonly gradients = [
    'linear-gradient(135deg, #5a3a8c, #2a1a50)',
    'linear-gradient(135deg, #667eea, #764ba2)',
    'linear-gradient(135deg, #f093fb, #f5576c)',
    'linear-gradient(135deg, #4facfe, #00f2fe)',
  ];

  private sanitizer = inject(DomSanitizer);

  academyIntroHtml = signal<SafeHtml | null>(null);
  videoEmbedUrl = signal<any>(null);

  ngOnInit(): void {
    this.loadBootcamps();
    this.loadAcademyIntro();
    this.loadVideoUrl();
  }

  private async loadAcademyIntro(): Promise<void> {
    try {
      const result = await this.api.siteSettings.get('academy_intro');
      if (result.value) {
        this.academyIntroHtml.set(this.sanitizer.bypassSecurityTrustHtml(result.value));
      }
    } catch (e) {
      console.error('소개 콘텐츠 로드 실패:', e);
    }
  }

  private async loadVideoUrl(): Promise<void> {
    try {
      const result = await this.api.siteSettings.get('video_url');
      if (result.value) {
        const embedUrl = this.toVideoEmbed(result.value);
        this.videoEmbedUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl));
      }
    } catch (e) {
      console.error('영상 URL 로드 실패:', e);
    }
  }

  private toVideoEmbed(url: string): string {
    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    if (url.includes('player.vimeo.com')) return url;
    // YouTube
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]+)/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
    if (url.includes('youtube.com/embed')) return url;
    return url;
  }

  private async loadBootcamps(): Promise<void> {
    try {
      const data = await this.api.bootcamps.findAll();
      this.bootcampCards.set(data.map((b, i) => ({
        id: b.id,
        name: b.name,
        summary: b.description || '',
        status: b.status === 'RECRUITING' ? 'recruiting' as const : 'closed' as const,
        statusText: b.status === 'RECRUITING' ? '모집중' : '모집마감',
        deadline: null,
        thumbnailGradient: this.gradients[i % this.gradients.length],
        thumbnailUrl: b.thumbnail || null,
      })));
    } catch (e) {
      console.error('부트캠프 로드 실패:', e);
    }
  }
  bootcampCards = signal<BootcampCard[]>([]);

  // ===== 카드 드래그 스크롤 =====
  @ViewChild('cardsRow') cardsRowRef!: ElementRef<HTMLDivElement>;
  private isCardsDragging = false;
  private hasDragged = false;
  private cardsDragStartX = 0;
  private cardsScrollLeft = 0;

  onCardsMouseDown(event: MouseEvent): void {
    const el = this.cardsRowRef?.nativeElement;
    if (!el) return;
    event.preventDefault();
    this.isCardsDragging = true;
    this.hasDragged = false;
    this.cardsDragStartX = event.pageX - el.offsetLeft;
    this.cardsScrollLeft = el.scrollLeft;
    el.classList.add('dragging');
    document.addEventListener('mousemove', this.boundCardsMouseMove);
    document.addEventListener('mouseup', this.boundCardsMouseUp);
  }

  onCardsMouseUp(): void {
    this.isCardsDragging = false;
    this.cardsRowRef?.nativeElement?.classList.remove('dragging');
    document.removeEventListener('mousemove', this.boundCardsMouseMove);
    document.removeEventListener('mouseup', this.boundCardsMouseUp);
  }

  onCardClick(event: MouseEvent, cardId: number): void {
    if (this.hasDragged) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
  }

  private boundCardsMouseMove = (e: MouseEvent): void => {
    if (!this.isCardsDragging) return;
    e.preventDefault();
    this.hasDragged = true;
    const el = this.cardsRowRef.nativeElement;
    const x = e.pageX - el.offsetLeft;
    const walk = (x - this.cardsDragStartX) * 1.5;
    el.scrollLeft = this.cardsScrollLeft - walk;
  };

  private boundCardsMouseUp = (): void => {
    this.onCardsMouseUp();
  };

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

  /* 타임라인 커스텀 스크롤바 */
  @ViewChild('timelineScroll') timelineScrollRef!: ElementRef<HTMLDivElement>;
  @ViewChild('scrollbarTrack') scrollbarTrackRef!: ElementRef<HTMLDivElement>;
  timelineThumbTop = 0;
  private isDragging = false;
  private dragStartY = 0;
  private dragStartScrollTop = 0;

  private boundMouseMove = this.onMouseMove.bind(this);
  private boundMouseUp = this.onMouseUp.bind(this);

  onTimelineScroll(): void {
    const el = this.timelineScrollRef?.nativeElement;
    if (!el) return;

    const maxScroll = el.scrollHeight - el.clientHeight;
    if (maxScroll <= 0) return;

    const thumbHeight = 38;
    const maxTop = 100 - thumbHeight;
    this.timelineThumbTop = (el.scrollTop / maxScroll) * maxTop;
  }

  /* thumb 드래그 시작 */
  onThumbMousedown(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
    this.dragStartY = event.clientY;
    this.dragStartScrollTop = this.timelineScrollRef.nativeElement.scrollTop;
    document.addEventListener('mousemove', this.boundMouseMove);
    document.addEventListener('mouseup', this.boundMouseUp);
  }

  /* 드래그 중 */
  private onMouseMove(event: MouseEvent): void {
    if (!this.isDragging) return;

    const el = this.timelineScrollRef.nativeElement;
    const trackEl = this.scrollbarTrackRef.nativeElement;
    const trackHeight = trackEl.clientHeight;
    const maxScroll = el.scrollHeight - el.clientHeight;
    const deltaY = event.clientY - this.dragStartY;
    const scrollRatio = deltaY / trackHeight;

    el.scrollTop = this.dragStartScrollTop + scrollRatio * maxScroll;
  }

  /* 드래그 종료 */
  private onMouseUp(): void {
    this.isDragging = false;
    document.removeEventListener('mousemove', this.boundMouseMove);
    document.removeEventListener('mouseup', this.boundMouseUp);
  }

  /* track 클릭 시 해당 위치로 점프 */
  onScrollbarTrackClick(event: MouseEvent): void {
    const trackEl = this.scrollbarTrackRef.nativeElement;
    const el = this.timelineScrollRef.nativeElement;
    const rect = trackEl.getBoundingClientRect();
    const clickRatio = (event.clientY - rect.top) / rect.height;
    const maxScroll = el.scrollHeight - el.clientHeight;

    el.scrollTop = clickRatio * maxScroll;
  }

  ngOnDestroy(): void {
    document.removeEventListener('mousemove', this.boundMouseMove);
    document.removeEventListener('mouseup', this.boundMouseUp);
    document.removeEventListener('mousemove', this.boundCardsMouseMove);
    document.removeEventListener('mouseup', this.boundCardsMouseUp);
  }
}
