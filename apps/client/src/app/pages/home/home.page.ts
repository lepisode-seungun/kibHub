import { Component, ElementRef, ViewChild, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HomeBannerComponent } from '../../components/home-banner/home-banner.component';
import { SearchService } from '../../services/search.service';

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
export class HomePage {
  @ViewChild('track') track!: ElementRef<HTMLDivElement>;
  @ViewChild('mentorTrack') mentorTrack!: ElementRef<HTMLDivElement>;
  @ViewChild('bootcampTrack') bootcampTrack!: ElementRef<HTMLDivElement>;

  private searchService = inject(SearchService);
  searchQuery = this.searchService.searchQuery;

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
    this.track.nativeElement.scrollBy({ left: -580, behavior: 'smooth' });
  }

  scrollRight(): void {
    this.track.nativeElement.scrollBy({ left: 580, behavior: 'smooth' });
  }

  /* ===== Bootcamp ===== */
  bootcampCards: BootcampCard[] = [
    {
      id: 1, title: '케나즈 아카데미 초급반',
      description: '웹툰의 입문자, 초보자를 위한 커리큘럼',
      thumbnailGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      status: '모집중', deadline: '01.15 모집 마감',
    },
    {
      id: 2, title: '케나즈 아카데미 중급반',
      description: '실전 웹툰 제작을 위한 심화 과정',
      thumbnailGradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      status: '모집중', deadline: '02.28 모집 마감',
    },
    {
      id: 3, title: '케나즈 아카데미 고급반',
      description: '글로벌 진출을 위한 프로 과정',
      thumbnailGradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      status: '모집 마감', deadline: '12.31 마감',
    },
  ];

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

  contentCards: ContentCard[] = [
    { id: 1, userName: 'newon', title: '콘텐츠 제목 30자 이내 콘텐츠 제목 콘텐츠 제목 콘텐', thumbnailGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', rank: 1, featured: false },
    { id: 2, userName: 'newon', title: '콘텐츠 제목 30자 이내 콘텐츠 제목 콘텐츠 제목 콘텐', thumbnailGradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', rank: 1, featured: false },
    { id: 3, userName: 'newon', title: '콘텐츠 제목 30자 이내 콘텐츠 제목 콘텐츠 제목 콘텐', thumbnailGradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', rank: 1, featured: true,
      comment: '현재 부분 시간에 따른 그림자 표현이 적절하게 되어야할 것 같아요. 지금은 전혀 반영되지 않아 이미지가 너무 어색해 보입니다.',
      commenter: 'yomi13', commentTime: '2분 전' },
    { id: 4, userName: 'newon', title: '콘텐츠 제목 30자 이내 콘텐츠 제목 콘텐츠 제목 콘텐', thumbnailGradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', rank: 1, featured: false },
    { id: 5, userName: 'newon', title: '콘텐츠 제목 30자 이내 콘텐츠 제목 콘텐츠 제목 콘텐', thumbnailGradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', rank: null, featured: false },
    { id: 6, userName: 'newon', title: '콘텐츠 제목 30자 이내 콘텐츠 제목 콘텐츠 제목 콘텐', thumbnailGradient: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)', rank: 1, featured: false },
    { id: 7, userName: 'newon', title: '콘텐츠 제목 30자 이내 콘텐츠 제목 콘텐츠 제목 콘텐', thumbnailGradient: 'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)', rank: 1, featured: false },
    { id: 8, userName: 'newon', title: '콘텐츠 제목 30자 이내 콘텐츠 제목 콘텐츠 제목 콘텐', thumbnailGradient: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)', rank: 1, featured: false },
    { id: 9, userName: 'newon', title: '콘텐츠 제목 30자 이내 콘텐츠 제목 콘텐츠 제목 콘텐', thumbnailGradient: 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)', rank: 1, featured: false },
    { id: 10, userName: 'newon', title: '콘텐츠 제목 30자 이내 콘텐츠 제목 콘텐츠 제목 콘텐', thumbnailGradient: 'linear-gradient(135deg, #fddb92 0%, #d1fdff 100%)', rank: 1, featured: false },
    { id: 11, userName: 'newon', title: '콘텐츠 제목 30자 이내 콘텐츠 제목 콘텐츠 제목 콘텐', thumbnailGradient: 'linear-gradient(135deg, #f5576c 0%, #ff6a88 100%)', rank: 1, featured: false },
    { id: 12, userName: 'newon', title: '콘텐츠 제목 30자 이내 콘텐츠 제목 콘텐츠 제목 콘텐', thumbnailGradient: 'linear-gradient(135deg, #667eea 0%, #00c6fb 100%)', rank: 1, featured: false },
  ];

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
    this.mentorTrack.nativeElement.scrollBy({ left: 432, behavior: 'smooth' });
  }

  /* ===== More Content ===== */
  moreContentCards: ContentCard[] = [
    { id: 101, userName: 'newon', title: '콘텐츠 제목 30자 이내 콘텐츠 제목 콘텐츠 제목 콘텐', thumbnailGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', rank: 1, featured: false },
    { id: 102, userName: 'newon', title: '콘텐츠 제목 30자 이내 콘텐츠 제목 콘텐츠 제목 콘텐', thumbnailGradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', rank: 1, featured: false },
    { id: 103, userName: 'newon', title: '콘텐츠 제목 30자 이내 콘텐츠 제목 콘텐츠 제목 콘텐', thumbnailGradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', rank: 1, featured: true,
      comment: '현재 부분 시간에 따른 그림자 표현이 적절하게 되어야할 것 같아요. 지금은 전혀 반영되지 않아 이미지가 너무 어색해 보입니다.',
      commenter: 'yomi13', commentTime: '2분 전' },
    { id: 104, userName: 'newon', title: '콘텐츠 제목 30자 이내 콘텐츠 제목 콘텐츠 제목 콘텐', thumbnailGradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', rank: 1, featured: false },
    { id: 105, userName: 'newon', title: '콘텐츠 제목 30자 이내 콘텐츠 제목 콘텐츠 제목 콘텐', thumbnailGradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', rank: null, featured: false },
    { id: 106, userName: 'newon', title: '콘텐츠 제목 30자 이내 콘텐츠 제목 콘텐츠 제목 콘텐', thumbnailGradient: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)', rank: 1, featured: false },
    { id: 107, userName: 'newon', title: '콘텐츠 제목 30자 이내 콘텐츠 제목 콘텐츠 제목 콘텐', thumbnailGradient: 'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)', rank: 1, featured: false },
    { id: 108, userName: 'newon', title: '콘텐츠 제목 30자 이내 콘텐츠 제목 콘텐츠 제목 콘텐', thumbnailGradient: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)', rank: 1, featured: false },
    { id: 109, userName: 'newon', title: '콘텐츠 제목 30자 이내 콘텐츠 제목 콘텐츠 제목 콘텐', thumbnailGradient: 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)', rank: 1, featured: false },
    { id: 110, userName: 'newon', title: '콘텐츠 제목 30자 이내 콘텐츠 제목 콘텐츠 제목 콘텐', thumbnailGradient: 'linear-gradient(135deg, #fddb92 0%, #d1fdff 100%)', rank: 1, featured: false },
    { id: 111, userName: 'newon', title: '콘텐츠 제목 30자 이내 콘텐츠 제목 콘텐츠 제목 콘텐', thumbnailGradient: 'linear-gradient(135deg, #f5576c 0%, #ff6a88 100%)', rank: 1, featured: false },
    { id: 112, userName: 'newon', title: '콘텐츠 제목 30자 이내 콘텐츠 제목 콘텐츠 제목 콘텐', thumbnailGradient: 'linear-gradient(135deg, #667eea 0%, #00c6fb 100%)', rank: 1, featured: false },
  ];
}
