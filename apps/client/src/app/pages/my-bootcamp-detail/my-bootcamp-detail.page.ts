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
  videoUrl?: string;
}

interface LectureTabCard {
  id: number;
  title: string;
  category: string;
  duration: string;
  status: string;
  hasImage: boolean;
  thumbnail: string;
  videoUrl?: string;
}

interface AssignmentTabCard {
  id: number;
  title: string;
  course: string;
  dateRange: string;
  submitted: boolean;
  thumbnail: string;
}

interface BootcampDetail {
  name: string;
  startDate: string | null;
  endDate: string | null;
  status: string;
}

interface CourseResponse {
  id: number;
  name?: string;
  title?: string;
  _count?: { lectures: number; assignments: number };
}

interface LectureResponse {
  id: number;
  title?: string;
  category?: string;
  duration?: string;
  videoUrl?: string;
}

interface AssignmentResponse {
  id: number;
  title?: string;
  dueDate: string | null;
  dueDateEnd: string | null;
  videoUrl?: string;
}

interface NoticeResponse {
  id: number;
  title?: string;
  body?: string;
  createdAt: string;
  pinned?: boolean;
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
  bootcampTitle = signal('');
  bootcampStatus = signal('');
  dateRange = signal('');

  detailTabs = ['학습목록', '강의', '과제', '공지사항'];
  activeDetailTab = signal('학습목록');

  courseSections = signal<CourseSection[]>([]);

  /* ===== 강의 탭 ===== */
  lectureFilterChips = signal<string[]>(['전체']);
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

  lectureCards = signal<LectureTabCard[]>([]);

  get filteredLectures() {
    const filter = this.activeLectureFilter();
    let items = this.lectureCards();
    if (filter !== '전체') {
      items = items.filter(i => i.category === filter);
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
  assignmentFilterChips = signal<string[]>(['전체']);
  activeAssignmentFilter = signal('전체');
  assignmentSearchText = '';

  assignmentCards = signal<AssignmentTabCard[]>([]);

  get filteredAssignments() {
    const filter = this.activeAssignmentFilter();
    let items = this.assignmentCards();
    if (filter !== '전체') {
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

  private readonly STATUS_LABEL: Record<string, string> = {
    PENDING: '신청 완료',
    ACCEPTED: '수강중',
    WAITING: '수강대기',
    COMPLETED: '수료',
    REJECTED: '불합격',
    PREPARING: '준비중',
    RECRUITING: '모집중',
    OPERATING: '수강중',
    CLOSED: '종료',
    ENDED: '종료',
  };

  private async loadBootcampData(bootcampId: number): Promise<void> {
    try {
      const bootcamp: BootcampDetail = await this.api.bootcamps.findOne(bootcampId);
      this.bootcampTitle.set(bootcamp.name || '');

      // 날짜 포맷
      const fmt = (d: string) => d ? d.substring(0, 10) : '';
      this.dateRange.set(bootcamp.startDate && bootcamp.endDate
        ? `${fmt(bootcamp.startDate)} ~ ${fmt(bootcamp.endDate)}` : '');

      // 유저의 지원 상태 가져오기 (강사/관리자는 스킵)
      const user = this.authService.currentUser();
      if (user) {
        if (user.role === 'INSTRUCTOR' || user.role === 'ADMIN') {
          // 마감/종료 상태면 강사도 진입 차단
          if (bootcamp.status === 'CLOSED' || bootcamp.status === 'ENDED') {
            this.router.navigate(['/my-bootcamp']);
            return;
          }
          // 강사/관리자는 부트캠프 상태 직접 표시
          this.bootcampStatus.set(this.STATUS_LABEL[bootcamp.status] || bootcamp.status || '수강중');
        } else {
          try {
            const applicants = await this.api.applicants.findByUser(user.id);
            const myApp = applicants.find((a: { bootcampId: number; status: string }) => a.bootcampId === bootcampId);
            // 수강중(ACCEPTED)이 아닌 상태는 접근 차단
            if (!myApp || myApp.status !== 'ACCEPTED') {
              this.router.navigate(['/my-bootcamp']);
              return;
            }
            // 부트캠프가 마감/종료 상태면 진입 차단
            if (bootcamp.status === 'CLOSED' || bootcamp.status === 'ENDED') {
              this.router.navigate(['/my-bootcamp']);
              return;
            }
            this.bootcampStatus.set(myApp
              ? (this.STATUS_LABEL[myApp.status] || myApp.status)
              : (this.STATUS_LABEL[bootcamp.status] || bootcamp.status));
          } catch {
            this.bootcampStatus.set(this.STATUS_LABEL[bootcamp.status] || bootcamp.status);
          }
        }
      } else {
        this.bootcampStatus.set(this.STATUS_LABEL[bootcamp.status] || bootcamp.status);
      }

      const courses: CourseResponse[] = await this.api.courses.findByBootcamp(bootcampId);
      const sections: CourseSection[] = courses.map((c: CourseResponse, idx: number) => ({
        id: c.id,
        number: `과정${idx + 1}.`,
        title: c.name || c.title || '',
        lectureCount: c._count?.lectures || 0,
        assignmentCount: c._count?.assignments || 0,
        isExpanded: idx === 0,
        cards: [],
      }));
      this.courseSections.set(sections);

      // 모든 과정의 강의/과제 카드 로드
      const allLectures: LectureTabCard[] = [];
      const allAssignments: AssignmentTabCard[] = [];
      for (const section of sections) {
        await this.loadCourseCards(section);
        // 강의/과제 탭 데이터 수집
        const [lectures, assignments]: [LectureResponse[], AssignmentResponse[]] = await Promise.all([
          this.api.lectures.findByCourse(section.id),
          this.api.assignments.findByCourse(section.id),
        ]).catch(() => [[], []]);
        allLectures.push(...lectures.map((l: LectureResponse) => ({
          id: l.id, title: l.title || '', category: l.category || '',
          duration: l.duration || '', status: 'progress', hasImage: !!l.videoUrl,
          thumbnail: this.getYoutubeThumbnail(l.videoUrl || ''),
          videoUrl: l.videoUrl || '',
        })));
        allAssignments.push(...assignments.map((a: AssignmentResponse) => ({
          id: a.id, title: a.title || '', course: section.title,
          dateRange: this.formatDueRange(a.dueDate, a.dueDateEnd),
          submitted: false,
          thumbnail: this.getYoutubeThumbnail(a.videoUrl || ''),
        })));
      }
      this.lectureCards.set(allLectures);
      this.fetchMissingDurations();
      this.assignmentCards.set(allAssignments);
      this.courseSections.set([...sections]); // trigger re-render

      // 강의 탭 필터 칩: 서버에서 카테고리 목록 가져오기
      try {
        const categories = await this.api.lectures.findCategories(bootcampId);
        this.lectureFilterChips.set(['전체', ...categories]);
      } catch {
        // fallback: 로드된 강의 데이터에서 추출
        const cats = [...new Set(allLectures.map((l: LectureTabCard) => l.category).filter((c: string) => c))];
        this.lectureFilterChips.set(['전체', ...cats]);
      }

      // 과제 탭 필터 칩: 과정명 기반
      const courseNames = sections.map(s => s.title).filter(t => t);
      this.assignmentFilterChips.set(['전체', ...courseNames]);

      // 공지사항 로드
      try {
        const noticeList: NoticeResponse[] = await this.api.notices.findByBootcamp(bootcampId);
        this.notices.set(noticeList.map((n: NoticeResponse) => ({
          id: n.id,
          title: n.title || '',
          description: n.body || '',
          date: new Date(n.createdAt).toLocaleDateString('ko-KR'),
          isPinned: !!n.pinned,
        })));
      } catch {
        this.notices.set([]);
      }
    } catch (err) {
      console.error('부트캠프 데이터 로드 실패:', err);
    }
  }

  private async loadCourseCards(section: CourseSection): Promise<void> {
    if (section.cards.length > 0) return;
    try {
      const [lectures, assignments]: [LectureResponse[], AssignmentResponse[]] = await Promise.all([
        this.api.lectures.findByCourse(section.id),
        this.api.assignments.findByCourse(section.id),
      ]);
      const cards: LectureCard[] = [
        ...lectures.map((l: LectureResponse) => ({
          id: l.id, type: '강의' as const, category: l.category || '', title: l.title || '',
          duration: l.duration || '', thumbnail: this.getYoutubeThumbnail(l.videoUrl || ''),
          videoUrl: l.videoUrl || '',
        })),
        ...assignments.map((a: AssignmentResponse) => ({
          id: a.id, type: '과제' as const, category: '', title: a.title || '',
          dateRange: this.formatDueRange(a.dueDate, a.dueDateEnd),
          thumbnail: this.getYoutubeThumbnail(a.videoUrl || ''),
        })),
      ];
      section.cards = cards;
      this.lectureCards.set(lectures.map((l: LectureResponse) => ({
        id: l.id, title: l.title || '', category: l.category || '',
        duration: l.duration || '', status: 'progress', hasImage: !!l.videoUrl,
        thumbnail: this.getYoutubeThumbnail(l.videoUrl || ''),
        videoUrl: l.videoUrl || '',
      })));
      this.assignmentCards.set(assignments.map((a: AssignmentResponse) => ({
        id: a.id, title: a.title || '', course: section.title,
        dateRange: this.formatDueRange(a.dueDate, a.dueDateEnd),
        submitted: false,
        thumbnail: this.getYoutubeThumbnail(a.videoUrl || ''),
      })));
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
    if (section.isExpanded && section.cards.length === 0) {
      this.loadCourseCards(section).then(() => {
        this.courseSections.set([...this.courseSections()]);
      });
    } else {
      this.courseSections.set([...this.courseSections()]);
    }
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
  notices = signal<Notice[]>([]);

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

  private getYoutubeThumbnail(url: string): string {
    if (!url) return '';
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
    return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : '';
  }

  private formatDueRange(dueDate?: string | null, dueDateEnd?: string | null): string {
    if (!dueDate) return '';
    const fmt = (d: string) => {
      const dt = new Date(d);
      return `${dt.getFullYear()}.${String(dt.getMonth() + 1).padStart(2, '0')}.${String(dt.getDate()).padStart(2, '0')}`;
    };
    if (dueDateEnd) return `${fmt(dueDate)} ~ ${fmt(dueDateEnd)}`;
    return fmt(dueDate);
  }

  /** duration이 비어있는 강의의 유튜브 영상 길이 자동 조회 */
  private fetchMissingDurations(): void {
    const cards = this.lectureCards();
    const missing = cards.filter(c => !c.duration && c.videoUrl);
    console.log('[fetchMissingDurations] total:', cards.length, 'missing:', missing.length, missing.map(c => ({ id: c.id, videoUrl: c.videoUrl?.substring(0, 40) })));
    if (missing.length === 0) return;

    const extractVideoId = (url: string) => {
      const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
      return m ? m[1] : null;
    };

    const processBatch = () => {
      let idx = 0;
      const processNext = () => {
        if (idx >= missing.length) return;
        const card = missing[idx++];
        const videoId = extractVideoId(card.videoUrl || '');
        if (!videoId) { processNext(); return; }

        const container = document.createElement('div');
        container.id = `yt-dur-${card.id}`;
        container.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:1px;height:1px;overflow:hidden;';
        document.body.appendChild(container);

        new (window as any).YT.Player(`yt-dur-${card.id}`, {
          videoId,
          events: {
            onReady: (event: any) => {
              const sec = event.target.getDuration();
              console.log('[YT onReady] card:', card.id, 'duration sec:', sec);
              if (sec > 0) {
                const min = Math.floor(sec / 60);
                const s = Math.floor(sec % 60);
                const formatted = `${min}:${s.toString().padStart(2, '0')}`;
                card.duration = formatted;
                // 학습목록 탭(courseSections)의 카드도 업데이트
                for (const section of this.courseSections()) {
                  const sCard = section.cards.find(c => c.id === card.id && c.type === '강의');
                  if (sCard) { sCard.duration = formatted; break; }
                }
                this.lectureCards.set([...this.lectureCards()]);
                this.courseSections.set([...this.courseSections()]);
              }
              event.target.destroy();
              container.remove();
              // 다음 카드 처리 (약간의 딜레이)
              setTimeout(processNext, 100);
            },
          },
        });
      };
      processNext();
    };

    const waitForYT = (callback: () => void) => {
      if ((window as any).YT && (window as any).YT.Player) {
        callback();
        return;
      }
      // API 스크립트 로드
      if (!document.getElementById('yt-iframe-api')) {
        const tag = document.createElement('script');
        tag.id = 'yt-iframe-api';
        tag.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(tag);
      }
      // YT.Player 준비될 때까지 폴링
      const interval = setInterval(() => {
        if ((window as any).YT && (window as any).YT.Player) {
          clearInterval(interval);
          callback();
        }
      }, 200);
      setTimeout(() => clearInterval(interval), 10000);
    };

    waitForYT(() => processBatch());
  }
}

interface Notice {
  id: number;
  title: string;
  description: string;
  date: string;
  isPinned: boolean;
}
