import { Component, ViewChild, ElementRef, OnDestroy, OnInit, inject, signal, computed } from '@angular/core';
import { DomSanitizer, SafeHtml, SafeResourceUrl } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HomeBannerComponent } from '../../components/home-banner/home-banner.component';
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

interface PosterResponse {
  id: number;
  imageUrl: string;
  displayOrder: number;
}

interface HistoryItem {
  id: number;
  title: string;
  description: string | null;
  period: string;
}

interface HistoryGroup {
  year: string;
  items: HistoryItem[];
}

interface PartnerResponse {
  id: number;
  name: string;
  logoUrl: string;
  link: string;
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
  videoEmbedUrl = signal<SafeResourceUrl | null>(null);

  ngOnInit(): void {
    this.loadBootcamps();
    this.loadAcademyIntro();
    this.loadVideoUrl();
    this.loadPosters();
    this.loadHistories();
    this.loadPartners().then(() => {
      setTimeout(() => this.initMarquee(), 300);
    });
  }

  // ===== JS 기반 마키 애니메이션 =====
  private marqueeAnimIds: number[] = [];

  private initMarquee(): void {
    const tracks = document.querySelectorAll('.partner-marquee-track');
    tracks.forEach((track, i) => {
      const el = track as HTMLElement;
      const firstSet = el.querySelector('.marquee-set') as HTMLElement;
      if (!firstSet) return;
      const setWidth = firstSet.offsetWidth;
      if (setWidth === 0) return;

      const speed = 0.5; // px per frame
      const direction = i === 0 ? -1 : 1; // 1행: 왼쪽, 2행: 오른쪽
      let pos = direction === -1 ? 0 : -setWidth;

      el.style.transform = `translateX(${pos}px)`;

      const animate = () => {
        pos += speed * direction;
        if (direction === -1 && pos <= -setWidth) pos = 0;
        if (direction === 1 && pos >= 0) pos = -setWidth;
        el.style.transform = `translateX(${pos}px)`;
        this.marqueeAnimIds.push(requestAnimationFrame(animate));
      };
      this.marqueeAnimIds.push(requestAnimationFrame(animate));
    });
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

  private readonly STATUS_MAP: Record<string, { status: string; text: string }> = {
    PREPARING: { status: 'preparing', text: '준비중' },
    RECRUITING: { status: 'recruiting', text: '모집중' },
    OPERATING: { status: 'operating', text: '운영중' },
    CLOSED: { status: 'closed', text: '마감' },
    ENDED: { status: 'ended', text: '종료' },
  };

  private async loadBootcamps(): Promise<void> {
    try {
      const data = await this.api.bootcamps.findAll();
      this.bootcampCards.set(data.map((b, i) => {
        const mapped = this.STATUS_MAP[b.status] || { status: 'closed', text: b.status };
        return {
          id: b.id,
          name: b.name,
          summary: b.description || '',
          status: mapped.status,
          statusText: mapped.text,
          deadline: null,
          thumbnailGradient: this.gradients[i % this.gradients.length],
          thumbnailUrl: b.thumbnail || null,
        };
      }));
    } catch (e) {
      console.error('부트캠프 로드 실패:', e);
    }
  }
  bootcampCards = signal<BootcampCard[]>([]);

  private readonly placeholderGradients = [
    'linear-gradient(135deg, #667eea, #764ba2)',
    'linear-gradient(135deg, #f093fb, #f5576c)',
    'linear-gradient(135deg, #4facfe, #00f2fe)',
    'linear-gradient(135deg, #43e97b, #38f9d7)',
    'linear-gradient(135deg, #fa709a, #fee140)',
    'linear-gradient(135deg, #a18cd1, #fbc2eb)',
  ];

  /** 항상 6개 카드 반환 — 부족하면 빈 placeholder 카드로 채움 */
  displayCards = computed<BootcampCard[]>(() => {
    const real = this.bootcampCards();
    if (real.length >= 6) return real.slice(0, 6);
    const padded = [...real];
    for (let i = real.length; i < 6; i++) {
      padded.push({
        id: -(i + 1),
        name: '',
        summary: '',
        status: 'closed',
        statusText: '',
        deadline: null,
        thumbnailGradient: this.placeholderGradients[i % this.placeholderGradients.length],
        thumbnailUrl: null,
      });
    }
    return padded;
  });

  // ===== 카드 드래그 스크롤 (모멘텀 관성 적용) =====
  @ViewChild('cardsRow') cardsRowRef!: ElementRef<HTMLDivElement>;
  private isCardsDragging = false;
  private hasDragged = false;
  private cardsDragStartX = 0;
  private cardsDragStartPageX = 0;
  private cardsScrollLeft = 0;
  private cardsDragVelocity = 0;
  private cardsDragLastX = 0;
  private cardsDragLastTime = 0;
  private cardsMomentumId = 0;
  private static readonly DRAG_THRESHOLD = 4; // px — 이 이상 이동해야 드래그로 인식

  onCardsMouseDown(event: MouseEvent): void {
    const el = this.cardsRowRef?.nativeElement;
    if (!el) return;
    event.preventDefault();
    cancelAnimationFrame(this.cardsMomentumId);
    this.isCardsDragging = true;
    this.hasDragged = false;
    this.cardsDragStartX = event.pageX - el.offsetLeft;
    this.cardsDragStartPageX = event.pageX;
    this.cardsScrollLeft = el.scrollLeft;
    this.cardsDragVelocity = 0;
    this.cardsDragLastX = event.pageX;
    this.cardsDragLastTime = Date.now();
    el.classList.add('dragging');
    el.style.scrollSnapType = 'none';
    document.addEventListener('mousemove', this.boundCardsMouseMove);
    document.addEventListener('mouseup', this.boundCardsMouseUp);
  }

  onCardsMouseUp(): void {
    if (!this.isCardsDragging) return;
    this.isCardsDragging = false;
    const el = this.cardsRowRef?.nativeElement;
    if (el) {
      el.classList.remove('dragging');
      // 모멘텀 관성 스크롤
      this.applyMomentum();
    }
    document.removeEventListener('mousemove', this.boundCardsMouseMove);
    document.removeEventListener('mouseup', this.boundCardsMouseUp);
  }

  onCardClick(event: MouseEvent): void {
    if (this.hasDragged) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
  }

  private boundCardsMouseMove = (e: MouseEvent): void => {
    if (!this.isCardsDragging) return;
    e.preventDefault();

    // 최소 이동 거리 체크 — 임계값 이상 이동해야 드래그로 인식
    const totalMoved = Math.abs(e.pageX - this.cardsDragStartPageX);
    if (totalMoved > BootcampIntroPage.DRAG_THRESHOLD) {
      this.hasDragged = true;
    }

    const el = this.cardsRowRef.nativeElement;
    const x = e.pageX - el.offsetLeft;
    const walk = (x - this.cardsDragStartX) * 1.2;
    el.scrollLeft = this.cardsScrollLeft - walk;

    // 속도 계산 (모멘텀용)
    const now = Date.now();
    const dt = now - this.cardsDragLastTime;
    if (dt > 0) {
      this.cardsDragVelocity = (this.cardsDragLastX - e.pageX) / dt;
    }
    this.cardsDragLastX = e.pageX;
    this.cardsDragLastTime = now;
  };

  private boundCardsMouseUp = (): void => {
    this.onCardsMouseUp();
  };

  /** 드래그 종료 후 관성으로 부드럽게 슬라이딩 */
  private applyMomentum(): void {
    const el = this.cardsRowRef?.nativeElement;
    if (!el) return;

    let velocity = this.cardsDragVelocity * 800; // 초기 모멘텀 (px)
    const friction = 0.95; // 감속 비율

    const step = () => {
      if (Math.abs(velocity) < 0.5) {
        el.style.scrollSnapType = 'x mandatory';
        return;
      }
      el.scrollLeft += velocity;
      velocity *= friction;
      this.cardsMomentumId = requestAnimationFrame(step);
    };
    this.cardsMomentumId = requestAnimationFrame(step);
  }

  // History 쇼케이스 캐러셀
  showcaseImages: string[] = [
    '/images/history-showcase.png',
  ];
  showcaseIndex = 0;

  private async loadPosters(): Promise<void> {
    try {
      const data = await this.api.posters.findAll();
      if (data.length > 0) {
        this.showcaseImages = data.map((p) => p.imageUrl || '').filter(Boolean);
        this.showcaseIndex = 0;
      }
    } catch (e) {
      console.error('포스터 로드 실패:', e);
    }
  }

  historyGroups = signal<HistoryGroup[]>([]);

  private async loadHistories(): Promise<void> {
    try {
      const data = await this.api.histories.findAll();
      if (data.length > 0) {
        this.historyGroups.set(data);
      }
    } catch (e) {
      console.error('히스토리 로드 실패:', e);
    }
  }

  // ===== 파트너 로고 =====
  private allPartners = signal<PartnerResponse[]>([]);

  partnerLogosRow1 = computed(() => this.allPartners());
  partnerLogosRow2 = computed(() => this.allPartners());

  private async loadPartners(): Promise<void> {
    try {
      const data = await this.api.partners.findAll();
      if (data.length > 0) {
        this.allPartners.set(data);
      }
    } catch (e) {
      console.error('파트너 로드 실패:', e);
    }
  }

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
    this.marqueeAnimIds.forEach(id => cancelAnimationFrame(id));
    document.removeEventListener('mousemove', this.boundMouseMove);
    document.removeEventListener('mouseup', this.boundMouseUp);
    document.removeEventListener('mousemove', this.boundCardsMouseMove);
    document.removeEventListener('mouseup', this.boundCardsMouseUp);
  }
}
