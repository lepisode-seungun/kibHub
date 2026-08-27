import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';

interface UploadedFile {
  name: string;
  extension: string;
  size: string;
  status: 'uploading' | 'done';
}

@Component({
  selector: 'app-feedback-register',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './feedback-register.page.html',
  styleUrls: ['./feedback-register.page.css'],
})
export class FeedbackRegisterPage implements OnInit, OnDestroy {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);

  bootcampId = '';
  submissionId = '';
  feedbackId = '';

  detailTabs = ['학습목록', '강의', '과제', '공지사항'];
  activeDetailTab = signal('과제');

  title = '';
  content = '';
  isSubmitting = signal(false);

  uploadedFiles = signal<{ name: string; extension: string; size: string; status: 'uploading' | 'done' | 'error'; url?: string }[]>([]);

  constructor() {
    this.route.params.subscribe((params) => {
      this.bootcampId = params['bootcampId'] || '';
      this.submissionId = params['submissionId'] || '';
      this.feedbackId = params['feedbackId'] || '';
    });
  }

  ngOnInit(): void {
    document.body.classList.add('page-feedback-register');
  }

  ngOnDestroy(): void {
    document.body.classList.remove('page-feedback-register');
  }

  selectDetailTab(tab: string): void {
    this.activeDetailTab.set(tab);
    if (this.bootcampId) {
      this.router.navigate(['/my-bootcamp', this.bootcampId]);
    }
  }

  goBack(): void {
    if (this.bootcampId && this.feedbackId) {
      this.router.navigate(['/my-bootcamp', this.bootcampId, 'feedback', this.feedbackId]);
    } else if (this.bootcampId && this.submissionId) {
      this.router.navigate(['/my-bootcamp', this.bootcampId, 'submission', this.submissionId]);
    } else if (this.bootcampId) {
      this.router.navigate(['/my-bootcamp', this.bootcampId]);
    } else {
      this.router.navigate(['/my-bootcamp']);
    }
  }

  removeFile(index: number): void {
    this.uploadedFiles.update(files => files.filter((_, i) => i !== index));
  }

  async onFileSelect(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    for (let i = 0; i < input.files.length; i++) {
      const file = input.files[i];
      const ext = file.name.split('.').pop() || '';
      const sizeKB = Math.round(file.size / 1024);
      const idx = this.uploadedFiles().length;

      this.uploadedFiles.update(files => [...files, {
        name: file.name.replace(`.${ext}`, ''),
        extension: ext,
        size: `${sizeKB}KB`,
        status: 'uploading' as const,
      }]);

      try {
        const result = await this.api.upload.single(file, 'feedbacks');
        this.uploadedFiles.update(files => files.map((f, j) =>
          j === idx ? { ...f, status: 'done' as const, url: result.url } : f
        ));
      } catch {
        this.uploadedFiles.update(files => files.map((f, j) =>
          j === idx ? { ...f, status: 'error' as const } : f
        ));
      }
    }
    input.value = '';
  }

  onCancel(): void {
    this.goBack();
  }

  async onSubmit(): Promise<void> {
    if (this.isSubmitting()) return;
    this.isSubmitting.set(true);
    try {
      // TODO: 피드백 등록 API (서버에 피드백 엔드포인트 필요)
      console.log('Feedback submit:', {
        title: this.title,
        content: this.content,
        files: this.uploadedFiles().filter(f => f.status === 'done').map(f => ({ url: f.url, name: f.name + '.' + f.extension })),
      });
      this.goBack();
    } catch (err) {
      console.error('피드백 등록 실패:', err);
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
