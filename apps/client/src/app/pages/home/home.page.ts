import { Component, ElementRef, ViewChild, signal, inject, computed, AfterViewInit, NgZone, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HomeBannerComponent } from '../../components/home-banner/home-banner.component';
import { SearchService } from '../../services/search.service';
import { ApiService } from '../../services/api.service';
import { Bootcamp, Content } from '@kibhub/shared';

interface CommentCard {
  id: number;
  userName: string;
  commentLikes: string;
  comment: string;
  postTitle: string;
  thumbnailGradient: string;
}

interface CategoryTab {
  id: string;
  label: string;
  iconBg: string;
}

interface ContentCard {
  id: number;
  userName: string;
  title: string;
  thumbnailGradient: string;
  rank: number | null;
  featured: boolean;
  comment?: string;
  commenter?: string;
  commentTime?: string;
}

interface MentorCard {
  id: number;
  userName: string;
  comment: string;
  contentTitle: string;
  likes: string;
}

interface BootcampCard {
  id: number;
  title: string;
  description: string;
  thumbnailGradient: string;
  status: string;
  deadline: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, HomeBannerComponent, RouterModule],
  templateUrl: './home.page.html',
  styleUrl: './home.page.css',
})
export class HomePage implements AfterViewInit, OnInit {
  @ViewChild('track') track!: ElementRef<HTMLDivElement>;
  @ViewChild('mentorTrack') mentorTrack!: ElementRef<HTMLDivElement>;
  @ViewChild('bootcampTrack') bootcampTrack!: ElementRef<HTMLDivElement>;

  private ngZone = inject(NgZone);
  private api = inject(ApiService);

  isLoading = signal(true);

  /* ===== Carousel arrow / fade visibility ===== */
  showCommentLeftArrow = signal(false);
  showMentorLeftArrow = signal(false);
  showCommentRightFade = signal(true);
  showMentorRightFade = signal(true);

  ngAfterViewInit(): void {
    this.ngZone.runOutsideAngular(() => {
      this.track?.nativeElement.addEventListener('scroll', () => {
        const el = this.track.nativeElement;
        const scrolled = el.scrollLeft > 1;
        const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 50;
        this.ngZone.run(() => {
          this.showCommentLeftArrow.set(scrolled);
          this.showCommentRightFade.set(!atEnd);
        });
      });
      this.mentorTrack?.nativeElement.addEventListener('scroll', () => {
        const el = this.mentorTrack.nativeElement;
        const scrolled = el.scrollLeft > 1;
        const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 50;
        this.ngZone.run(() => {
          this.showMentorLeftArrow.set(scrolled);
          this.showMentorRightFade.set(!atEnd);
        });
      });
    });
  }

  private searchService = inject(SearchService);
  searchQuery = this.searchService.searchQuery;

  private readonly gradients = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  ];

  ngOnInit(): void {
    Promise.all([this.loadBootcamps(), this.loadContents()]).finally(() => {
      this.isLoading.set(false);
    });
  }

  private async loadBootcamps(): Promise<void> {
    try {
      const bootcamps = await this.api.bootcamps.findAll();
      this.bootcampCards = bootcamps.map((b, i) => ({
        id: b.id,
        title: b.name,
        description: b.description || '',
        thumbnailGradient: this.gradients[i % this.gradients.length],
        status: b.status === 'RECRUITING' ? '모집중' : '모집 마감',
        deadline: '',
      }));
    } catch (e) {
      console.error('부트캠프 로드 실패:', e);
    }
  }

  private async loadContents(): Promise<void> {
    try {
      const contents = await this.api.contents.findAll();
      this.contentCards = contents.slice(0, 12).map((c, i) => ({
        id: c.id,
        userName: c.author?.nickname || c.author?.name || 'user',
        title: c.title,
        thumbnailGradient: this.gradients[i % this.gradients.length],
        rank: i < 4 ? i + 1 : null,
        featured: i === 2,
      }));
    } catch (e) {
      console.error('콘텐츠 로드 실패:', e);
    }
  }

  /* ===== Recent Comments ===== */
  commentCards: CommentCard[] = [
    {
      id: 1, userName: 'Newon', commentLikes: '1,320',
      comment: '현재 부분 시간에 따른 그림자 표현이 적절하게 되어야할 것 같아요. 지금은 전혀 반영되지 않아 이미지가 너무 어색해 보입니다.',
      postTitle: '포스트 제목이 들어갑니다.',
      thumbnailGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    },
    {
      id: 2, userName: 'Newon', commentLikes: '1,320',
      comment: '현재 부분 시간에 따른 그림자 표현이 적절하게 되어야할 것 같아요. 지금은 전혀 반영되지 않아 이미지가 너무 어색해 보입니다.',
      postTitle: '포스트 제목이 들어갑니다.',
      thumbnailGradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    },
    {
      id: 3, userName: 'Newon', commentLikes: '1,320',
      comment: '현재 부분 시간에 따른 그림자 표현이 적절하게 되어야할 것 같아요. 지금은 전혀 반영되지 않아 이미지가 너무 어색해 보입니다.',
      postTitle: '포스트 제목이 들어갑니다.',
      thumbnailGradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    },
    {
      id: 4, userName: 'Newon', commentLikes: '1,320',
      comment: '현재 부분 시간에 따른 그림자 표현이 적절하게 되어야할 것 같아요. 지금은 전혀 반영되지 않아 이미지가 너무 어색해 보입니다.',
      postTitle: '포스트 제목이 들어갑니다.',
      thumbnailGradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    },
  ];

  scrollLeft(): void {
    const el = this.track.nativeElement;
    if (el.scrollLeft <= 580) {
      this.showCommentLeftArrow.set(false);
    }
    el.scrollBy({ left: -580, behavior: 'smooth' });
  }

  scrollRight(): void {
    const el = this.track.nativeElement;
    const maxScroll = el.scrollWidth - el.clientWidth;
    const remaining = maxScroll - el.scrollLeft;
    if (remaining <= 0) return;
    this.showCommentLeftArrow.set(true);
    el.scrollBy({ left: Math.min(580, remaining), behavior: 'smooth' });
  }

  /* ===== Bootcamp ===== */
  bootcampCards: BootcampCard[] = [];

  scrollBootcampRight(): void {
    this.bootcampTrack.nativeElement.scrollBy({ left: 280, behavior: 'smooth' });
  }

  scrollBootcampLeft(): void {
    this.bootcampTrack.nativeElement.scrollBy({ left: -280, behavior: 'smooth' });
  }

  /* ===== Content Gallery ===== */
  activeCategory = signal('all');

  categories: CategoryTab[] = [
    { id: 'all', label: '전체보기', iconBg: 'linear-gradient(58.84deg, #32A3E6 19.75%, #C29DB5 76.92%)' },
    { id: 'webtoon', label: '웹툰', iconBg: '#38C4D1' },
    { id: 'art', label: '그림', iconBg: '#D37FC8' },
    { id: 'writing', label: '글', iconBg: '#7B7EDF' },
  ];

  subCategories = [
    { id: 'sub1', label: 'Category', count: 1 },
    { id: 'sub2', label: 'Category', count: 2 },
    { id: 'sub3', label: 'Category', count: 3 },
    { id: 'sub4', label: 'Category', count: 4 },
    { id: 'sub5', label: 'Category', count: 5 },
    { id: 'sub6', label: 'Category', count: 6 },
    { id: 'sub7', label: 'Category', count: 7 },
  ];

  searchPlaceholder = '질문, 유저명, 댓글까지 자유롭게 검색해보세요.';

  contentCards: ContentCard[] = [];

  selectCategory(id: string): void {
    this.activeCategory.set(id);
  }

  /** 검색어 기반 필터링 */
  filteredContentCards = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.contentCards;
    return this.contentCards.filter(c =>
      c.title.toLowerCase().includes(q) ||
      c.userName.toLowerCase().includes(q) ||
      (c.comment && c.comment.toLowerCase().includes(q))
    );
  });

  filteredMoreContentCards = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.moreContentCards;
    return this.moreContentCards.filter(c =>
      c.title.toLowerCase().includes(q) ||
      c.userName.toLowerCase().includes(q) ||
      (c.comment && c.comment.toLowerCase().includes(q))
    );
  });

  /* ===== Best Mentor ===== */
  mentorCards: MentorCard[] = [
    { id: 1, userName: 'NEWON', comment: '현재 부분 시간에 따른 그림자 표현이 적절하게 되어야할 것 같아요. 지금은 전혀 반영되지 않아 이미지가 너무 어색해 보입니다. 최대4줄까지 표시됩니다.', contentTitle: '콘텐츠 제목 30자 이내 콘텐츠 제목 콘텐', likes: '2,132' },
    { id: 2, userName: 'NEWON', comment: '현재 부분 시간에 따른 그림자 표현이 적절하게 되어야할 것 같아요. 지금은 전혀 반영되지 않아 이미지가 너무 어색해 보입니다. 최대4줄까지 표시됩니다.', contentTitle: '콘텐츠 제목 30자 이내 콘텐츠 제목 콘텐', likes: '2,132' },
    { id: 3, userName: 'NEWON', comment: '현재 부분 시간에 따른 그림자 표현이 적절하게 되어야할 것 같아요. 지금은 전혀 반영되지 않아 이미지가 너무 어색해 보입니다. 최대4줄까지 표시됩니다.', contentTitle: '콘텐츠 제목 30자 이내 콘텐츠 제목 콘텐', likes: '2,132' },
    { id: 4, userName: 'NEWON', comment: '현재 부분 시간에 따른 그림자 표현이 적절하게 되어야할 것 같아요. 지금은 전혀 반영되지 않아 이미지가 너무 어색해 보입니다. 최대4줄까지 표시됩니다.', contentTitle: '콘텐츠 제목 30자 이내 콘텐츠 제목 콘텐', likes: '2,132' },
    { id: 5, userName: 'NEWON', comment: '현재 부분 시간에 따른 그림자 표현이 적절하게 되어야할 것 같아요. 지금은 전혀 반영되지 않아 이미지가 너무 어색해 보입니다. 최대4줄까지 표시됩니다.', contentTitle: '콘텐츠 제목 30자 이내 콘텐츠 제목 콘텐', likes: '2,132' },
  ];

  scrollMentorRight(): void {
    const el = this.mentorTrack.nativeElement;
    const maxScroll = el.scrollWidth - el.clientWidth;
    const remaining = maxScroll - el.scrollLeft;
    if (remaining <= 0) return;
    this.showMentorLeftArrow.set(true);
    el.scrollBy({ left: Math.min(432, remaining), behavior: 'smooth' });
  }

  scrollMentorLeft(): void {
    const el = this.mentorTrack.nativeElement;
    if (el.scrollLeft <= 432) {
      this.showMentorLeftArrow.set(false);
    }
    el.scrollBy({ left: -432, behavior: 'smooth' });
  }

  /* ===== More Content ===== */
  moreContentCards: ContentCard[] = [];
}
