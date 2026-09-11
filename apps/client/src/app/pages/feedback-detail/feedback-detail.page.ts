import { Component, signal, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { downloadFile as _downloadFile } from '../../utils/file.utils';

interface LearningFile {
  name: string;
  url?: string;
}

interface Comment {
  id: number;
  author: string;
  date: string;
  content: string;
  avatarInitial: string;
}

interface SubmissionResponse {
  title?: string;
  content?: string;
  type?: string;
  author?: { name?: string; nickname?: string };
  authorId?: number;
  createdAt: string;
  assignment?: { id: number; title?: string; course?: { name?: string } };
  files?: { name: string; url: string }[];
  comments?: { id: number; author?: { name?: string; nickname?: string }; createdAt: string; body: string }[];
}

@Component({
  selector: 'app-feedback-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './feedback-detail.page.html',
  styleUrls: ['./feedback-detail.page.css'],
})
export class FeedbackDetailPage implements OnInit, OnDestroy {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  ngOnDestroy(): void {
    document.body.style.overflow = '';
  }

  feedbackId = '';
  bootcampId = '';
  assignmentId = '';

  detailTabs = ['학습목록', '강의', '과제', '공지사항'];
  activeDetailTab = signal('과제');

  courseLabel = signal('');
  assignmentTitle = signal('');
  badge = signal('피드백');
  author = signal('');
  date = signal('');
  fileName = signal('');
  description = signal('');

  isMaterialOpen = signal(true);
  isMoreOpen = signal(false);
  isDeleteModalOpen = signal(false);

  isAuthor = signal(false);
  isInstructor = signal(false);

  learningFiles = signal<LearningFile[]>([]);
  comments = signal<Comment[]>([]);

  newComment = signal('');

  // 현재 로그인 유저 프로필
  currentUserName = signal('');
  currentUserInitial = signal('');
  currentUserImage = signal('');

  ngOnInit(): void {
    this.route.paramMap.subscribe(async (params) => {
      this.bootcampId = params.get('bootcampId') || '';
      this.feedbackId = params.get('feedbackId') || '';
      if (this.feedbackId) {
        await this.loadFeedback(Number(this.feedbackId));
      }
    });
  }

  private async loadFeedback(id: number): Promise<void> {
    try {
      const s = await this.api.submissions.findOne(id) as SubmissionResponse;
      this.assignmentTitle.set(s.title || '');
      this.description.set(s.content || '');
      this.badge.set(s.type === 'FEEDBACK' ? '피드백' : '과제제출');
      this.author.set(s.author?.name || s.author?.nickname || '');
      this.date.set(new Date(s.createdAt).toLocaleDateString('ko-KR'));
      this.fileName.set(s.assignment?.title || '');
      this.learningFiles.set((s.files || []).map((f: { name: string; url: string }) => ({ name: f.name, url: f.url })));
      if (s.assignment) {
        this.courseLabel.set(s.assignment.course?.name || '');
        this.assignmentId = String(s.assignment.id);
      }
      // 댓글 로드
      if (s.comments) {
        this.comments.set(s.comments.map((c: { id: number; author?: { name?: string; nickname?: string }; createdAt: string; body: string }) => ({
          id: c.id,
          author: c.author?.name || c.author?.nickname || '',
          date: new Date(c.createdAt).toLocaleDateString('ko-KR'),
          content: c.body,
          avatarInitial: (c.author?.name || c.author?.nickname || '?')[0].toUpperCase(),
        })));
      }
      // 권한 체크
      const user = this.authService.currentUser();
      this.isAuthor.set(user?.id === s.authorId);
      this.isInstructor.set(user?.role === 'INSTRUCTOR' || user?.role === 'ADMIN');
      // 현재 유저 프로필 설정
      if (user) {
        this.currentUserName.set(user.name || user.nickname || '');
        this.currentUserInitial.set((user.name || user.nickname || 'U').charAt(0).toUpperCase());
        this.currentUserImage.set(user.profileImage || '');
      }
      this.cdr.markForCheck();
    } catch (err) {
      console.error('피드백 상세 로드 실패:', err);
    }
  }

  goBack(): void {
    if (this.bootcampId && this.assignmentId) {
      this.router.navigate(['/my-bootcamp', this.bootcampId, 'assignment', this.assignmentId]);
    } else if (this.bootcampId) {
      this.router.navigate(['/my-bootcamp', this.bootcampId]);
    } else {
      this.router.navigate(['/my-bootcamp']);
    }
  }

  selectDetailTab(tab: string): void {
    this.activeDetailTab.set(tab);
    if (this.bootcampId) {
      this.router.navigate(['/my-bootcamp', this.bootcampId]);
    }
  }

  toggleMaterial(): void {
    this.isMaterialOpen.update(v => !v);
  }

  toggleMore(): void {
    this.isMoreOpen.update(v => !v);
  }

  closeMore(): void {
    this.isMoreOpen.set(false);
  }

  onEdit(): void {
    this.closeMore();
    this.router.navigate([
      '/my-bootcamp', this.bootcampId, 'feedback', this.feedbackId, 'register',
    ]);
  }

  onDelete(): void {
    this.closeMore();
    this.isDeleteModalOpen.set(true);
    document.body.style.overflow = 'hidden';
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen.set(false);
    document.body.style.overflow = '';
  }

  async confirmDelete(): Promise<void> {
    try {
      await this.api.submissions.delete(Number(this.feedbackId));
      this.isDeleteModalOpen.set(false);
      document.body.style.overflow = '';
      this.goBack();
    } catch (err) {
      console.error('피드백 삭제 실패:', err);
    }
  }


  onCommentInput(event: Event): void {
    this.newComment.set((event.target as HTMLTextAreaElement).value);
  }

  async submitComment(): Promise<void> {
    if (!this.newComment().trim()) return;
    try {
      const c = await this.api.submissionComments.create(Number(this.feedbackId), { body: this.newComment().trim() }) as { id: number; author?: { name?: string; nickname?: string }; createdAt: string; body: string };
      this.comments.update(list => [...list, {
        id: c.id,
        author: c.author?.name || c.author?.nickname || '',
        date: new Date(c.createdAt).toLocaleDateString('ko-KR'),
        content: c.body,
        avatarInitial: (c.author?.name || c.author?.nickname || '?')[0].toUpperCase(),
      }]);
      this.newComment.set('');
      this.cdr.markForCheck();
    } catch (err) {
      console.error('댓글 등록 실패:', err);
    }
  }

  onRegisterFeedback(): void {
    this.closeMore();
    this.router.navigate([
      '/my-bootcamp', this.bootcampId, 'submission', this.feedbackId, 'feedback-register',
    ]);
  }

  downloadFile(file: LearningFile): void {
    _downloadFile(file.url, file.name);
  }
}
