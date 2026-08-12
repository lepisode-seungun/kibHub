import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';

interface UploadFile {
  name: string;
  ext: string;
  size: string;
  status: 'uploading' | 'done';
}

@Component({
  selector: 'app-inquiry-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './inquiry-form.page.html',
  styleUrls: ['./inquiry-form.page.css'],
})
export class InquiryFormPage {
  title = '';
  content = '';
  maxFiles = 10;

  // 더미 첨부파일
  files: UploadFile[] = [
    { name: '첨부파일명', ext: 'jpg', size: '93KB', status: 'uploading' },
    { name: '첨부파일명', ext: 'hwp', size: '93KB', status: 'done' },
    { name: '첨부파일명', ext: 'hwp', size: '93KB', status: 'done' },
    { name: '첨부파일명', ext: 'hwp', size: '93KB', status: 'done' },
  ];

  constructor(private router: Router) {}

  removeFile(index: number): void {
    this.files.splice(index, 1);
  }

  removeAllFiles(): void {
    this.files = [];
  }

  onFileSelect(): void {
    // TODO: 파일 선택 다이얼로그
  }

  goToList(): void {
    this.router.navigate(['/customer-center']);
  }

  onSubmit(): void {
    // TODO: API 연동
  }
}
