import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';

interface BannerSlide {
  id: number;
  title: string;
  subtitle: string;
  textColor: string;
  link: string | null;
  pcImage: string | null;
  mobileImage: string | null;
}

@Component({
  selector: 'app-home-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home-banner.component.html',
  styleUrl: './home-banner.component.css',
})
export class HomeBannerComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private autoSlideTimer: ReturnType<typeof setInterval> | null = null;

  slides = signal<BannerSlide[]>([]);
  currentSlide = signal(0);
  isLoading = signal(true);

  ngOnInit(): void {
    this.loadBanners();
  }

  ngOnDestroy(): void {
    this.stopAutoSlide();
  }

  private async loadBanners(): Promise<void> {
    try {
      const banners = await this.api.banners.findVisible();
      this.slides.set(
        banners.map((b) => ({
          id: b.id,
          title: b.header,
          subtitle: b.content,
          textColor: b.textColor || '#FFFFFF',
          link: b.link || null,
          pcImage: b.pcImage || null,
          mobileImage: b.mobileImage || null,
        }))
      );
    } catch (e) {
      console.error('배너 로드 실패:', e);
      this.slides.set([]);
    } finally {
      this.isLoading.set(false);
      this.startAutoSlide();
    }
  }

  get totalSlides(): number {
    return this.slides().length;
  }

  get activeSlide(): BannerSlide {
    return this.slides()[this.currentSlide()] || { id: 0, title: '', subtitle: '', textColor: '#FFFFFF', link: null, pcImage: null, mobileImage: null };
  }

  onBannerClick(): void {
    const link = this.activeSlide.link;
    if (link) {
      window.open(link, '_blank', 'noopener,noreferrer');
    }
  }

  /** 현재 슬라이드에 이미지가 있는지 */
  get hasImage(): boolean {
    return !!this.activeSlide.pcImage;
  }

  get progressPercent(): number {
    if (this.totalSlides === 0) return 0;
    return ((this.currentSlide() + 1) / this.totalSlides) * 100;
  }

  prevSlide(): void {
    this.currentSlide.update((i) =>
      i === 0 ? this.totalSlides - 1 : i - 1
    );
  }

  nextSlide(): void {
    this.currentSlide.update((i) =>
      i === this.totalSlides - 1 ? 0 : i + 1
    );
  }

  private startAutoSlide(): void {
    if (this.totalSlides > 1) {
      this.autoSlideTimer = setInterval(() => this.nextSlide(), 5000);
    }
  }

  private stopAutoSlide(): void {
    if (this.autoSlideTimer) {
      clearInterval(this.autoSlideTimer);
      this.autoSlideTimer = null;
    }
  }
}
