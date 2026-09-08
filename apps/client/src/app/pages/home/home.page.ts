import { Component, ElementRef, ViewChild, signal, inject, computed, AfterViewInit, NgZone, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HomeBannerComponent } from '../../components/home-banner/home-banner.component';
import { ApiService } from '../../services/api.service';
import { Bootcamp, Content, ContentCategory } from '@kibhub/shared';

interface CommentCard {
  id: number;
  userName: string;
  profileImage?: string;
  initial?: string;
  commentLikes: string;
  comment: string;
  postTitle: string;
  thumbnailGradient: string;
  thumbnailUrl?: string;
  contentId?: number;
}

interface CategoryTab {
  id: string;
  label: string;
  iconBg: string;
}

interface ContentCard {
  id: number;
  userName: string;
  profileImage?: string;
  initial?: string;
  title: string;
  type: string;
  categoryName: string;
  thumbnailUrl?: string;
  thumbnailGradient: string;
  rank: number | null;
  featured: boolean;
  feedbackCount: number;
  comment?: string;
  commenter?: string;
  commentTime?: string;
}

interface MentorCard {
  id: number;
  userName: string;
  profileImage?: string;
  initial?: string;
  comment: string;
  contentTitle: string;
  contentId: number;
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
      // 초기 overflow 체크
      setTimeout(() => {
        if (this.track?.nativeElement) {
          const el = this.track.nativeElement;
          const hasOverflow = el.scrollWidth > el.clientWidth + 1;
          this.ngZone.run(() => this.showCommentRightFade.set(hasOverflow));
        }
        if (this.mentorTrack?.nativeElement) {
          const el = this.mentorTrack.nativeElement;
          const hasOverflow = el.scrollWidth > el.clientWidth + 1;
          this.ngZone.run(() => this.showMentorRightFade.set(hasOverflow));
        }
      });

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

  searchQuery = signal('');

  private readonly gradients = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  ];

  ngOnInit(): void {
    Promise.all([this.loadBootcamps(), this.loadContents(), this.loadSubCategories(), this.loadRecentComments(), this.loadBestMentors()]).finally(() => {
      this.isLoading.set(false);
      // 데이터 로드 후 carousel overflow 재체크
      setTimeout(() => this.recheckCarouselOverflow());
    });
  }

  private recheckCarouselOverflow(): void {
    if (this.track?.nativeElement) {
      const el = this.track.nativeElement;
      this.showCommentRightFade.set(el.scrollWidth > el.clientWidth + 1);
    }
    if (this.mentorTrack?.nativeElement) {
      const el = this.mentorTrack.nativeElement;
      this.showMentorRightFade.set(el.scrollWidth > el.clientWidth + 1);
    }
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
      const mapCard = (c: Content, i: number): ContentCard => ({
        id: c.id,
        userName: c.author?.nickname || c.author?.name || 'user',
        profileImage: (c.author as any)?.profileImage || '',
        initial: (c.author as any)?.initial || '',
        title: c.title,
        type: c.type,
        categoryName: c.category?.name || '',
        thumbnailUrl: c.thumbnail || undefined,
        thumbnailGradient: this.gradients[i % this.gradients.length],
        rank: null,
        featured: false,
        feedbackCount: (c as any).feedbackCount || 0,
        comment: (c as any).topComment?.body || '',
        commenter: (c as any).topComment?.author?.nickname || (c as any).topComment?.author?.name || '',
        commentTime: (c as any).topComment?.createdAt ? this.getRelativeTime((c as any).topComment.createdAt) : '',
      });
      // 첫 12개는 갤러리
      this.contentCards.set(contents.slice(0, 12).map((c, i) => ({
        ...mapCard(c, i),
        rank: i < 4 ? i + 1 : null,
        featured: i === 2,
      })));
      // 나머지는 More Content
      this.moreContentCards.set(contents.slice(12).map((c, i) => mapCard(c, i + 12)));
    } catch (e) {
      console.error('콘텐츠 로드 실패:', e);
    }
  }

  private async loadRecentComments(): Promise<void> {
    try {
      const comments = await this.api.comments.findRecent(10);
      this.commentCards.set(comments.map((c: any, i: number) => ({
        id: c.id,
        contentId: c.content?.id || c.contentId,
        userName: c.author?.nickname || c.author?.name || '익명',
        profileImage: c.author?.profileImage || '',
        initial: (c as any).author?.initial || '',
        commentLikes: String(c.likeCount || 0),
        comment: c.body,
        postTitle: c.content?.title || '',
        thumbnailUrl: c.content?.thumbnail || undefined,
        thumbnailGradient: this.gradients[i % this.gradients.length],
      })));
    } catch (e) {
      console.error('최근 댓글 로드 실패:', e);
    }
  }

  private async loadSubCategories(): Promise<void> {
    try {
      const cats = await this.api.contentCategories.findAll();
      this.subCategories.set(cats.map(c => ({ id: String(c.id), label: c.name, count: 0 })));
    } catch (e) {
      console.error('카테고리 로드 실패:', e);
    }
  }



  /* ===== Recent Comments ===== */
  commentCards = signal<CommentCard[]>([]);

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

  subCategories = signal<{ id: string; label: string; count: number }[]>([]);
  activeSubCategory = signal('');

  searchPlaceholder = '질문, 유저명, 댓글까지 자유롭게 검색해보세요.';

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
  }

  clearSearch(): void {
    this.searchQuery.set('');
  }

  contentCards = signal<ContentCard[]>([]);

  selectCategory(id: string): void {
    this.activeCategory.set(this.activeCategory() === id ? 'all' : id);
    this.activeSubCategory.set('');
  }

  selectSubCategory(id: string): void {
    if (!id) {
      this.activeSubCategory.set('');
    } else {
      this.activeSubCategory.set(this.activeSubCategory() === id ? '' : id);
    }
  }

  private typeMap: Record<string, string> = {
    'webtoon': 'WEBTOON',
    'art': 'ILLUSTRATION',
    'writing': 'WRITING',
  };

  private filterCards(cards: ContentCard[]): ContentCard[] {
    let result = cards;
    const cat = this.activeCategory();
    if (cat !== 'all') {
      const type = this.typeMap[cat];
      if (type) result = result.filter(c => c.type === type);
    }
    const sub = this.activeSubCategory();
    if (sub) {
      const subCat = this.subCategories().find(s => s.id === sub);
      if (subCat) result = result.filter(c => c.categoryName === subCat.label);
    }
    const q = this.searchQuery().toLowerCase().trim();
    if (q) {
      result = result.filter(c =>
        c.title.toLowerCase().includes(q) ||
        c.userName.toLowerCase().includes(q) ||
        (c.comment && c.comment.toLowerCase().includes(q))
      );
    }
    return result;
  }

  filteredContentCards = computed(() => this.filterCards(this.contentCards()));

  filteredMoreContentCards = computed(() => this.filterCards(this.moreContentCards()));

  /* ===== Best Mentor ===== */
  mentorCards = signal<MentorCard[]>([]);

  private async loadBestMentors(): Promise<void> {
    try {
      const comments = await this.api.comments.findBest(10);
      this.mentorCards.set(comments.map((c: any) => ({
        id: c.id,
        userName: c.author?.nickname || c.author?.name || '익명',
        profileImage: c.author?.profileImage || undefined,
        initial: c.author?.initial || '',
        comment: c.body,
        contentTitle: c.content?.title || '',
        contentId: c.content?.id || 0,
        likes: String(c.likeCount || 0),
      })));
    } catch (e) {
      console.error('베스트 멘토 로드 실패:', e);
    }
  }

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
  moreContentCards = signal<ContentCard[]>([]);

  /* ===== Helpers ===== */
  private getRelativeTime(dateStr: string): string {
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diff = Math.max(0, now - then);
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}시간 전`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}일 전`;
    const months = Math.floor(days / 30);
    return `${months}개월 전`;
  }
}
