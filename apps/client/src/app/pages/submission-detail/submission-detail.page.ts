import { Component, OnInit, signal, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { isImageFile as _isImageFile, downloadFile as _downloadFile } from '../../utils/file.utils';

interface LearningFile {
  name: string;
  url?: string;
  mimeType?: string;
}

@Component({
  selector: 'app-submission-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './submission-detail.page.html',
  styleUrls: ['./submission-detail.page.css'],
})
export class SubmissionDetailPage implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  submissionId = '';
  bootcampId = '';
  assignmentId = '';

  detailTabs = ['학습목록', '강의', '과제', '공지사항'];
  activeDetailTab = signal('과제');

  courseLabel = signal('');
  assignmentTitle = signal('');
  badge = signal('과제제출');
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

  // 현재 로그인 유저 프로필
  currentUserName = signal('');
  currentUserInitial = signal('');
  currentUserImage = signal('');

  ngOnInit(): void {
    this.route.paramMap.subscribe(async (params) => {
      this.bootcampId = params.get('bootcampId') || '';
      this.submissionId = params.get('submissionId') || '';
      if (this.submissionId) {
        await this.loadSubmission(Number(this.submissionId));
      }
    });
  }

  private async loadSubmission(id: number): Promise<void> {
    try {
      const s: any = await this.api.submissions.findOne(id);
      this.assignmentTitle.set(s.title || '');
      this.description.set(s.content || '');
      this.badge.set(s.type === 'FEEDBACK' ? '피드백' : '과제제출');
      this.author.set(s.author?.name || s.author?.nickname || '');
      this.date.set(new Date(s.createdAt).toLocaleDateString('ko-KR'));
      this.fileName.set(s.files?.[0]?.name || '');
      this.learningFiles.set((s.files || []).map((f: any) => ({ name: f.name, url: f.url, mimeType: f.mimeType || '' })));
      if (s.assignment) {
        this.courseLabel.set(s.assignment.course?.name || '');
        this.assignmentId = String(s.assignment.id);
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

      // 댓글 로드
      await this.loadComments();
    } catch (err) {
      console.error('제출 상세 로드 실패:', err);
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
    // TODO: 수정 페이지 이동 또는 모달
  }

  onDelete(): void {
    this.closeMore();
    this.isDeleteModalOpen.set(true);
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen.set(false);
  }

  async confirmDelete(): Promise<void> {
    try {
      await this.api.submissions.delete(Number(this.submissionId));
      this.isDeleteModalOpen.set(false);
      this.goBack();
    } catch (err) {
      console.error('제출과제 삭제 실패:', err);
    }
  }

  onRegisterFeedback(): void {
    this.closeMore();
    this.router.navigate([
      '/my-bootcamp', this.bootcampId, 'submission', this.submissionId, 'feedback-register',
    ]);
  }

  // ===== 댓글 =====
  comments = signal<any[]>([]);
  newComment = signal('');
  isCommentOpen = signal(true);
  isSubmittingComment = signal(false);

  toggleComments(): void {
    this.isCommentOpen.update(v => !v);
  }

  onCommentInput(event: Event): void {
    this.newComment.set((event.target as HTMLTextAreaElement).value);
  }

  private async loadComments(): Promise<void> {
    if (!this.submissionId) return;
    try {
      const list = await this.api.submissionComments.findBySubmission(Number(this.submissionId));
      this.comments.set(list.map((c: any) => ({
        id: c.id,
        authorName: c.author?.name || c.author?.nickname || '',
        authorRole: c.author?.role || '',
        authorInitial: (c.author?.name || c.author?.nickname || 'U').charAt(0).toUpperCase(),
        authorImage: c.author?.profileImage || '',
        body: c.body,
        createdAt: new Date(c.createdAt).toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
      })));
      this.cdr.markForCheck();
    } catch (err) {
      console.error('댓글 로드 실패:', err);
    }
  }

  async submitComment(): Promise<void> {
    const body = this.newComment().trim();
    if (!body || this.isSubmittingComment()) return;
    this.isSubmittingComment.set(true);
    try {
      await this.api.submissionComments.create(Number(this.submissionId), { body });
      this.newComment.set('');
      await this.loadComments();
    } catch (err) {
      console.error('댓글 등록 실패:', err);
    } finally {
      this.isSubmittingComment.set(false);
    }
  }

  isInstructorRole(role: string): boolean {
    return role === 'INSTRUCTOR' || role === 'ADMIN';
  }
  isImageFile(file: LearningFile): boolean {
    return _isImageFile(file);
  }

  downloadFile(file: LearningFile): void {
    _downloadFile(file.url, file.name);
  }
}
