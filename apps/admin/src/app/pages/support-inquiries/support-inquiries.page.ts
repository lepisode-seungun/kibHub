import { formatDate } from '../../shared/format-date';
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataGridComponent, GridColumn, GridRow } from '../../components/data-grid/data-grid.component';
import { ConfirmDialogComponent, DialogDetailRow } from '../../components/confirm-dialog/confirm-dialog.component';
import { INQUIRY_STATUS_BADGES } from '../../shared/badge-styles';
import { ToastService } from '../../shared/toast/toast.service';
import { ApiService } from '../../services/api.service';
import { Inquiry, InquiryRow } from '../../shared/types';

interface InquiryFileEntry {
  id: number;
  name: string;
  url: string;
  size?: number;
  mimeType?: string;
}

function toInquiryRow(i: Inquiry): InquiryRow {
  return {
    id: i.id,
    status: i.status === 'COMPLETED' ? '완료' : '대기',
    title: i.title,
    content: i.body,
    author: i.author?.nickname || i.author?.name || '',
    createdAt: formatDate(i.createdAt),
    reply: i.reply || '',
    files: ((i as unknown as { files?: InquiryFileEntry[] }).files || []).map((f: InquiryFileEntry) => ({
      id: f.id,
      name: f.name,
      url: f.url,
      size: f.size || 0,
      mimeType: f.mimeType || '',
    })),
  };
}

@Component({
  selector: 'adm-support-inquiries',
  standalone: true,
  imports: [CommonModule, DataGridComponent, ConfirmDialogComponent],
  templateUrl: './support-inquiries.page.html',
  styleUrl: './support-inquiries.page.css',
})
export class SupportInquiriesPage implements OnInit {
  private toast = inject(ToastService);
  private api = inject(ApiService);

  columns: GridColumn[] = [
    { key: 'id', label: '순번', width: '72px' },
    { key: 'status', label: '상태', width: '80px', badge: 'status', badgeStyles: INQUIRY_STATUS_BADGES },
    { key: 'title', label: '제목' },
    { key: 'author', label: '작성자', width: '120px' },
    { key: 'createdAt', label: '등록일시', width: '160px' },
  ];

  inquiries = signal<InquiryRow[]>([]);

  showDeleteDialog = signal(false);
  deleteTarget = signal<InquiryRow | null>(null);
  deleteDialogDetails = signal<DialogDetailRow[]>([]);

  drawerOpen = signal(false);
  drawerTarget = signal<InquiryRow | null>(null);
  drawerReply = signal('');

  ngOnInit(): void {
    this.loadInquiries();
  }

  async loadInquiries(): Promise<void> {
    try {
      const data = await this.api.inquiries.findAll();
      this.inquiries.set(data.map(toInquiryRow));
    } catch (e) {
      console.error('문의 로드 실패:', e);
    }
  }

  getContextMenuItems = (_row: GridRow): string[] => ['답변', '삭제'];

  onRowClick(gridRow: GridRow): void {
    const row = gridRow as unknown as InquiryRow;
    this.openReplyDrawer(row);
  }

  onContextMenu(event: { action: string; row: GridRow }): void {
    const row = event.row as unknown as InquiryRow;
    if (event.action === '답변') this.openReplyDrawer(row);
    else if (event.action === '삭제') this.openDeleteDialog(row);
  }

  private openReplyDrawer(row: InquiryRow): void {
    this.drawerTarget.set(row);
    this.drawerReply.set(row.reply || '');
    this.drawerOpen.set(true);
  }

  closeDrawer(): void { this.drawerOpen.set(false); }

  updateReply(value: string): void { this.drawerReply.set(value); }

  async submitReply(): Promise<void> {
    const target = this.drawerTarget();
    const reply = this.drawerReply();
    if (!reply.trim()) { this.toast.error('답변을 입력해주세요.'); return; }

    try {
      await this.api.inquiries.reply(target!.id, { reply });
      this.toast.success('답변이 등록되었습니다.');
      this.drawerOpen.set(false);
      await this.loadInquiries();
    } catch (e: unknown) {
      this.toast.error(e instanceof Error ? e.message : '답변 등록 실패');
    }
  }

  private openDeleteDialog(row: InquiryRow): void {
    this.deleteTarget.set(row);
    this.deleteDialogDetails.set([
      { label: '제목', value: row.title },
      { label: '작성자', value: row.author },
      { label: '등록일시', value: row.createdAt },
    ]);
    this.showDeleteDialog.set(true);
  }

  async onDeleteConfirm(): Promise<void> {
    const target = this.deleteTarget();
    if (target) {
      try {
        await this.api.inquiries.delete(target.id);
        this.toast.success('삭제 완료 되었습니다.');
        await this.loadInquiries();
      } catch (e: unknown) {
        this.toast.error(e instanceof Error ? e.message : '삭제 실패');
      }
    }
    this.showDeleteDialog.set(false);
    this.deleteTarget.set(null);
  }

  onDeleteCancel(): void {
    this.showDeleteDialog.set(false);
    this.deleteTarget.set(null);
  }

  async downloadFile(file: { name: string; url: string }): Promise<void> {
    if (!file.url) return;
    try {
      const response = await fetch(file.url);
      const blob = await response.blob();
      if ('showSaveFilePicker' in window) {
        const ext = file.name.includes('.') ? file.name.split('.').pop() || '' : '';
        const handle = await (window as unknown as { showSaveFilePicker: (opts: { suggestedName: string; types: { description: string; accept: Record<string, string[]> }[] }) => Promise<FileSystemFileHandle> }).showSaveFilePicker({
          suggestedName: file.name,
          types: ext ? [{ description: file.name, accept: { [blob.type || 'application/octet-stream']: [`.${ext}`] } }] : [],
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
      } else {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
      }
    } catch (e: unknown) {
      if (e instanceof DOMException && e.name === 'AbortError') return;
      const a = document.createElement('a');
      a.href = file.url;
      a.download = file.name;
      a.click();
    }
  }
}
