import { Component, inject, signal, OnInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';

interface UploadFile {
  name: string;
  ext: string;
  size: string;
  sizeBytes: number;
  mimeType: string;
  status: 'uploading' | 'done' | 'error';
  url?: string;
  file?: File;
}

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

@Component({
  selector: 'app-inquiry-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './inquiry-form.page.html',
  styleUrls: ['./inquiry-form.page.css'],
})
export class InquiryFormPage implements OnInit {
  title = '';
  content = '';
  maxFiles = 10;
  isEditMode = signal(false);
  isDragOver = signal(false);
  private editId = '';

  files: UploadFile[] = [];
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  ngOnInit(): void {
    this.route.paramMap.subscribe(async (params) => {
      const id = params.get('id');
      if (id && id !== 'new') {
        this.isEditMode.set(true);
        this.editId = id;
        try {
          const q = await this.api.inquiries.findOne(Number(id));
          this.title = q.title || '';
          this.content = q.body || '';
        } catch (e) {
          console.error('문의 로드 실패:', e);
        }
      } else {
        this.isEditMode.set(false);
      }
    });
  }

  removeFile(index: number): void {
    this.files = this.files.filter((_, i) => i !== index);
  }

  removeAllFiles(): void {
    this.files = [];
  }

  onFileSelect(): void {
    this.fileInput?.nativeElement?.click();
  }

  onFileInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.addFiles(Array.from(input.files));
    }
    input.value = '';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
    if (event.dataTransfer?.files) {
      this.addFiles(Array.from(event.dataTransfer.files));
    }
  }

  private async addFiles(newFiles: File[]): Promise<void> {
    for (const file of newFiles) {
      if (this.files.length >= this.maxFiles) break;
      if (file.name.toLowerCase().endsWith('.zip')) continue;
      if (file.size > MAX_FILE_SIZE) continue;

      const ext = file.name.includes('.') ? file.name.split('.').pop() || '' : '';
      const entry: UploadFile = {
        name: file.name,
        ext,
        size: this.formatSize(file.size),
        sizeBytes: file.size,
        mimeType: file.type || 'application/octet-stream',
        status: 'uploading',
        file,
      };
      this.files = [...this.files, entry];
      this.cdr.detectChanges();

      try {
        const result = await this.api.uploadFile(file, 'inquiries');
        entry.url = result.url;
        entry.status = 'done';
      } catch {
        entry.status = 'error';
      }
      // 상태 변경 후 새 배열 참조로 변경 감지 트리거
      this.files = [...this.files];
      this.cdr.detectChanges();
    }
  }

  private formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  }

  goToList(): void {
    this.router.navigate(['/customer-center']);
  }

  async onSubmit(): Promise<void> {
    if (!this.title.trim() || !this.content.trim()) return;

    const uploading = this.files.some(f => f.status === 'uploading');
    if (uploading) return;

    const uploadedFiles = this.files
      .filter(f => f.status === 'done' && f.url)
      .map(f => ({
        name: f.name,
        url: f.url ?? '',
        size: f.sizeBytes,
        mimeType: f.mimeType,
      }));

    try {
      await this.api.inquiries.create({
        title: this.title,
        body: this.content,
        ...(uploadedFiles.length > 0 ? { files: uploadedFiles } : {}),
      });
      this.router.navigate(['/customer-center']);
    } catch (e) {
      console.error('문의 등록 실패:', e);
    }
  }
}
