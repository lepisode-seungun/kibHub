import { Component, OnInit, signal, inject, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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

interface ReviewItem {
  id: number;
  rating: number;
  body: string;
  images: string[] | null;
  isApproved: boolean;
  userId: number;
  bootcampId: number;
  createdAt: string;
  updatedAt: string;
  user?: { id: number; nickname: string; profileImage: string | null };
}

interface SurveyQuestion {
  id?: string;
  type: string;
  text?: string;
  title?: string;
  options?: string[];
  required?: boolean;
}

interface SurveyItem {
  id: number;
  bootcampId: number;
  title: string;
  questions: SurveyQuestion[];
  isActive: boolean;
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
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './my-bootcamp-detail.page.html',
  styleUrls: ['./my-bootcamp-detail.page.css'],
})
export class MyBootcampDetailPage implements OnInit {
  private authService = inject(AuthService);
  private api = inject(ApiService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  bootcampId = '';
  Math = Math;
  bootcampTitle = signal('');
  bootcampStatus = signal('');
  rawBootcampStatus = signal('');
  dateRange = signal('');

  /** 부트캠프 종료 여부 (ENDED만 — CLOSED(마감)은 설문 안 띄움) */
  isBootcampEnded = computed(() => this.rawBootcampStatus() === 'ENDED');

  /** 부트캠프 기간 (날짜 기반 출석 제한) */
  bootcampStartDate = signal<string | null>(null);
  bootcampEndDate = signal<string | null>(null);

  /**
   * 출석 가능 상태:
   * 'before' = 시작일 이전
   * 'active' = 기간 내
   * 'after'  = 종료일 이후
   * 'ended'  = status ENDED
   */
  attendanceStatus = computed<'before' | 'active' | 'after' | 'ended'>(() => {
    if (this.isBootcampEnded()) return 'ended';
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const start = this.bootcampStartDate();
    if (start) {
      const s = new Date(start);
      s.setHours(0, 0, 0, 0);
      if (now < s) return 'before';
    }
    const end = this.bootcampEndDate();
    if (end) {
      const e = new Date(end);
      e.setHours(23, 59, 59, 999);
      if (now > e) return 'after';
    }
    return 'active';
  });

  /** 출석 가능 여부 */
  canCheckIn = computed(() => this.attendanceStatus() === 'active');

  /** 종료 시에도 설문조사 탭은 숨기고 모달로만 처리 */
  detailTabs = ['학습목록', '강의', '과제', '출석', '공지사항'];
  activeDetailTab = signal('학습목록');

  courseSections = signal<CourseSection[]>([]);

  /* ===== 강의 탭 ===== */
  lectureFilterChips = signal<string[]>(['전체']);
  activeLectureFilter = signal('전체');
  lectureSearchText = '';
  lectureDisplayLimit = signal(8);

  /* 정렬 드롭다운 */
  sortOrder = signal<'최신순' | '오래된순'>('최신순');
  isSortDropdownOpen = signal(false);

  toggleSortDropdown(): void {
    this.isSortDropdownOpen.update(v => !v);
  }

  selectSortOrder(order: '최신순' | '오래된순'): void {
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
    // 정렬: 최신순(id 내림차순) / 오래된순(id 오름차순)
    const order = this.sortOrder();
    items = [...items].sort((a, b) => order === '최신순' ? b.id - a.id : a.id - b.id);
    return items;
  }

  get displayedLectures() {
    return this.filteredLectures.slice(0, this.lectureDisplayLimit());
  }

  get hasMoreLectures() {
    return this.filteredLectures.length > this.lectureDisplayLimit();
  }

  loadMoreLectures(): void {
    this.lectureDisplayLimit.update(v => v + 8);
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
  assignmentDisplayLimit = signal(8);

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
    const order = this.sortOrder();
    items = [...items].sort((a, b) => order === '최신순' ? b.id - a.id : a.id - b.id);
    return items;
  }

  get displayedAssignments() {
    return this.filteredAssignments.slice(0, this.assignmentDisplayLimit());
  }

  get hasMoreAssignments() {
    return this.filteredAssignments.length > this.assignmentDisplayLimit();
  }

  loadMoreAssignments(): void {
    this.assignmentDisplayLimit.update(v => v + 8);
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
    if (tab) {
      this.activeDetailTab.set(tab);
    }
    if (this.bootcampId) {
      this.loadBootcampData(Number(this.bootcampId)).then(() => {
        // 설문 데이터 항상 로드 → isActive 기반 자동 팝업
        this.loadSurvey().then(() => this.handleSurveyOnEntry());
        // 출석 & 진도 데이터 로드
        this.loadAttendance();
        this.loadProgress();
      });
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
    CLOSED: '마감',
    ENDED: '종료',
  };

  private async loadBootcampData(bootcampId: number): Promise<void> {
    try {
      const bootcamp: BootcampDetail = await this.api.bootcamps.findOne(bootcampId);
      this.bootcampTitle.set(bootcamp.name || '');

      // 날짜 포맷
      const fmt = (d: string) => {
        const dt = new Date(d);
        return `${dt.getFullYear()}. ${String(dt.getMonth() + 1).padStart(2, '0')}. ${String(dt.getDate()).padStart(2, '0')}일`;
      };
      this.dateRange.set(bootcamp.startDate && bootcamp.endDate
        ? `${fmt(bootcamp.startDate)} ~ ${fmt(bootcamp.endDate)}` : '');

      // 출석 기간 검증용 날짜 저장
      this.bootcampStartDate.set(bootcamp.startDate || null);
      this.bootcampEndDate.set(bootcamp.endDate || null);

      // 유저의 지원 상태 가져오기 (강사/관리자는 스킵)
      const user = this.authService.currentUser();
      if (user) {
        if (user.role === 'INSTRUCTOR' || user.role === 'ADMIN') {
          // 강사/관리자는 부트캠프 상태 직접 표시
          this.rawBootcampStatus.set(bootcamp.status || '');
          this.bootcampStatus.set(this.STATUS_LABEL[bootcamp.status] || bootcamp.status || '수강중');
        } else {
          try {
            const applicants = await this.api.applicants.findByUser(user.id);
            const myApp = applicants.find((a: { bootcampId: number; status: string }) => a.bootcampId === bootcampId);
            // 접근 권한 체크: ENDED 시 COMPLETED도 허용
            const isEnded = bootcamp.status === 'ENDED';
            const allowed = myApp && (myApp.status === 'ACCEPTED' || (isEnded && myApp.status === 'COMPLETED'));
            if (!allowed) {
              this.router.navigate(['/my-bootcamp']);
              return;
            }
            this.rawBootcampStatus.set(bootcamp.status || '');
            this.bootcampStatus.set(myApp
              ? (this.STATUS_LABEL[myApp.status] || myApp.status)
              : (this.STATUS_LABEL[bootcamp.status] || bootcamp.status));
          } catch {
            this.rawBootcampStatus.set(bootcamp.status || '');
            this.bootcampStatus.set(this.STATUS_LABEL[bootcamp.status] || bootcamp.status);
          }
        }
      } else {
        this.rawBootcampStatus.set(bootcamp.status || '');
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
          description: this.stripHtml(n.body || ''),
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

  /** 설문이 활성화(isActive)되어 있고 미응답이면 자동 팝업 */
  private async handleSurveyOnEntry(): Promise<void> {
    const survey = this.activeSurvey();
    if (!survey) return; // 설문 없거나 isActive=false면 findActive에서 null 반환됨
    if (this.hasResponded()) return; // 이미 응답 완료

    // 리뷰 데이터 로드 후 신규 제출 모드로 모달 오픈
    await this.loadReviews();
    this.myReview.set(null);
    this.reviewForm = { rating: 0, body: '', images: [] };
    this.surveyAnswers.set({});
    this.isReviewModalOpen.set(true);
    document.body.style.overflow = 'hidden';
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
  noticesPerPage = 10;
  noticeSearchText = signal('');

  onNoticeSearch(event: Event): void {
    this.noticeSearchText.set((event.target as HTMLInputElement).value);
    this.currentNoticePage.set(1);
  }

  filteredNotices = computed(() => {
    let items = this.notices();
    const q = this.noticeSearchText().trim().toLowerCase();
    
    if (q) {
      items = items.filter(n => 
        (n.title && n.title.toLowerCase().includes(q)) || 
        (n.description && n.description.toLowerCase().includes(q))
      );
    }

    const order = this.sortOrder();
    items = [...items].sort((a, b) => order === '최신순' ? b.id - a.id : a.id - b.id);
    
    return items;
  });

  totalNoticePages = computed(() => Math.max(1, Math.ceil(this.filteredNotices().length / this.noticesPerPage)));
  noticePagesArray = computed(() => Array.from({ length: this.totalNoticePages() }, (_, i) => i + 1));
  paginatedNotices = computed(() => {
    const start = (this.currentNoticePage() - 1) * this.noticesPerPage;
    return this.filteredNotices().slice(start, start + this.noticesPerPage);
  });

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

        new (window as unknown as { YT: { Player: new (id: string, opts: Record<string, unknown>) => { destroy(): void } } }).YT.Player(`yt-dur-${card.id}`, {
          videoId,
          events: {
            onReady: (event: { target: { getDuration(): number; destroy(): void } }) => {
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
      if ((window as unknown as Record<string, Record<string, unknown>>)['YT']?.['Player']) {
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
        if ((window as unknown as Record<string, Record<string, unknown>>)['YT']?.['Player']) {
          clearInterval(interval);
          callback();
        }
      }, 200);
      setTimeout(() => clearInterval(interval), 10000);
    };

    waitForYT(() => processBatch());
  }

  /** HTML 태그 제거 및 엔티티 디코딩 */
  private stripHtml(html: string): string {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
  }

  /* ===== 리뷰 탭 ===== */
  _reviewData = signal<{ reviews: ReviewItem[]; avgRating: number; totalCount: number; ratingDist: number[] } | null>(null);
  reviewData = computed(() => this._reviewData() ?? { reviews: [] as ReviewItem[], avgRating: 0, totalCount: 0, ratingDist: [0, 0, 0, 0, 0] });
  myReview = signal<ReviewItem | null>(null);
  reviewLoading = signal(false);
  isReviewModalOpen = signal(false);
  reviewForm = { rating: 0, body: '', images: [] as string[] };
  hoverRating = signal(0);

  async loadReviews(): Promise<void> {
    if (!this.bootcampId) return;
    this.reviewLoading.set(true);
    try {
      const data = await this.api.reviews.findByBootcamp(Number(this.bootcampId));
      this._reviewData.set(data);
      // 내 리뷰 확인
      try {
        const mine = await this.api.reviews.findMine(Number(this.bootcampId));
        this.myReview.set(mine);
      } catch { this.myReview.set(null); }
      // 설문 로드
      this.loadSurvey();
    } catch (err) {
      console.error('리뷰 로드 실패:', err);
    } finally {
      this.reviewLoading.set(false);
    }
  }

  openReviewModal(): void {
    const mine = this.myReview();
    if (mine) {
      this.reviewForm = { rating: mine.rating, body: mine.body, images: mine.images || [] };
    } else {
      this.reviewForm = { rating: 0, body: '', images: [] };
    }
    this.surveyAnswers.set({});
    this.loadSurvey(); // 항상 최신 설문 로드
    this.isReviewModalOpen.set(true);
    document.body.style.overflow = 'hidden';
  }

  closeReviewModal(): void {
    this.isReviewModalOpen.set(false);
    document.body.style.overflow = '';
  }

  setRating(star: number): void {
    const newRating = this.reviewForm.rating === star ? 0 : star;
    this.reviewForm = { ...this.reviewForm, rating: newRating };
    if (newRating === 0) this.hoverRating.set(0);
  }

  async submitReview(): Promise<void> {
    if (this.reviewForm.rating === 0) { alert('별점을 선택해주세요.'); return; }

    // 설문 필수 항목 검증 (활성 설문이 있고 미응답인 경우)
    const survey = this.activeSurvey();
    if (survey?.id && !this.hasResponded()) {
      const surveyQuestions = survey.questions || [];
      const currentAnswers = this.surveyAnswers();
      const missingRequired = surveyQuestions
        .map((q, i) => ({ ...q, index: i }))
        .filter(q => q.required !== false)
        .filter(q => {
          const answer = currentAnswers[q.index];
          if (answer === undefined || answer === null) return true;
          if (typeof answer === 'string' && answer.trim() === '') return true;
          return false;
        });

      if (missingRequired.length > 0) {
        alert('설문 필수 항목을 모두 작성해주세요.');
        return;
      }
    }

    try {
      await this.api.reviews.create(Number(this.bootcampId), this.reviewForm);

      // 설문 응답 동시 제출 (활성 설문이 있고 미응답인 경우)
      if (survey?.id && !this.hasResponded()) {
        const surveyQuestions = survey.questions || [];
        const answerEntries = Object.entries(this.surveyAnswers())
          .filter(([, v]) => v !== undefined && v !== null && v !== '');
        if (answerEntries.length > 0) {
          const answers: { questionId: string; answer: string | string[] | number }[] = answerEntries.map(([idx, answer]) => ({
            questionId: surveyQuestions[Number(idx)]?.id || String(idx),
            answer,
          }));
          try {
            await this.api.surveys.respond(survey.id, answers);
            this.hasResponded.set(true);
          } catch { /* 설문 실패해도 리뷰는 성공 */ }
        }
      }

      this.isReviewModalOpen.set(false);
      this.surveyAnswers.set({});
      await this.loadReviews();
    } catch (err: unknown) {
      const e = err as { error?: { message?: string } };
      alert(e?.error?.message || '설문조사 제출에 실패했습니다.');
    }
  }

  async deleteReview(): Promise<void> {
    const mine = this.myReview();
    if (!mine) return;
    if (!confirm('설문조사를 삭제하시겠습니까?')) return;
    try {
      await this.api.reviews.delete(mine.id);
      this.myReview.set(null);
      await this.loadReviews();
    } catch (err: unknown) {
      const e = err as { error?: { message?: string } };
      alert(e?.error?.message || '설문조사 삭제에 실패했습니다.');
    }
  }

  getStarArray(rating: number): boolean[] {
    return [1, 2, 3, 4, 5].map(i => i <= rating);
  }

  getRatingBarWidth(count: number): string {
    const data = this.reviewData();
    if (!data || data.totalCount === 0) return '0%';
    return `${(count / data.totalCount) * 100}%`;
  }

  formatReviewDate(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}분 전`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}시간 전`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}일 전`;
    return new Date(dateStr).toLocaleDateString('ko-KR');
  }

  // ===== 설문 =====
  activeSurvey = signal<SurveyItem | null>(null);
  surveyAnswers = signal<Record<number, string | number>>({});
  surveyLoading = signal(false);
  hasResponded = signal(false);
  surveySubmitting = signal(false);

  async loadSurvey(): Promise<void> {
    const id = Number(this.bootcampId);
    if (!id) return;
    this.surveyLoading.set(true);
    try {
      const survey = await this.api.surveys.findActive(id);
      console.log('[loadSurvey] findActive result:', survey);
      this.activeSurvey.set(survey);
      if (survey?.id) {
        try {
          const check = await this.api.surveys.checkResponse(survey.id);
          console.log('[loadSurvey] checkResponse:', check);
          this.hasResponded.set(check.hasResponded);
        } catch (checkErr) {
          console.warn('[loadSurvey] checkResponse failed, treating as not responded:', checkErr);
          this.hasResponded.set(false);
        }
      } else {
        console.log('[loadSurvey] No active survey found');
        this.hasResponded.set(false);
      }
    } catch (e) {
      console.error('[loadSurvey] findActive error:', e);
      this.activeSurvey.set(null);
    }
    this.surveyLoading.set(false);
  }

  updateSurveyAnswer(qIndex: number, value: string | number, isTextInput = false): void {
    // 텍스트 입력(textarea)은 토글하지 않고 직접 업데이트
    if (isTextInput) {
      this.surveyAnswers.update(a => ({ ...a, [qIndex]: value }));
      return;
    }
    // 객관식/별점: 같은 값이면 토글 해제
    const current = this.surveyAnswers()[qIndex];
    if (current === value) {
      const copy = { ...this.surveyAnswers() };
      delete copy[qIndex];
      this.surveyAnswers.set(copy);
    } else {
      this.surveyAnswers.update(a => ({ ...a, [qIndex]: value }));
    }
  }

  async submitSurvey(): Promise<void> {
    const survey = this.activeSurvey();
    if (!survey?.id) return;

    // 필수 항목 검증
    const surveyQuestions = survey.questions || [];
    const currentAnswers = this.surveyAnswers();
    const missingRequired = surveyQuestions
      .map((q, i) => ({ ...q, index: i }))
      .filter(q => q.required !== false)
      .filter(q => {
        const answer = currentAnswers[q.index];
        if (answer === undefined || answer === null) return true;
        if (typeof answer === 'string' && answer.trim() === '') return true;
        return false;
      });

    if (missingRequired.length > 0) {
      alert('설문 필수 항목을 모두 작성해주세요.');
      return;
    }

    this.surveySubmitting.set(true);
    const answers: { questionId: string; answer: string | string[] | number }[] = Object.entries(currentAnswers).map(([idx, answer]) => ({
      questionId: surveyQuestions[Number(idx)]?.id || String(idx),
      answer,
    }));
    try {
      await this.api.surveys.respond(survey.id, answers);
      this.hasResponded.set(true);
      alert('설문이 제출되었습니다. 감사합니다!');
    } catch (err: unknown) {
      const e = err as { error?: { message?: string } };
      alert(e?.error?.message || '설문 제출에 실패했습니다.');
    }
    this.surveySubmitting.set(false);
  }

  // ===== 출석 체크 =====
  todayCheckedIn = signal(false);
  attendanceDates = signal<string[]>([]);
  attendanceRate = signal(0);
  attendanceDays = signal(0);
  attendanceTotalDays = signal(0);
  attendanceElapsedDays = signal(0);
  attendanceLoading = signal(false);

  async loadAttendance(): Promise<void> {
    const id = Number(this.bootcampId);
    if (!id) return;
    try {
      const [today, records, rate] = await Promise.all([
        this.api.attendance.checkToday(id),
        this.api.attendance.getMyAttendance(id),
        this.api.attendance.getRate(id),
      ]);
      this.todayCheckedIn.set(today.checkedIn);
      this.attendanceDates.set(records.map(r => r.date));
      this.attendanceRate.set(rate.rate);
      this.attendanceDays.set(rate.attendanceDays);
      this.attendanceTotalDays.set(rate.totalDays);
      this.attendanceElapsedDays.set(rate.elapsedDays || rate.totalDays);
    } catch (e) {
      console.error('출석 데이터 로드 실패:', e);
    }
  }

  async doCheckIn(): Promise<void> {
    const id = Number(this.bootcampId);
    if (!id || this.todayCheckedIn()) return;
    // 다른 달을 보고 있으면 오늘 달로 이동
    const now = new Date();
    const current = this.calendarMonth();
    if (current.getFullYear() !== now.getFullYear() || current.getMonth() !== now.getMonth()) {
      this.calendarMonth.set(new Date(now.getFullYear(), now.getMonth(), 1));
    }
    this.attendanceLoading.set(true);
    try {
      await this.api.attendance.checkIn(id);
      this.todayCheckedIn.set(true);
      await this.loadAttendance();
    } catch (e: unknown) {
      const err = e as { status?: number };
      if (err?.status === 409) {
        this.todayCheckedIn.set(true);
      } else {
        alert('출석 체크에 실패했습니다.');
      }
    } finally {
      this.attendanceLoading.set(false);
    }
  }

  // 캘린더 헬퍼
  calendarMonth = signal(new Date());

  get calendarDays(): (number | null)[] {
    const month = this.calendarMonth();
    const year = month.getFullYear();
    const m = month.getMonth();
    const firstDay = new Date(year, m, 1).getDay();
    const daysInMonth = new Date(year, m + 1, 0).getDate();
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    return days;
  }

  get calendarLabel(): string {
    const m = this.calendarMonth();
    return `${m.getFullYear()}년 ${m.getMonth() + 1}월`;
  }

  prevMonth(): void {
    const m = this.calendarMonth();
    this.calendarMonth.set(new Date(m.getFullYear(), m.getMonth() - 1, 1));
  }

  nextMonth(): void {
    const m = this.calendarMonth();
    this.calendarMonth.set(new Date(m.getFullYear(), m.getMonth() + 1, 1));
  }

  isAttendanceDay(day: number): boolean {
    const m = this.calendarMonth();
    const dateStr = `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return this.attendanceDates().includes(dateStr);
  }

  isToday(day: number): boolean {
    const m = this.calendarMonth();
    const now = new Date();
    return m.getFullYear() === now.getFullYear() && m.getMonth() === now.getMonth() && day === now.getDate();
  }

  // ===== 학습 진도 =====
  progressData = signal<{
    totalLectures: number;
    totalCompleted: number;
    totalRate: number;
    courses: { courseId: number; courseTitle: string; totalLectures: number; completedLectures: number; rate: number }[];
  } | null>(null);

  async loadProgress(): Promise<void> {
    const id = Number(this.bootcampId);
    if (!id) return;
    try {
      const data = await this.api.progress.getMyProgress(id);
      this.progressData.set(data);
    } catch (e) {
      console.error('진도 데이터 로드 실패:', e);
    }
  }
}

interface Notice {
  id: number;
  title: string;
  description: string;
  date: string;
  isPinned: boolean;
}
