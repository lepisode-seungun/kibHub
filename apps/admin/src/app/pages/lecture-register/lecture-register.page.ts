import { Component, signal, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../shared/toast/toast.service';
import { TextEditorComponent } from '../../components/text-editor/text-editor.component';
import { Lecture } from '../../shared/types';

@Component({
  selector: 'adm-lecture-register',
  standalone: true,
  imports: [CommonModule, TextEditorComponent],
  templateUrl: './lecture-register.page.html',
  styleUrl: './lecture-register.page.css',
})
export class LectureRegisterPage {
  private location = inject(Location);
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);
  private toast = inject(ToastService);

  courseId = 0;

  constructor() {
    this.route.paramMap.subscribe((params) => {
      this.courseId = Number(params.get('id')) || 0;
    });
  }

  // 아코디언
  basicInfoOpen = signal(true);
  fileUploadOpen = signal(true);

  toggleBasicInfo(): void { this.basicInfoOpen.update(v => !v); }
  toggleFileUpload(): void { this.fileUploadOpen.update(v => !v); }

  // 폼 필드
  category = signal('');
  lectureName = signal('');
  videoUrl = signal('');
  editorContent = signal('');

  // 썸네일 파일
  thumbnailFile = signal<{ name: string; size: string; previewUrl: string } | null>(null);
  thumbnailUploadedUrl = signal('');
  isThumbnailUploading = signal(false);

  async onThumbnailSelect(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (!file.type.startsWith('image/')) {
        this.toast.error('이미지 파일만 업로드 가능합니다.');
        return;
      }
      const sizeKB = (file.size / 1024).toFixed(0) + 'KB';
      const previewUrl = URL.createObjectURL(file);
      this.thumbnailFile.set({ name: file.name, size: sizeKB, previewUrl });

      // 실제 서버 업로드
      try {
        this.isThumbnailUploading.set(true);
        const uploaded = await this.api.uploadFile(file, 'thumbnails');
        this.thumbnailUploadedUrl.set(uploaded.url);
      } catch {
        this.toast.error('썸네일 업로드에 실패했습니다.');
        this.thumbnailFile.set(null);
        this.thumbnailUploadedUrl.set('');
      } finally {
        this.isThumbnailUploading.set(false);
        input.value = '';
      }
    }
  }

  removeThumbnail(): void {
    const current = this.thumbnailFile();
    if (current?.previewUrl) URL.revokeObjectURL(current.previewUrl);
    this.thumbnailFile.set(null);
    this.thumbnailUploadedUrl.set('');
  }

  // 학습 자료 (다중)
  materialFiles = signal<{ name: string; size: string }[]>([]);

  onMaterialSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const newFiles = Array.from(input.files).map(f => ({
        name: f.name,
        size: (f.size / 1024).toFixed(0) + 'KB',
      }));
      this.materialFiles.update(prev => [...prev, ...newFiles]);
    }
  }

  removeMaterial(index: number): void {
    this.materialFiles.update(prev => prev.filter((_, i) => i !== index));
  }


  // 액션
  cancel(): void {
    this.location.back();
  }

  isSubmitting = signal(false);

  async submit(): Promise<void> {
    if (this.isSubmitting()) return;
    this.isSubmitting.set(true);
    try {
      await this.api.lectures.create(this.courseId, {
        title: this.lectureName(),
        category: this.category(),
        videoUrl: this.videoUrl(),
        content: this.editorContent(),
        thumbnail: this.thumbnailUploadedUrl(),
      } as Partial<Lecture>);
      this.toast.success('등록 완료 되었습니다.');
      this.location.back();
    } catch (err) {
      console.error('강의 등록 실패:', err);
      this.toast.error('등록에 실패했습니다.');
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
