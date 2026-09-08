import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ToastService } from '../../shared/toast/toast.service';
import { ApiService } from '../../services/api.service';
import { TextEditorComponent } from '../../components/text-editor/text-editor.component';

interface NoticeFileEntry {
  name: string;
  size: number;
  url?: string;
}

interface NoticeWithFiles {
  files?: NoticeFileEntry[];
}

interface UploadResponse {
  url: string;
}

interface NoticeSubmitBody {
  title: string;
  body: string;
  pinned: boolean;
  status: string;
  type?: string;
  files?: { name: string; url: string; size: number; mimeType: string }[];
}

@Component({
  selector: 'adm-support-notices-register',
  standalone: true,
  imports: [CommonModule, TextEditorComponent],
  templateUrl: './support-notices-register.page.html',
  styleUrl: './support-notices-register.page.css',
})
export class SupportNoticesRegisterPage implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private location = inject(Location);
  private toast = inject(ToastService);
  private api = inject(ApiService);
  private http = inject(HttpClient);

  isEditMode = signal(false);
  editId = signal<number | null>(null);

  editorHtml = signal('');

  basicInfoOpen = signal(true);
  attachmentOpen = signal(true);

  toggleBasicInfo(): void { this.basicInfoOpen.update(v => !v); }
  toggleAttachment(): void { this.attachmentOpen.update(v => !v); }

  pinned = signal('고정해제');
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
      // 기존 첨부파일 로드
      const noticeWithFiles = notice as typeof notice & NoticeWithFiles;
      if (noticeWithFiles.files && noticeWithFiles.files.length > 0) {
        this.files.set(noticeWithFiles.files.map((f: NoticeFileEntry) => ({
          name: f.name,
          size: f.size < 1024 * 1024
            ? `${(f.size / 1024).toFixed(0)}KB`
            : `${(f.size / (1024 * 1024)).toFixed(1)}MB`,
          url: f.url || '',
        })));
      }
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

  onEditorChange(html: string): void {
    this.editorHtml.set(html);
  }

  files = signal<{ name: string; size: string; file?: File; url?: string }[]>([]);

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
      file: f,
      url: this.isImageFile(f.name) ? URL.createObjectURL(f) : '',
    }));
    this.files.update(list => [...list, ...newFiles]);
    input.value = '';
  }

  private isImageFile(name: string): boolean {
    return /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(name);
  }

  triggerFileInput(): void {
    document.getElementById('supportNoticeFileInput')?.click();
  }

  goBack(): void {
    this.location.back();
  }

  private async uploadFiles(): Promise<{ name: string; url: string; size: number; mimeType: string }[]> {
    const filesToUpload = this.files().filter(f => f.file);
    if (filesToUpload.length === 0) return [];

    const results: { name: string; url: string; size: number; mimeType: string }[] = [];
    for (const f of filesToUpload) {
      const fileToUpload = f.file;
      if (!fileToUpload) continue;
      const formData = new FormData();
      formData.append('file', fileToUpload);
      formData.append('folder', 'notices');
      const res = await firstValueFrom(
        this.http.post<UploadResponse>('/api/upload', formData, { withCredentials: true })
      );
      results.push({
        name: fileToUpload.name,
        url: res.url,
        size: fileToUpload.size,
        mimeType: fileToUpload.type || '',
      });
    }
    return results;
  }

  async onSubmit(): Promise<void> {
    if (!this.title()) {
      this.toast.error('제목을 입력해주세요.');
      return;
    }

    try {
      const uploadedFiles = await this.uploadFiles();

      const body: NoticeSubmitBody = {
        title: this.title(),
        body: this.editorHtml() || this.content(),
        pinned: this.pinned() === '고정',
        status: this.status() === '숨김' ? 'HIDDEN' : 'VISIBLE',
      };

      // type은 신규 등록 시에만 설정
      if (!this.isEditMode()) {
        body.type = 'SUPPORT';
      }

      if (uploadedFiles.length > 0) {
        body.files = uploadedFiles;
      }

      if (this.isEditMode()) {
        await this.api.notices.update(this.editId() ?? 0, body);
        this.toast.success('수정 완료 되었습니다.');
      } else {
        await this.api.notices.create(body as unknown as import('../../shared/types').CreateNoticeDto);
        this.toast.success('등록 완료 되었습니다.');
      }
      this.location.back();
    } catch (e: unknown) {
      this.toast.error(e instanceof Error ? e.message : '처리 실패');
    }
  }
}
