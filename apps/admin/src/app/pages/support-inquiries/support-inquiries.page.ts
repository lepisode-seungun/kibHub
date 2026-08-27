import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataGridComponent, GridColumn } from '../../components/data-grid/data-grid.component';
import { ConfirmDialogComponent, DialogDetailRow } from '../../components/confirm-dialog/confirm-dialog.component';
import { INQUIRY_STATUS_BADGES } from '../../shared/badge-styles';
import { ToastService } from '../../shared/toast/toast.service';
import { ApiService } from '../../services/api.service';
import { Inquiry, InquiryRow } from '../../shared/types';

function toInquiryRow(i: Inquiry): InquiryRow {
  return {
    id: i.id,
    status: i.status === 'COMPLETED' ? '완료' : '대기',
    title: i.title,
    content: i.body,
    author: i.author?.nickname || i.author?.name || '',
    createdAt: new Date(i.createdAt).toLocaleString('ko-KR'),
    reply: i.reply || '',
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

  getContextMenuItems = (_row: InquiryRow): string[] => ['답변', '삭제'];

  onRowClick(row: InquiryRow): void {
    this.openReplyDrawer(row);
  }

  onContextMenu(event: { action: string; row: InquiryRow }): void {
    const { action, row } = event;
    if (action === '답변') this.openReplyDrawer(row);
    else if (action === '삭제') this.openDeleteDialog(row);
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
}
