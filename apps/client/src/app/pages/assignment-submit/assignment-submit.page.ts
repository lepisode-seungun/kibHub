import { Component, inject, signal } from '@angular/core';
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
  selector: 'app-assignment-submit',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './assignment-submit.page.html',
  styleUrls: ['./assignment-submit.page.css'],
})
export class AssignmentSubmitPage {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);

  bootcampId = '';
  assignmentId = '';

  detailTabs = ['학습목록', '강의', '과제', '공지사항'];
  activeDetailTab = signal('과제');

  title = '';
  content = '';
  isSubmitting = signal(false);

  uploadedFiles = signal<{ name: string; extension: string; size: string; status: 'uploading' | 'done' | 'error'; url?: string; path?: string }[]>([]);

  constructor() {
    this.route.params.subscribe((params) => {
      this.bootcampId = params['bootcampId'] || '';
      this.assignmentId = params['assignmentId'] || '';
    });
  }

  selectDetailTab(tab: string): void {
    this.activeDetailTab.set(tab);
  }

  goBack(): void {
    this.router.navigate([
      '/my-bootcamp', this.bootcampId, 'assignment', this.assignmentId,
    ]);
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

      // UI에 uploading 상태로 추가
      this.uploadedFiles.update(files => [...files, {
        name: file.name.replace(`.${ext}`, ''),
        extension: ext,
        size: `${sizeKB}KB`,
        status: 'uploading' as const,
      }]);

      // Supabase 업로드
      try {
        const result = await this.api.upload.single(file, 'assignments');
        this.uploadedFiles.update(files => files.map((f, j) =>
          j === idx ? { ...f, status: 'done' as const, url: result.url, path: result.path } : f
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
      const files = this.uploadedFiles()
        .filter(f => f.status === 'done')
        .map(f => ({ url: f.url!, name: f.name + '.' + f.extension, size: 0, mimeType: '' }));
      await this.api.submissions.create(Number(this.assignmentId), {
        title: this.title,
        content: this.content,
        files,
      });
      this.goBack();
    } catch (err) {
      console.error('제출 실패:', err);
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
