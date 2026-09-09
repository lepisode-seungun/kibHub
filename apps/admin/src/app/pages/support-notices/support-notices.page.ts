import { formatDate } from '../../shared/format-date';
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DataGridComponent, GridColumn, GridRow } from '../../components/data-grid/data-grid.component';
import { ConfirmDialogComponent, DialogDetailRow } from '../../components/confirm-dialog/confirm-dialog.component';
import { CONTENT_STATUS_BADGES } from '../../shared/badge-styles';
import { ToastService } from '../../shared/toast/toast.service';
import { ApiService } from '../../services/api.service';
import { Notice, NoticeRow } from '../../shared/types';

function toNoticeRow(n: Notice): NoticeRow {
  return {
    id: n.id,
    pinned: n.pinned ? '📌' : '',
    status: n.status === 'HIDDEN' ? '숨김' : '노출',
    title: n.title,
    author: n.author?.nickname || n.author?.name || '관리자',
    createdAt: formatDate(n.createdAt),
  };
}

@Component({
  selector: 'adm-support-notices',
  standalone: true,
  imports: [CommonModule, DataGridComponent, ConfirmDialogComponent],
  templateUrl: './support-notices.page.html',
  styleUrl: './support-notices.page.css',
})
export class SupportNoticesPage implements OnInit {
  private router = inject(Router);
  private toast = inject(ToastService);
  private api = inject(ApiService);

  columns: GridColumn[] = [
    { key: 'id', label: '순번', width: '72px' },
    { key: 'pinned', label: '고정', width: '72px' },
    { key: 'status', label: '상태', width: '80px', badge: 'status', badgeStyles: CONTENT_STATUS_BADGES },
    { key: 'title', label: '제목' },
    { key: 'author', label: '작성자', width: '120px' },
    { key: 'createdAt', label: '등록일시', width: '160px' },
  ];

  notices = signal<NoticeRow[]>([]);

  showDeleteDialog = signal(false);
  deleteTarget = signal<NoticeRow | null>(null);
  deleteDialogDetails = signal<DialogDetailRow[]>([]);

  ngOnInit(): void {
    this.loadNotices();
  }

  async loadNotices(): Promise<void> {
    try {
      const data = await this.api.notices.findAll({ type: 'SUPPORT' });
      this.notices.set(data.map(toNoticeRow));
    } catch (e) {
      console.error('공지 로드 실패:', e);
    }
  }

  getContextMenuItems = (gridRow: GridRow): string[] => {
    const row = gridRow as unknown as NoticeRow;
    const statusLabel = row.status === '노출' ? '숨김' : '노출';
    const pinnedLabel = row.pinned ? '고정해제' : '고정';
    return [statusLabel, pinnedLabel, '수정', '삭제'];
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onRowClick(_row: GridRow): void { /* no-op */ }

  onRegister(): void {
    this.router.navigate(['/support/notices/new']);
  }

  async onContextMenu(event: { action: string; row: GridRow }): Promise<void> {
    const row = event.row as unknown as NoticeRow;
    const { action } = event;
    switch (action) {
      case '숨김':
      case '노출':
        try {
          await this.api.notices.update(row.id, { status: row.status === '노출' ? 'HIDDEN' : 'VISIBLE' });
          this.toast.success(row.status === '노출' ? '숨김 처리 되었습니다.' : '노출 처리 되었습니다.');
          await this.loadNotices();
        } catch (e: unknown) { this.toast.error(e instanceof Error ? e.message : '처리 실패'); }
        break;
      case '고정해제':
      case '고정':
        try {
          await this.api.notices.update(row.id, { pinned: !row.pinned });
          this.toast.success(row.pinned ? '고정 해제 되었습니다.' : '고정 되었습니다.');
          await this.loadNotices();
        } catch (e: unknown) { this.toast.error(e instanceof Error ? e.message : '처리 실패'); }
        break;
      case '수정':
        this.router.navigate([`/support/notices/${row.id}/edit`]);
        break;
      case '삭제':
        this.openDeleteDialog(row);
        break;
    }
  }

  private openDeleteDialog(row: NoticeRow): void {
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
        await this.api.notices.delete(target.id);
        this.toast.success('삭제 완료 되었습니다.');
        await this.loadNotices();
      } catch (e: unknown) { this.toast.error(e instanceof Error ? e.message : '삭제 실패'); }
    }
    this.showDeleteDialog.set(false);
    this.deleteTarget.set(null);
  }

  onDeleteCancel(): void {
    this.showDeleteDialog.set(false);
    this.deleteTarget.set(null);
  }
}
