import { Component, OnInit, signal, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ApiService } from '../../services/api.service';

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
        this.dateRange.set(new Date(assignment.dueDate).toLocaleDateString('ko-KR'));
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
      this.submissions.set(list.map((s: any) => ({
        id: s.id,
        title: s.title,
        badge: s.type === 'FEEDBACK' ? '피드백' as const : '과제제출' as const,
        author: s.author?.name || s.author?.nickname || '',
        date: new Date(s.createdAt).toLocaleDateString('ko-KR'),
        fileName: s.files?.[0]?.name || '',
        commentCount: s._count?.comments || 0,
        isReply: !!s.parentId,
        isInstructor: s.author?.role === 'INSTRUCTOR',
      })));
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
}
