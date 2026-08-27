import { Component, OnInit, signal, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';

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
  private api = inject(ApiService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  bootcampId = '';
  bootcampTitle = '';
  bootcampStatus = '';
  dateRange = '';

  detailTabs = ['학습목록', '강의', '과제', '공지사항'];
  activeDetailTab = signal('학습목록');

  courseSections: CourseSection[] = [];

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

  lectureCards: any[] = [];

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

  assignmentCards: any[] = [];

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
    if (this.bootcampId) {
      this.loadBootcampData(Number(this.bootcampId));
    }
  }

  private async loadBootcampData(bootcampId: number): Promise<void> {
    try {
      const bootcamp: any = await this.api.bootcamps.findOne(bootcampId);
      this.bootcampTitle = bootcamp.title || '';
      this.bootcampStatus = bootcamp.status || '';
      this.dateRange = bootcamp.startDate && bootcamp.endDate
        ? `${bootcamp.startDate} ~ ${bootcamp.endDate}` : '';

      const courses: any[] = await this.api.courses.findByBootcamp(bootcampId);
      this.courseSections = courses.map((c: any, idx: number) => ({
        id: c.id,
        number: `과정${idx + 1}.`,
        title: c.title || '',
        lectureCount: c._count?.lectures || 0,
        assignmentCount: c._count?.assignments || 0,
        isExpanded: idx === 0,
        cards: [],
      }));

      // Load first course cards
      if (this.courseSections.length > 0) {
        await this.loadCourseCards(this.courseSections[0]);
      }
    } catch (err) {
      console.error('부트칠프 데이터 로드 실패:', err);
    }
  }

  private async loadCourseCards(section: CourseSection): Promise<void> {
    if (section.cards.length > 0) return;
    try {
      const [lectures, assignments]: [any[], any[]] = await Promise.all([
        this.api.lectures.findByCourse(section.id),
        this.api.assignments.findByCourse(section.id),
      ]);
      const cards: LectureCard[] = [
        ...lectures.map((l: any) => ({
          id: l.id, type: '강의' as const, category: l.category || '', title: l.title || '',
          duration: l.duration || '', thumbnail: l.thumbnailUrl || '',
        })),
        ...assignments.map((a: any) => ({
          id: a.id, type: '과제' as const, category: '', title: a.title || '',
          dateRange: a.deadlineStart && a.deadlineEnd ? `${a.deadlineStart} ~ ${a.deadlineEnd}` : '', thumbnail: '',
        })),
      ];
      section.cards = cards;
      this.lectureCards = lectures.map((l: any) => ({
        id: l.id, title: l.title || '', category: l.category || '',
        duration: l.duration || '', status: 'progress', hasImage: !!l.thumbnailUrl,
      }));
      this.assignmentCards = assignments.map((a: any) => ({
        id: a.id, title: a.title || '', course: section.title,
        dateRange: a.deadlineStart && a.deadlineEnd ? `${a.deadlineStart} ~ ${a.deadlineEnd}` : '',
        submitted: false, hasImage: false,
      }));
    } catch (err) {
      console.error('과정 데이터 로드 실패:', err);
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
  notices: Notice[] = [];

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
