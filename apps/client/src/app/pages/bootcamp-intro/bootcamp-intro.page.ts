import { Component, ViewChild, ElementRef, OnDestroy } from '@angular/core';
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
      name: '케나즈 초급반 13기',
      summary: '기초부터 탄탄하게',
      status: 'recruiting',
      statusText: '모집중',
      deadline: '01.15 모집 마감',
      thumbnailGradient: 'linear-gradient(135deg, #5a3a8c, #2a1a50)',
    },
    {
      id: 2,
      name: '케나즈 중급반 8기',
      summary: '실전 웹툰 제작',
      status: 'recruiting',
      statusText: '모집중',
      deadline: '01.15 모집 마감',
      thumbnailGradient: 'linear-gradient(135deg, #667eea, #764ba2)',
    },
    {
      id: 3,
      name: '캐릭터 디자인 5기',
      summary: '매력적인 캐릭터 만들기',
      status: 'closed',
      statusText: '모집마감',
      deadline: null,
      thumbnailGradient: 'linear-gradient(135deg, #f093fb, #f5576c)',
    },
    {
      id: 4,
      name: '스토리텔링 마스터',
      summary: '이야기의 힘을 배우다',
      status: 'recruiting',
      statusText: '모집중',
      deadline: '01.15 모집 마감',
      thumbnailGradient: 'linear-gradient(135deg, #4facfe, #00f2fe)',
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
  }
}
