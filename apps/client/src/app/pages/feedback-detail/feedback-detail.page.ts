import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';

interface LearningFile {
  name: string;
}

interface Comment {
  id: number;
  author: string;
  date: string;
  content: string;
  avatarInitial: string;
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

  ngOnDestroy(): void {
    document.body.style.overflow = '';
  }

  feedbackId = '';
  bootcampId = '';

  detailTabs = ['학습목록', '강의', '과제', '공지사항'];
  activeDetailTab = signal('과제');

  courseLabel = '';
  assignmentTitle = '';
  badge = '피드백';
  author = '';
  date = '';
  fileName = '';
  description = '';

  isMaterialOpen = signal(true);
  isMoreOpen = signal(false);
  isDeleteModalOpen = signal(false);

  isAuthor = false;
  isInstructor = true;

  learningFiles: LearningFile[] = [];
  comments: Comment[] = [];

  newComment = '';

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.bootcampId = params.get('bootcampId') || '';
      this.feedbackId = params.get('feedbackId') || '';
    });
  }

  goBack(): void {
    if (this.bootcampId) {
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

  confirmDelete(): void {
    this.isDeleteModalOpen.set(false);
    document.body.style.overflow = '';
    // TODO: API 삭제 요청 후 목록으로 이동
    this.goBack();
  }

  onRegisterFeedback(): void {
    this.closeMore();
    this.router.navigate([
      '/my-bootcamp', this.bootcampId, 'feedback', this.feedbackId, 'register',
    ]);
  }

  onCommentInput(event: Event): void {
    this.newComment = (event.target as HTMLTextAreaElement).value;
  }

  submitComment(): void {
    if (!this.newComment.trim()) return;
    this.comments.push({
      id: this.comments.length + 1,
      author: 'newon',
      date: new Date().toLocaleDateString('ko-KR'),
      content: this.newComment.trim(),
      avatarInitial: 'N',
    });
    this.newComment = '';
  }
}
