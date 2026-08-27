import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';

interface LearningFile {
  name: string;
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

  submissionId = '';
  bootcampId = '';

  detailTabs = ['학습목록', '강의', '과제', '공지사항'];
  activeDetailTab = signal('과제');

  courseLabel = '';
  assignmentTitle = '';
  badge = '과제제출';
  author = '';
  date = '';
  fileName = '';
  description = '';

  isMaterialOpen = signal(true);
  isMoreOpen = signal(false);
  isDeleteModalOpen = signal(false);

  isAuthor = true;
  isInstructor = false;

  learningFiles: LearningFile[] = [];

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.bootcampId = params.get('bootcampId') || '';
      this.submissionId = params.get('submissionId') || '';
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
    // TODO: 수정 페이지 이동 또는 모달
  }

  onDelete(): void {
    this.closeMore();
    this.isDeleteModalOpen.set(true);
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen.set(false);
  }

  confirmDelete(): void {
    // TODO: API 호출
    console.log('제출과제 삭제:', this.submissionId);
    this.isDeleteModalOpen.set(false);
    this.goBack();
  }

  onRegisterFeedback(): void {
    this.closeMore();
    this.router.navigate([
      '/my-bootcamp', this.bootcampId, 'submission', this.submissionId, 'feedback-register',
    ]);
  }
}
