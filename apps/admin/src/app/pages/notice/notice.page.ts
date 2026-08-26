import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DataGridComponent, GridColumn } from '../../components/data-grid/data-grid.component';
import { CONTENT_STATUS_BADGES } from '../../shared/badge-styles';
import { ToastService } from '../../shared/toast/toast.service';

@Component({
  selector: 'adm-notice',
  standalone: true,
  imports: [CommonModule, DataGridComponent],
  templateUrl: './notice.page.html',
  styleUrl: './notice.page.css',
})
export class NoticePage {
  private router = inject(Router);
  private toast = inject(ToastService);

  searchQuery = '';

  onSearchInput(event: Event): void {
    this.searchQuery = (event.target as HTMLInputElement).value;
  }

  columns: GridColumn[] = [
    { key: 'id', label: '순번', width: '72px' },
    { key: 'pinned', label: '고정', width: '72px' },
    { key: 'status', label: '상태', width: '72px', badge: 'status', badgeStyles: CONTENT_STATUS_BADGES },
    { key: 'title', label: '제목' },
    { key: 'author', label: '작성자', width: '150px' },
    { key: 'createdAt', label: '등록일시', width: '150px' },
  ];

  notices = [
    { id: 1, pinned: '📌', status: '노출', title: '공지사항 제목 30자 이내', author: '고식혜', createdAt: '2025-01-15 13:00' },
    { id: 2, pinned: '📌', status: '노출', title: '공지사항 제목 30자 이내', author: '고식혜', createdAt: '2025-01-15 13:00' },
    { id: 3, pinned: '', status: '노출', title: '공지사항 제목 30자 이내', author: '고식혜', createdAt: '2025-01-15 13:00' },
    { id: 4, pinned: '', status: '노출', title: '공지사항 제목 30자 이내', author: '고식혜', createdAt: '2025-01-15 13:00' },
    { id: 5, pinned: '', status: '노출', title: '공지사항 제목 30자 이내', author: '고식혜', createdAt: '2025-01-15 13:00' },
    { id: 6, pinned: '', status: '노출', title: '공지사항 제목 30자 이내', author: '고식혜', createdAt: '2025-01-15 13:00' },
    { id: 7, pinned: '', status: '노출', title: '공지사항 제목 30자 이내', author: '고식혜', createdAt: '2025-01-15 13:00' },
  ];

  onRowClick(row: any): void {
    // TODO: navigate to notice detail
  }

  onRegister(): void {
    this.router.navigate(['/bootcamp/home/notices/new']);
  }

  onContextMenu(event: { action: string; row: any }): void {
    const { action, row } = event;
    switch (action) {
      case '숨김':
        this.notices = this.notices.map(n =>
          n.id === row.id ? { ...n, status: n.status === '숨김' ? '노출' : '숨김' } : n
        );
        this.toast.success(row.status === '노출' ? '숨김 처리 되었습니다.' : '노출 처리 되었습니다.');
        break;
      case '고정해제':
        this.notices = this.notices.map(n =>
          n.id === row.id ? { ...n, pinned: n.pinned ? '' : '📌' } : n
        );
        this.toast.success(row.pinned ? '고정 해제 되었습니다.' : '고정 되었습니다.');
        break;
      case '수정':
        // TODO: open edit drawer or navigate
        break;
      case '삭제':
        this.notices = this.notices.filter(n => n.id !== row.id);
        this.toast.success('삭제 완료 되었습니다.');
        break;
    }
  }
}
