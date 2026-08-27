import { Component, inject, signal, OnInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastService } from '../../shared/toast/toast.service';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'adm-notice-register',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notice-register.page.html',
  styleUrl: './notice-register.page.css',
})
export class NoticeRegisterPage implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private location = inject(Location);
  private toast = inject(ToastService);
  private api = inject(ApiService);

  isEditMode = signal(false);
  editId = signal<number | null>(null);

  @ViewChild('editorContent', { static: false }) editorContent!: ElementRef<HTMLDivElement>;

  basicInfoOpen = signal(true);
  attachmentOpen = signal(true);

  toggleBasicInfo(): void { this.basicInfoOpen.update(v => !v); }
  toggleAttachment(): void { this.attachmentOpen.update(v => !v); }

  pinned = signal('고정');
  status = signal('노출');
  title = signal('');
  content = signal('');

  showPinnedDropdown = signal(false);
  showStatusDropdown = signal(false);

  pinnedOptions = ['고정', '고정해제'];
  statusOptions = ['노출', '숨김'];

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const id = Number(idParam);
      this.isEditMode.set(true);
      this.editId.set(id);
      this.loadNotice(id);
    }
  }

  async loadNotice(id: number): Promise<void> {
    try {
      const notice = await this.api.notices.findOne(id);
      this.pinned.set(notice.pinned ? '고정' : '고정해제');
      this.status.set(notice.status === 'HIDDEN' ? '숨김' : '노출');
      this.title.set(notice.title);
      this.content.set(notice.body || '');
      setTimeout(() => {
        if (this.editorContent) {
          this.editorContent.nativeElement.innerText = notice.body || '';
        }
      });
    } catch (e) {
      console.error('공지 로드 실패:', e);
    }
  }

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

  files = signal<{ name: string; size: string }[]>([]);

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

  triggerFileInput(): void {
    document.getElementById('noticeFileInput')?.click();
  }

  goBack(): void {
    this.location.back();
  }

  async onSubmit(): Promise<void> {
    if (!this.title()) {
      this.toast.error('제목을 입력해주세요.');
      return;
    }

    const body = {
      title: this.title(),
      body: this.editorContent?.nativeElement?.innerText || this.content(),
      pinned: this.pinned() === '고정',
      status: this.status() === '숨김' ? 'HIDDEN' : 'VISIBLE',
      type: 'BOOTCAMP',
    };

    try {
      if (this.isEditMode()) {
        await this.api.notices.update(this.editId()!, body);
        this.toast.success('수정 완료 되었습니다.');
      } else {
        await this.api.notices.create(body);
        this.toast.success('등록 완료 되었습니다.');
      }
      this.location.back();
    } catch (e: unknown) {
      this.toast.error(e instanceof Error ? e.message : '처리 실패');
    }
  }
}
