import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ApiService } from '../../services/api.service';
import { isImageFile as _isImageFile, downloadFile as _downloadFile } from '../../utils/file.utils';

interface AttachFile {
  id: number;
  name: string;
  url: string;
  size: number;
  mimeType: string;
}

@Component({
  selector: 'app-cc-notice-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './cc-notice-detail.page.html',
  styleUrl: './cc-notice-detail.page.css',
})
export class CcNoticeDetailPage implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);
  private sanitizer = inject(DomSanitizer);

  noticeId = '';

  isPinned = signal(false);
  noticeTitle = signal('');
  noticeDate = signal('');
  noticeContent = signal<SafeHtml>('');
  noticeImages = signal<string[]>([]);

  attachFiles = signal<AttachFile[]>([]);

  ngOnInit(): void {
    this.route.paramMap.subscribe(async (params) => {
      this.noticeId = params.get('id') || '';
      if (this.noticeId) {
        try {
          const notice = await this.api.notices.findOne(Number(this.noticeId));
          this.noticeTitle.set(notice.title || '');
          this.noticeDate.set(notice.createdAt ? new Date(notice.createdAt).toLocaleDateString('ko-KR') : '');
          this.noticeContent.set(this.sanitizer.bypassSecurityTrustHtml(notice.body || ''));
          this.isPinned.set(notice.pinned || false);
          // 이미지 로드
          const ext = notice as unknown as { images?: string[]; files?: AttachFile[] };
          this.noticeImages.set((ext.images || []).filter((img) => !!img));
          // 첨부파일 로드
          this.attachFiles.set((ext.files || []).map((f) => ({
            id: f.id,
            name: f.name || '',
            url: f.url || '',
            size: f.size || 0,
            mimeType: f.mimeType || '',
          })));
        } catch {
          // 없으면 목록으로
          this.router.navigate(['/customer-center']);
        }
      }
    });
  }

  goToList(): void {
    this.router.navigate(['/customer-center']);
  }

  onDownloadFile(file: AttachFile): void {
    _downloadFile(file.url, file.name);
  }

  isImageFile(file: AttachFile): boolean {
    return _isImageFile(file);
  }
}
