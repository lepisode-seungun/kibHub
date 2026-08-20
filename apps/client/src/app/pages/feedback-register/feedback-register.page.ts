import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';

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

  bootcampId = '';
  submissionId = '';
  feedbackId = '';

  detailTabs = ['학습목록', '강의', '과제', '공지사항'];
  activeDetailTab = signal('과제');

  title = '';
  content = '';

  uploadedFiles: UploadedFile[] = [
    { name: '첨부파일명', extension: 'jpg', size: '93KB', status: 'uploading' },
    { name: '첨부파일명', extension: 'hwp', size: '93KB', status: 'done' },
    { name: '첨부파일명', extension: 'hwp', size: '93KB', status: 'done' },
    { name: '첨부파일명', extension: 'hwp', size: '93KB', status: 'done' },
  ];

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
    this.uploadedFiles.splice(index, 1);
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    for (let i = 0; i < input.files.length; i++) {
      const file = input.files[i];
      const ext = file.name.split('.').pop() || '';
      const sizeKB = Math.round(file.size / 1024);
      this.uploadedFiles.push({
        name: file.name.replace(`.${ext}`, ''),
        extension: ext,
        size: `${sizeKB}KB`,
        status: 'done',
      });
    }
    input.value = '';
  }

  onCancel(): void {
    this.goBack();
  }

  onSubmit(): void {
    // TODO: API 연동 — FormData로 title, content, files 전송
    this.goBack();
  }
}
