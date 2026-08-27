import { Component, signal, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'adm-assignment-register',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './assignment-register.page.html',
  styleUrl: './assignment-register.page.css',
})
export class AssignmentRegisterPage {
  private location = inject(Location);

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
  thumbnailFile = signal<{ name: string; size: string } | null>(null);

  onThumbnailSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.thumbnailFile.set({ name: file.name, size: (file.size / 1024).toFixed(0) + 'KB' });
    }
  }

  removeThumbnail(): void { this.thumbnailFile.set(null); }

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
  submit(): void { this.location.back(); }
}
