import { Component, signal, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../shared/toast/toast.service';
import { TextEditorComponent } from '../../components/text-editor/text-editor.component';

@Component({
  selector: 'adm-assignment-register',
  standalone: true,
  imports: [CommonModule, TextEditorComponent],
  templateUrl: './assignment-register.page.html',
  styleUrl: './assignment-register.page.css',
})
export class AssignmentRegisterPage {
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
  assignmentName = signal('');
  deadlineStart = signal('');
  deadlineEnd = signal('');
  videoUrl = signal('');
  editorContent = signal('');

  // 썸네일
  thumbnailFile = signal<{ name: string; size: string; previewUrl: string } | null>(null);

  onThumbnailSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const previewUrl = URL.createObjectURL(file);
      this.thumbnailFile.set({ name: file.name, size: (file.size / 1024).toFixed(0) + 'KB', previewUrl });
    }
  }

  removeThumbnail(): void {
    const current = this.thumbnailFile();
    if (current?.previewUrl) URL.revokeObjectURL(current.previewUrl);
    this.thumbnailFile.set(null);
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
  cancel(): void { this.location.back(); }

  isSubmitting = signal(false);

  async submit(): Promise<void> {
    if (this.isSubmitting()) return;
    if (this.deadlineStart() && this.deadlineEnd() && this.deadlineStart() > this.deadlineEnd()) {
      this.toast.error('시작일은 종료일보다 이후일 수 없습니다.');
      return;
    }
    this.isSubmitting.set(true);
    try {
      await this.api.assignments.create(this.courseId, {
        title: this.assignmentName(),
        content: this.editorContent(),
        videoUrl: this.videoUrl(),
        dueDate: this.deadlineStart() || undefined,
        dueDateEnd: this.deadlineEnd() || undefined,
      } as any);
      this.toast.success('등록 완료 되었습니다.');
      this.location.back();
    } catch (err) {
      console.error('과제 등록 실패:', err);
      this.toast.error('등록에 실패했습니다.');
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
