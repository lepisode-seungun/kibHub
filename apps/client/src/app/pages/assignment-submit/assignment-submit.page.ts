import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';

interface UploadedFile {
  name: string;
  extension: string;
  size: string;
  status: 'uploading' | 'done';
}

@Component({
  selector: 'app-assignment-submit',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './assignment-submit.page.html',
  styleUrls: ['./assignment-submit.page.css'],
})
export class AssignmentSubmitPage {
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  bootcampId = '';
  assignmentId = '';

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
      this.assignmentId = params['assignmentId'] || '';
    });
  }

  selectDetailTab(tab: string): void {
    // 탭 전환시 해당 페이지로 이동
    this.activeDetailTab.set(tab);
  }

  goBack(): void {
    this.router.navigate([
      '/my-bootcamp', this.bootcampId, 'assignment', this.assignmentId,
    ]);
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
