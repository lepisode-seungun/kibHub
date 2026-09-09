import { Component, OnInit, signal, computed, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { downloadFile as _downloadFile } from '../../utils/file.utils';

interface LearningFile {
  name: string;
  url?: string;
}

interface Submission {
  id: number;
  title: string;
  badge: '과제제출' | '피드백';
  author: string;
  date: string;
  fileName: string;
  commentCount: number;
  isReply: boolean;
  isInstructor: boolean;
  parentId: number | null;
  createdAt: string;
}

interface AssignmentResponse {
  id: number;
  title: string;
  content: string;
  body?: string;
  videoUrl: string;
  dueDate: string | null;
  dueDateEnd: string | null;
  course?: { id: number; name: string; title?: string };
  files?: { id: number; name: string; url: string; size: number; mimeType: string }[];
}

interface SubmissionResponse {
  id: number;
  title: string;
  type: string;
  parentId: number | null;
  createdAt: string;
  author?: { name: string; nickname: string; role: string };
  files?: { name: string; url: string }[];
  _count?: { comments: number };
}

@Component({
  selector: 'app-assignment-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './assignment-detail.page.html',
  styleUrls: ['./assignment-detail.page.css'],
})
export class AssignmentDetailPage implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);
  private sanitizer = inject(DomSanitizer);
  private authService = inject(AuthService);

  readonly isInstructor = computed(() => this.authService.currentUser()?.role === 'INSTRUCTOR');

  assignmentId = '';
  bootcampId = '';

  courseLabel = signal('');
  assignmentTitle = signal('');
  dateRange = signal('');
  description = signal('');
  videoUrl = signal('');

  isMaterialOpen = signal(true);

  detailTabs = ['학습목록', '강의', '과제', '공지사항'];
  activeDetailTab = signal('과제');

  learningFiles = signal<LearningFile[]>([]);
  private courseId = 0;
  private navItems: { type: 'lecture' | 'assignment'; id: number }[] = [];
  submissions = signal<Submission[]>([]);
  showAllSubmissions = signal(false);
  sortOrder = signal<'newest' | 'oldest'>('newest');
  isSortOpen = signal(false);
  searchKeyword = signal('');

  readonly SUBMISSION_LIMIT = 4;

  filteredSubmissions = computed(() => {
    let all = this.submissions();
    const keyword = this.searchKeyword().trim().toLowerCase();
    if (keyword) {
      const matchIds = new Set<number>();
      all.forEach(s => {
        if (s.title.toLowerCase().includes(keyword) || s.author.toLowerCase().includes(keyword)) {
          matchIds.add(s.id);
          if (s.parentId) matchIds.add(s.parentId);
        }
      });
      // Also include children of matched parents
      all.forEach(s => {
        if (s.parentId && matchIds.has(s.parentId)) matchIds.add(s.id);
      });
      all = all.filter(s => matchIds.has(s.id));
    }
    if (this.sortOrder() === 'oldest') {
      // Reverse parent order but keep children after their parent
      const parents = all.filter(s => !s.isReply);
      const childrenMap = new Map<number, Submission[]>();
      all.filter(s => s.isReply).forEach(s => {
        const arr = childrenMap.get(s.parentId!) || [];
        arr.push(s);
        childrenMap.set(s.parentId!, arr);
      });
      const reversed: Submission[] = [];
      for (const p of [...parents].reverse()) {
        reversed.push(p);
        (childrenMap.get(p.id) || []).forEach(c => reversed.push(c));
      }
      return reversed;
    }
    return all;
  });

  visibleSubmissions = computed(() => {
    const all = this.filteredSubmissions();
    if (this.showAllSubmissions()) return all;

    let parentCount = 0;
    let cutIndex = all.length;
    for (let i = 0; i < all.length; i++) {
      if (!all[i].isReply) {
        parentCount++;
        if (parentCount > this.SUBMISSION_LIMIT) {
          cutIndex = i;
          break;
        }
      }
    }
    return all.slice(0, cutIndex);
  });

  hasMoreSubmissions = computed(() => {
    const all = this.filteredSubmissions();
    const parentCount = all.filter(s => !s.isReply).length;
    return !this.showAllSubmissions() && parentCount > this.SUBMISSION_LIMIT;
  });

  toggleSortDropdown(): void {
    this.isSortOpen.update(v => !v);
  }

  applySortOrder(order: 'newest' | 'oldest'): void {
    this.sortOrder.set(order);
    this.isSortOpen.set(false);
  }

  onSearchInput(event: Event): void {
    this.searchKeyword.set((event.target as HTMLInputElement).value);
    this.showAllSubmissions.set(false);
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(async (params) => {
      this.bootcampId = params.get('bootcampId') || '';
      this.assignmentId = params.get('assignmentId') || '';
      // 기존 YouTube iframe 정리
      this.youtubeEmbedUrl = null;
      this.navItems = [];
      if (this.assignmentId) {
        await this.loadAssignment(Number(this.assignmentId));
        await this.loadSubmissions(Number(this.assignmentId));
      }
    });
    this.route.queryParamMap.subscribe((qp) => {
      this.returnTab = qp.get('tab') || '';
    });
  }

  private async loadAssignment(id: number): Promise<void> {
    try {
      const assignment = await this.api.assignments.findOne(id) as AssignmentResponse;
      this.assignmentTitle.set(assignment.title || '');
      this.description.set(assignment.content || assignment.body || '');
      this.videoUrl.set(assignment.videoUrl || '');
      this.updateYoutubeEmbed();
      if (assignment.dueDate) {
        const fmt = (d: string) => {
          const dt = new Date(d);
          return `${dt.getFullYear()}.${String(dt.getMonth() + 1).padStart(2, '0')}.${String(dt.getDate()).padStart(2, '0')}`;
        };
        const range = assignment.dueDateEnd
          ? `${fmt(assignment.dueDate)} ~ ${fmt(assignment.dueDateEnd)}`
          : fmt(assignment.dueDate);
        this.dateRange.set(range);
      }
      if (assignment.course) {
        this.courseLabel.set(assignment.course.name || assignment.course.title || '');
        if (assignment.course.id) this.courseId = assignment.course.id;
      }
      if (this.navItems.length === 0) {
        await this.loadNavItems();
      }
      if (assignment.files && assignment.files.length > 0) {
        this.learningFiles.set(assignment.files.map((f: { name: string; url: string }) => ({ name: f.name, url: f.url })));
      } else {
        this.learningFiles.set([]);
      }
      this.cdr.markForCheck();
    } catch (err) {
      console.error('과제 로드 실패:', err);
    }
  }

  private async loadSubmissions(assignmentId: number): Promise<void> {
    try {
      const list = await this.api.submissions.findByAssignment(assignmentId) as SubmissionResponse[];

      const toItem = (s: SubmissionResponse): Submission => ({
        id: s.id,
        title: s.title,
        badge: s.type === 'FEEDBACK' ? '피드백' as const : '과제제출' as const,
        author: s.author?.name || s.author?.nickname || '',
        date: new Date(s.createdAt).toLocaleDateString('ko-KR'),
        fileName: this.assignmentTitle(),
        commentCount: s._count?.comments || 0,
        isReply: !!s.parentId,
        isInstructor: s.author?.role === 'INSTRUCTOR',
        parentId: s.parentId || null,
        createdAt: s.createdAt,
      });

      // parent(과제제출)와 children(피드백)을 그룹핑
      const parents = list.filter(s => !s.parentId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const childrenMap = new Map<number, SubmissionResponse[]>();
      list.filter(s => s.parentId).forEach(s => {
        const arr = childrenMap.get(s.parentId as number) || [];
        arr.push(s);
        childrenMap.set(s.parentId as number, arr);
      });

      // parent → 해당 feedback 순서로 정렬
      const grouped: Submission[] = [];
      for (const parent of parents) {
        grouped.push(toItem(parent));
        const children = (childrenMap.get(parent.id) || [])
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        for (const child of children) {
          grouped.push(toItem(child));
        }
      }

      this.submissions.set(grouped);
    } catch (err) {
      console.error('제출 목록 로드 실패:', err);
    }
  }

  youtubeEmbedUrl: SafeResourceUrl | null = null;

  private updateYoutubeEmbed(): void {
    const url = this.videoUrl();
    if (!url) { this.youtubeEmbedUrl = null; return; }
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
    if (match) {
      this.youtubeEmbedUrl = null;
      this.cdr.detectChanges();
      setTimeout(() => {
        this.youtubeEmbedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube.com/embed/${match[1]}`);
        this.cdr.markForCheck();
      }, 50);
    } else {
      this.youtubeEmbedUrl = null;
    }
  }

  get youtubeThumbnail(): string {
    const url = this.videoUrl();
    if (!url) return '';
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
    return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : '';
  }

  returnTab = '';

  goBack(): void {
    if (this.bootcampId) {
      this.router.navigate(['/my-bootcamp', this.bootcampId], {
        queryParams: this.returnTab ? { tab: this.returnTab } : {},
      });
    } else {
      this.router.navigate(['/my-bootcamp']);
    }
  }

  private async loadNavItems(): Promise<void> {
    try {
      if (this.returnTab === '학습목록' && this.courseId) {
        // 학습목록 탭: 같은 과정 내 강의+과제 통합 순서
        const lectures: any[] = await this.api.lectures.findByCourse(this.courseId);
        const assignments: any[] = await this.api.assignments.findByCourse(this.courseId);
        this.navItems = [
          ...lectures.map((l: any) => ({ type: 'lecture' as const, id: l.id })),
          ...assignments.map((a: any) => ({ type: 'assignment' as const, id: a.id })),
        ];
      } else {
        // 과제 탭 등: 부트캠프 전체 과제만
        const courses: any[] = await this.api.courses.findByBootcamp(Number(this.bootcampId));
        const allItems: { type: 'lecture' | 'assignment'; id: number }[] = [];
        for (const course of courses) {
          const assignments: any[] = await this.api.assignments.findByCourse(course.id);
          assignments.forEach((a: any) => allItems.push({ type: 'assignment', id: a.id }));
        }
        this.navItems = allItems;
      }
    } catch { /* ignore */ }
  }

  goNext(): void {
    const currentId = Number(this.assignmentId);
    const idx = this.navItems.findIndex(n => n.type === 'assignment' && n.id === currentId);
    if (idx === -1 || idx >= this.navItems.length - 1) {
      alert('마지막 항목입니다.');
      return;
    }
    const next = this.navItems[idx + 1];
    if (next.type === 'lecture') {
      this.router.navigate(
        ['/my-bootcamp', this.bootcampId, 'lecture', next.id],
        { queryParams: this.returnTab ? { tab: this.returnTab } : {} }
      );
    } else {
      this.router.navigate(
        ['/my-bootcamp', this.bootcampId, 'assignment', next.id],
        { queryParams: this.returnTab ? { tab: this.returnTab } : {} }
      );
    }
  }

  selectDetailTab(tab: string): void {
    this.activeDetailTab.set(tab);
    if (tab === '학습목록' || tab === '강의' || tab === '공지사항') {
      if (this.bootcampId) {
        this.router.navigate(['/my-bootcamp', this.bootcampId], {
          queryParams: { tab },
        });
      }
    }
  }

  toggleMaterial(): void {
    this.isMaterialOpen.update(v => !v);
  }

  navigateToSubmission(submissionId: number): void {
    const item = this.submissions().find(s => s.id === submissionId);
    if (item?.badge === '피드백') {
      this.router.navigate(['/my-bootcamp', this.bootcampId, 'feedback', submissionId]);
    } else {
      this.router.navigate(['/my-bootcamp', this.bootcampId, 'submission', submissionId]);
    }
  }

  navigateToSubmit(): void {
    this.router.navigate(['/my-bootcamp', this.bootcampId, 'assignment', this.assignmentId, 'submit']);
  }

  toggleShowAll(): void {
    this.showAllSubmissions.set(true);
  }

  downloadFile(file: LearningFile): void {
    _downloadFile(file.url, file.name);
  }
}
