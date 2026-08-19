import { Component, OnInit, signal, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';

interface LectureCard {
  id: number;
  type: '강의' | '과제';
  category: string;
  title: string;
  duration?: string;
  dateRange?: string;
  thumbnail: string;
}

interface CourseSection {
  id: number;
  number: string;
  title: string;
  lectureCount: number;
  assignmentCount: number;
  isExpanded: boolean;
  cards: LectureCard[];
}

@Component({
  selector: 'app-my-bootcamp-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './my-bootcamp-detail.page.html',
  styleUrls: ['./my-bootcamp-detail.page.css'],
})
export class MyBootcampDetailPage implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  bootcampId = '';
  bootcampTitle = '케나즈 아카데미 초급반 13기';
  bootcampStatus = '수강 중';
  dateRange = '2025년 1월 16일 ~ 2025년 8월 7일';

  detailTabs = ['학습목록', '강의', '과제', '공지사항'];
  activeDetailTab = signal('학습목록');

  courseSections: CourseSection[] = [
    {
      id: 1,
      number: '과정1.',
      title: '웹툰의 기초',
      lectureCount: 4,
      assignmentCount: 1,
      isExpanded: true,
      cards: [
        { id: 1, type: '강의', category: '카테고리', title: '강의명 30자 이내 강의명 30자 이내', duration: '13:27', thumbnail: '' },
        { id: 2, type: '강의', category: '카테고리', title: '강의명 30자 이내 강의명 30자 이내', duration: '13:27', thumbnail: '' },
        { id: 3, type: '강의', category: '카테고리', title: '강의명 30자 이내 강의명 30자 이내', duration: '13:27', thumbnail: '' },
        { id: 4, type: '강의', category: '카테고리', title: '강의명 30자 이내 강의명 30자 이내', duration: '13:27', thumbnail: '' },
        { id: 5, type: '과제', category: '', title: '강의명 30자 이내 강의명 30자 이내', dateRange: '2024년 1월 22일 ~ 2024년 1월 25일', thumbnail: '' },
      ],
    },
    {
      id: 2,
      number: '과정2.',
      title: '웹툰의 기초',
      lectureCount: 4,
      assignmentCount: 1,
      isExpanded: false,
      cards: [],
    },
    {
      id: 3,
      number: '과정3.',
      title: '웹툰의 기초',
      lectureCount: 4,
      assignmentCount: 1,
      isExpanded: false,
      cards: [],
    },
  ];

  /* ===== 강의 탭 ===== */
  lectureFilterChips = ['전체', '진행중', '완료', '미수강 강의', '수강 완료'];
  activeLectureFilter = signal('전체');
  lectureSearchText = '';

  /* 정렬 드롭다운 */
  sortOrder = signal<'오름차순' | '내림차순'>('오름차순');
  isSortDropdownOpen = signal(false);

  toggleSortDropdown(): void {
    this.isSortDropdownOpen.update(v => !v);
  }

  selectSortOrder(order: '오름차순' | '내림차순'): void {
    this.sortOrder.set(order);
    this.isSortDropdownOpen.set(false);
  }

  lectureCards = [
    { id: 1, title: '강의명 30자 이내 강의명 30자 이내', category: '카테고리', duration: '13:27', status: 'progress' as const, hasImage: true },
    { id: 2, title: '강의명 30자 이내 강의명 30자 이내', category: '카테고리', duration: '13:27', status: 'progress' as const, hasImage: true },
    { id: 3, title: '강의명 30자 이내 강의명 30자 이내', category: '카테고리', duration: '13:27', status: 'complete' as const, hasImage: false },
    { id: 4, title: '강의명 30자 이내 강의명 30자 이내', category: '카테고리', duration: '13:27', status: 'progress' as const, hasImage: true },
    { id: 5, title: '강의명 30자 이내 강의명 30자 이내', category: '카테고리', duration: '13:27', status: 'complete' as const, hasImage: false },
    { id: 6, title: '강의명 30자 이내 강의명 30자 이내', category: '카테고리', duration: '13:27', status: 'progress' as const, hasImage: true },
  ];

  get filteredLectures() {
    const filter = this.activeLectureFilter();
    let items = this.lectureCards;
    if (filter === '진행중') {
      items = items.filter(i => i.status === 'progress');
    } else if (filter === '완료') {
      items = items.filter(i => i.status === 'complete');
    } else if (filter === '미수강 강의') {
      items = items.filter(i => i.status === 'progress');
    } else if (filter === '수강 완료') {
      items = items.filter(i => i.status === 'complete');
    }
    if (this.lectureSearchText.trim()) {
      const q = this.lectureSearchText.trim().toLowerCase();
      items = items.filter(i => i.title.toLowerCase().includes(q));
    }
    return items;
  }

  selectLectureFilter(chip: string): void {
    this.activeLectureFilter.set(chip);
  }

  onLectureSearch(event: Event): void {
    this.lectureSearchText = (event.target as HTMLInputElement).value;
  }

  /* ===== 과제 탭 ===== */
  assignmentFilterChips = ['전체', '과정1. 웹툰의 기초', '캐릭터 모작하기.인체학 강좌', '미제출 과제', '제출한 과제'];
  activeAssignmentFilter = signal('전체');
  assignmentSearchText = '';

  assignmentCards = [
    { id: 101, title: '얼굴 그리기', course: '과정1. 웹툰의 기초', dateRange: '2024년 1월 22일 ~ 2024년 1월 25일', submitted: false, hasImage: true },
    { id: 102, title: '얼굴 그리기', course: '과정1. 웹툰의 기초', dateRange: '2024년 1월 22일 ~ 2024년 1월 25일', submitted: true, hasImage: false },
    { id: 103, title: '얼굴 그리기', course: '캐릭터 모작하기.인체학 강좌', dateRange: '2024년 1월 22일 ~ 2024년 1월 25일', submitted: false, hasImage: true },
    { id: 104, title: '얼굴 그리기', course: '캐릭터 모작하기.인체학 강좌', dateRange: '2024년 1월 22일 ~ 2024년 1월 25일', submitted: true, hasImage: false },
    { id: 105, title: '얼굴 그리기', course: '과정1. 웹툰의 기초', dateRange: '2024년 1월 22일 ~ 2024년 1월 25일', submitted: false, hasImage: true },
    { id: 106, title: '얼굴 그리기', course: '과정1. 웹툰의 기초', dateRange: '2024년 1월 22일 ~ 2024년 1월 25일', submitted: true, hasImage: true },
  ];

  get filteredAssignments() {
    const filter = this.activeAssignmentFilter();
    let items = this.assignmentCards;
    if (filter === '미제출 과제') {
      items = items.filter(i => !i.submitted);
    } else if (filter === '제출한 과제') {
      items = items.filter(i => i.submitted);
    } else if (filter !== '전체') {
      items = items.filter(i => i.course === filter);
    }
    if (this.assignmentSearchText.trim()) {
      const q = this.assignmentSearchText.trim().toLowerCase();
      items = items.filter(i => i.title.toLowerCase().includes(q));
    }
    return items;
  }

  selectAssignmentFilter(chip: string): void {
    this.activeAssignmentFilter.set(chip);
  }

  onAssignmentSearch(event: Event): void {
    this.assignmentSearchText = (event.target as HTMLInputElement).value;
  }

  constructor() {
    effect(() => {
      if (this.authService.authChecked() && !this.authService.isLoggedIn()) {
        this.router.navigate(['/login']);
      }
    });
  }

  ngOnInit(): void {
    this.bootcampId = this.route.snapshot.paramMap.get('id') || '';
    const tab = this.route.snapshot.queryParamMap.get('tab');
    if (tab && this.detailTabs.includes(tab)) {
      this.activeDetailTab.set(tab);
    }
  }

  selectDetailTab(tab: string): void {
    this.activeDetailTab.set(tab);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  toggleSection(section: CourseSection): void {
    section.isExpanded = !section.isExpanded;
  }

  navigateToLecture(cardId: number): void {
    this.router.navigate(['/my-bootcamp', this.bootcampId, 'lecture', cardId], {
      queryParams: { tab: this.activeDetailTab() },
    });
  }

  navigateToAssignment(cardId: number): void {
    this.router.navigate(['/my-bootcamp', this.bootcampId, 'assignment', cardId], {
      queryParams: { tab: this.activeDetailTab() },
    });
  }

  goBack(): void {
    this.router.navigate(['/my-bootcamp']);
  }

  /* ===== 공지사항 탭 ===== */
  notices: Notice[] = [
    { id: 1, title: '공지사항 제목입니다.', description: '안녕하세요. 킵퍼브입니다. 공지사항에대한 상세 내용 한줄은 표출됩니다.', date: '2023. 01. 01', isPinned: true },
    { id: 2, title: '공지사항 제목입니다.', description: '안녕하세요. 킵퍼브입니다. 공지사항에대한 상세 내용 한줄은 표출됩니다.', date: '2023. 01. 01', isPinned: false },
    { id: 3, title: '공지사항 제목입니다.', description: '안녕하세요. 킵퍼브입니다. 공지사항에대한 상세 내용 한줄은 표출됩니다.', date: '2023. 01. 01', isPinned: false },
    { id: 4, title: '공지사항 제목입니다.', description: '안녕하세요. 킵퍼브입니다. 공지사항에대한 상세 내용 한줄은 표출됩니다.', date: '2023. 01. 01', isPinned: false },
    { id: 5, title: '공지사항 제목입니다.', description: '안녕하세요. 킵퍼브입니다. 공지사항에대한 상세 내용 한줄은 표출됩니다.', date: '2023. 01. 01', isPinned: false },
    { id: 6, title: '공지사항 제목입니다.', description: '안녕하세요. 킵퍼브입니다. 공지사항에대한 상세 내용 한줄은 표출됩니다.', date: '2023. 01. 01', isPinned: false },
  ];

  currentNoticePage = signal(1);
  totalNoticePages = 5;
  noticeSearchText = '';

  onNoticeSearch(event: Event): void {
    this.noticeSearchText = (event.target as HTMLInputElement).value;
  }

  goToNoticePage(page: number): void {
    this.currentNoticePage.set(page);
  }

  navigateToNotice(noticeId: number): void {
    this.router.navigate(['/my-bootcamp', this.bootcampId, 'notice', noticeId], {
      queryParams: { tab: this.activeDetailTab() },
    });
  }
}

interface Notice {
  id: number;
  title: string;
  description: string;
  date: string;
  isPinned: boolean;
}
