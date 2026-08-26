import { Component, signal, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ToastService } from '../../shared/toast/toast.service';

@Component({
  selector: 'adm-lecture-register',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lecture-register.page.html',
  styleUrl: './lecture-register.page.css',
})
export class LectureRegisterPage {
  private location = inject(Location);
  private toast = inject(ToastService);

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
  thumbnailFile = signal<{ name: string; size: string } | null>(null);

  onThumbnailSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const sizeKB = (file.size / 1024).toFixed(0) + 'KB';
      this.thumbnailFile.set({ name: file.name, size: sizeKB });
    }
  }

  removeThumbnail(): void {
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

  // ===== 카테고리 관리 드로어 =====
  categoryDrawerOpen = signal(false);
  categories = signal(['작화', '스토리', '연출', '채색', '배경']);
  editingIndex = signal<number | null>(null);
  editingValue = signal('');
  newCategoryValue = signal('');
  showAddRow = signal(false);

  openCategoryDrawer(): void { this.categoryDrawerOpen.set(true); }
  closeCategoryDrawer(): void {
    this.categoryDrawerOpen.set(false);
    this.editingIndex.set(null);
    this.showAddRow.set(false);
    this.contextMenuIndex.set(null);
  }

  // 우클릭 컨텍스트 메뉴
  contextMenuIndex = signal<number | null>(null);
  contextMenuPos = signal({ x: 0, y: 0 });

  onCategoryContextMenu(event: MouseEvent, index: number): void {
    event.preventDefault();
    this.contextMenuIndex.set(index);
    this.contextMenuPos.set({ x: event.offsetX, y: event.offsetY });
  }

  closeContextMenu(): void {
    this.contextMenuIndex.set(null);
  }

  onContextAction(action: string, index: number): void {
    this.contextMenuIndex.set(null);
    if (action === 'edit') {
      this.startEdit(index);
    } else if (action === 'delete') {
      this.deleteCategory(index);
    }
  }

  startEdit(index: number): void {
    this.contextMenuIndex.set(null);
    this.editingIndex.set(index);
    this.editingValue.set(this.categories()[index]);
  }

  saveEdit(): void {
    const idx = this.editingIndex();
    if (idx !== null && this.editingValue().trim()) {
      this.categories.update(cats => cats.map((c, i) => i === idx ? this.editingValue().trim() : c));
      this.toast.success('수정 완료 되었습니다.');
    }
    this.editingIndex.set(null);
  }

  deleteCategory(index: number): void {
    // TODO: 실제 서버에서 카테고리에 등록된 강의 여부 체크
    const hasCourses = index < 2; // 샘플: 첫 2개는 강의가 있다고 가정
    if (hasCourses) {
      this.toast.error('[삭제 불가] 카테고리에 등록된 강의가 있는 경우 삭제 불가합니다.');
      this.editingIndex.set(null);
      return;
    }
    this.categories.update(cats => cats.filter((_, i) => i !== index));
    this.editingIndex.set(null);
    this.toast.success('삭제 완료 되었습니다.');
  }

  toggleAddRow(): void {
    this.showAddRow.update(v => !v);
    this.newCategoryValue.set('');
  }

  addCategory(): void {
    if (this.newCategoryValue().trim()) {
      this.categories.update(cats => [...cats, this.newCategoryValue().trim()]);
      this.newCategoryValue.set('');
      this.showAddRow.set(false);
      this.toast.success('등록 완료 되었습니다.');
    }
  }

  // 액션
  cancel(): void {
    this.location.back();
  }

  submit(): void {
    // TODO: 등록 처리
    this.location.back();
  }
}
