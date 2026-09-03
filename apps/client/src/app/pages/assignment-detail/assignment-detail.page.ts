import { Component, OnInit, signal, computed, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ApiService } from '../../services/api.service';
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
  submissions = signal<Submission[]>([]);
  showAllSubmissions = signal(false);

  readonly SUBMISSION_LIMIT = 4;

  visibleSubmissions = computed(() => {
    const all = this.submissions();
    if (this.showAllSubmissions()) return all;

    // parent 그룹 단위로 제한 (parent + 자식 피드백을 하나의 그룹으로)
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
    const all = this.submissions();
    const parentCount = all.filter(s => !s.isReply).length;
    return !this.showAllSubmissions() && parentCount > this.SUBMISSION_LIMIT;
  });

  ngOnInit(): void {
    this.route.paramMap.subscribe(async (params) => {
      this.bootcampId = params.get('bootcampId') || '';
      this.assignmentId = params.get('assignmentId') || '';
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
      const assignment: any = await this.api.assignments.findOne(id);
      this.assignmentTitle.set(assignment.title || '');
      this.description.set(assignment.content || assignment.body || '');
      this.videoUrl.set(assignment.videoUrl || '');
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
      }
      if (assignment.files && assignment.files.length > 0) {
        this.learningFiles.set(assignment.files.map((f: any) => ({ name: f.name, url: f.url })));
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
      const list: any[] = await this.api.submissions.findByAssignment(assignmentId);

      const toItem = (s: any) => ({
        id: s.id,
        title: s.title,
        badge: s.type === 'FEEDBACK' ? '피드백' as const : '과제제출' as const,
        author: s.author?.name || s.author?.nickname || '',
        date: new Date(s.createdAt).toLocaleDateString('ko-KR'),
        fileName: s.files?.[0]?.name || '',
        commentCount: s._count?.comments || 0,
        isReply: !!s.parentId,
        isInstructor: s.author?.role === 'INSTRUCTOR',
        parentId: s.parentId || null,
        createdAt: s.createdAt,
      });

      // parent(과제제출)와 children(피드백)을 그룹핑
      const parents = list.filter(s => !s.parentId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const childrenMap = new Map<number, any[]>();
      list.filter(s => s.parentId).forEach(s => {
        const arr = childrenMap.get(s.parentId) || [];
        arr.push(s);
        childrenMap.set(s.parentId, arr);
      });

      // parent → 해당 feedback 순서로 정렬
      const grouped: any[] = [];
      for (const parent of parents) {
        grouped.push(toItem(parent));
        const children = (childrenMap.get(parent.id) || [])
          .sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        for (const child of children) {
          grouped.push(toItem(child));
        }
      }

      this.submissions.set(grouped);
    } catch (err) {
      console.error('제출 목록 로드 실패:', err);
    }
  }

  get youtubeEmbedUrl(): SafeResourceUrl | null {
    const url = this.videoUrl();
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
    return match ? this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube.com/embed/${match[1]}`) : null;
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

  goNext(): void {
    const nextId = Number(this.assignmentId) + 1;
    this.router.navigate(
      ['/my-bootcamp', this.bootcampId, 'assignment', nextId],
      { queryParams: this.returnTab ? { tab: this.returnTab } : {} }
    );
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
