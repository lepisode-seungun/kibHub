import { Component, inject, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router } from '@angular/router';
import { ToastService } from '../../shared/toast/toast.service';

@Component({
  selector: 'adm-notice-register',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notice-register.page.html',
  styleUrl: './notice-register.page.css',
})
export class NoticeRegisterPage {
  private router = inject(Router);
  private location = inject(Location);
  private toast = inject(ToastService);

  // 아코디언 상태
  basicInfoOpen = signal(true);
  attachmentOpen = signal(true);

  toggleBasicInfo(): void { this.basicInfoOpen.update(v => !v); }
  toggleAttachment(): void { this.attachmentOpen.update(v => !v); }

  // 폼 데이터
  pinned = signal('고정');
  status = signal('노출');
  title = signal('');
  content = signal('');

  // 드롭다운
  showPinnedDropdown = signal(false);
  showStatusDropdown = signal(false);

  pinnedOptions = ['고정', '고정해제'];
  statusOptions = ['노출', '숨김'];

  selectPinned(value: string): void {
    this.pinned.set(value);
    this.showPinnedDropdown.set(false);
  }

  selectStatus(value: string): void {
    this.status.set(value);
    this.showStatusDropdown.set(false);
  }

  onTitleInput(event: Event): void {
    this.title.set((event.target as HTMLInputElement).value);
  }

  // 첨부파일
  files = signal<{ name: string; size: string }[]>([
    { name: '이미지.PNG', size: '10KB' },
    { name: '이미지.PNG', size: '10KB' },
    { name: '이미지.PNG', size: '10KB' },
  ]);

  removeFile(index: number): void {
    this.files.update(list => list.filter((_, i) => i !== index));
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    const newFiles = Array.from(input.files).map(f => ({
      name: f.name,
      size: f.size < 1024 * 1024
        ? `${(f.size / 1024).toFixed(0)}KB`
        : `${(f.size / (1024 * 1024)).toFixed(1)}MB`,
    }));
    this.files.update(list => [...list, ...newFiles]);
    input.value = '';
  }

  // 액션
  goBack(): void {
    this.location.back();
  }

  onSubmit(): void {
    if (!this.title()) {
      this.toast.error('제목을 입력해주세요.');
      return;
    }
    this.toast.success('등록 완료 되었습니다.');
    this.location.back();
  }
}
