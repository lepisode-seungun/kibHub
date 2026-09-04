import { formatDate } from '../../shared/format-date';
import { Component, signal, inject, OnInit, HostListener } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastService } from '../../shared/toast/toast.service';
import { ApiService } from '../../services/api.service';
import { isImageFile as _isImageFile, formatFileSize, downloadFile as _downloadFile } from '../../utils/file.utils';

interface NoticeFile {
  id: number;
  name: string;
  url: string;
  size: number;
  mimeType: string;
}

@Component({
  selector: 'adm-notice-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notice-detail.page.html',
  styleUrl: './notice-detail.page.css',
})
export class NoticeDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private toast = inject(ToastService);
  private api = inject(ApiService);

  // ?�코?�언
  basicInfoOpen = signal(true);
  contentOpen = signal(true);
  attachmentOpen = signal(true);

  toggleBasicInfo(): void { this.basicInfoOpen.update(v => !v); }
  toggleContent(): void { this.contentOpen.update(v => !v); }
  toggleAttachment(): void { this.attachmentOpen.update(v => !v); }

  // ?�보�?메뉴
  moreMenuOpen = signal(false);
  toggleMoreMenu(event: Event): void { event.stopPropagation(); this.moreMenuOpen.update(v => !v); }

  @HostListener('document:click')
  onDocumentClick(): void { this.moreMenuOpen.set(false); }

  // 공지 데이터
  noticeId = 0;
  notice = signal<any>(null);
  files = signal<NoticeFile[]>([]);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.noticeId = id;
      this.loadNotice(id);
    }
  }

  private async loadNotice(id: number): Promise<void> {
    try {
      const n = await this.api.notices.findOne(id);
      this.notice.set(n);
      this.files.set(
        ((n as any).files || []).map((f: any) => ({
          id: f.id,
          name: f.name,
          url: f.url,
          size: f.size || 0,
          mimeType: f.mimeType || '',
        }))
      );
    } catch (e) {
      console.error('공�? 로드 ?�패:', e);
    }
  }

  // ?�태 ?�시
  statusLabel(): string {
    const n = this.notice();
    return n?.status === 'HIDDEN' ? '?��?' : '?�출';
  }

  pinnedLabel(): string {
    const n = this.notice();
    return n?.pinned ? '고정' : '고정?�제';
  }

  authorName(): string {
    const n = this.notice();
    return n?.author?.nickname || n?.author?.name || '관리자';
  }

  createdAtFormatted(): string {
    const n = this.notice();
    return n?.createdAt ? formatDate(n.createdAt) : '';
  }

  formatSize(size: number): string {
    return formatFileSize(size);
  }

  isImageFile(file: NoticeFile): boolean {
    return _isImageFile(file);
  }

  onDownloadFile(file: NoticeFile): void {
    _downloadFile(file.url, file.name);
  }

  // ?�션
  onEdit(): void {
    this.moreMenuOpen.set(false);
    this.router.navigate([`/bootcamp/home/notices/${this.noticeId}/edit`]);
  }

  async onToggleStatus(): Promise<void> {
    this.moreMenuOpen.set(false);
    const n = this.notice();
    if (!n) return;
    try {
      const newStatus = n.status === 'HIDDEN' ? 'VISIBLE' : 'HIDDEN';
      await this.api.notices.update(this.noticeId, { status: newStatus });
      this.toast.success(newStatus === 'HIDDEN' ? '?��? 처리 ?�었?�니??' : '?�출 처리 ?�었?�니??');
      await this.loadNotice(this.noticeId);
    } catch (e: any) {
      this.toast.error(e?.error?.message || '처리 ?�패');
    }
  }

  async onTogglePinned(): Promise<void> {
    this.moreMenuOpen.set(false);
    const n = this.notice();
    if (!n) return;
    try {
      await this.api.notices.update(this.noticeId, { pinned: !n.pinned });
      this.toast.success(n.pinned ? '고정 ?�제 ?�었?�니??' : '고정 ?�었?�니??');
      await this.loadNotice(this.noticeId);
    } catch (e: any) {
      this.toast.error(e?.error?.message || '처리 ?�패');
    }
  }

  // ??��
  showDeleteModal = signal(false);

  onDelete(): void {
    this.moreMenuOpen.set(false);
    this.showDeleteModal.set(true);
  }

  cancelDelete(): void {
    this.showDeleteModal.set(false);
  }

  async confirmDelete(): Promise<void> {
    try {
      await this.api.notices.delete(this.noticeId);
      this.toast.success('??�� ?�료 ?�었?�니??');
      this.location.back();
    } catch (e: any) {
      this.toast.error(e?.error?.message || '??�� ?�패');
    }
    this.showDeleteModal.set(false);
  }

  goBack(): void {
    this.location.back();
  }
}
