import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataGridComponent, GridColumn } from '../../components/data-grid/data-grid.component';
import { CONTENT_STATUS_BADGES } from '../../shared/badge-styles';

@Component({
  selector: 'adm-content-detail',
  standalone: true,
  imports: [CommonModule, DataGridComponent],
  templateUrl: './content-detail.page.html',
  styleUrl: './content-detail.page.css',
})
export class ContentDetailPage {
  section1Expanded = signal(true);
  section2Expanded = signal(true);
  section3Expanded = signal(true);
  section4Expanded = signal(true);
  moreMenuOpen = signal(false);
  moreMenu2Open = signal(false);

  // ===== 토스트 =====
  toastMessage = signal('');
  toastVisible = signal(false);
  private toastTimer: any;

  showToast(message: string): void {
    this.toastMessage.set(message);
    this.toastVisible.set(true);
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toastVisible.set(false);
    }, 3000);
  }

  toggleSection1(): void {
    this.section1Expanded.update(v => !v);
  }

  toggleSection2(): void {
    this.section2Expanded.update(v => !v);
  }

  toggleSection3(): void {
    this.section3Expanded.update(v => !v);
  }

  toggleSection4(): void {
    this.section4Expanded.update(v => !v);
  }

  toggleMoreMenu(event: Event): void {
    event.stopPropagation();
    this.moreMenuOpen.update(v => !v);
  }

  toggleMoreMenu2(event: Event): void {
    event.stopPropagation();
    this.moreMenu2Open.update(v => !v);
  }

  closeMoreMenu(): void {
    this.moreMenuOpen.set(false);
  }

  closeMoreMenu2(): void {
    this.moreMenu2Open.set(false);
  }

  onHide(): void {
    this.moreMenuOpen.set(false);
    this.moreMenu2Open.set(false);
    this.showToast('숨김 되었습니다.');
  }

  onDelete(): void {
    this.moreMenuOpen.set(false);
    this.moreMenu2Open.set(false);
  }

  // ===== 댓글 그리드 =====
  commentColumns: GridColumn[] = [
    { key: 'id', label: '순번', width: '60px' },
    { key: 'status', label: '상태', width: '72px', badge: 'status', badgeStyles: CONTENT_STATUS_BADGES },
    { key: 'type', label: '유형', width: '80px' },
    { key: 'content', label: '내용' },
    { key: 'author', label: '작성자', width: '100px' },
    { key: 'reports', label: '신고', width: '60px' },
    { key: 'likes', label: '좋아요', width: '70px' },
    { key: 'createdAt', label: '등록일시', width: '160px' },
  ];

  commentData = [
    { id: 1, status: '노출', type: '댓글', content: '좋은 내용이네요! 감사합니다.', author: '홍길동', reports: 0, likes: 3, createdAt: '2025-01-21 09:30' },
    { id: 2, status: '노출', type: '댓글', content: '많은 도움이 되었습니다.', author: '김영희', reports: 0, likes: 5, createdAt: '2025-01-22 14:15' },
    { id: 3, status: '숨김', type: '댓글', content: '추가 자료 부탁드립니다.', author: '박지민', reports: 2, likes: 0, createdAt: '2025-01-23 11:42' },
    { id: 4, status: '노출', type: '대댓글', content: '네 추가 자료 올려드리겠습니다.', author: '고예림', reports: 0, likes: 1, createdAt: '2025-01-23 15:00' },
    { id: 5, status: '노출', type: '댓글', content: '정말 유익한 콘텐츠입니다!', author: '이수진', reports: 0, likes: 8, createdAt: '2025-01-24 10:22' },
  ];

  // ===== 콘텐츠 신고내역 그리드 =====
  reportColumns: GridColumn[] = [
    { key: 'id', label: '순번', width: '60px' },
    { key: 'title', label: '콘텐츠 제목' },
    { key: 'content', label: '내용' },
    { key: 'reporter', label: '신고자', width: '100px' },
    { key: 'reportedAt', label: '신고일시', width: '160px' },
  ];

  reportData = [
    { id: 1, title: '콘텐츠 제목 30자 이내', content: '부적절한 내용이 포함되어 있습니다.', reporter: '홍길동', reportedAt: '2025-01-25 09:00' },
    { id: 2, title: '콘텐츠 제목 30자 이내', content: '저작권 침해 의심됩니다.', reporter: '김영희', reportedAt: '2025-01-26 14:30' },
    { id: 3, title: '콘텐츠 제목 30자 이내', content: '스팸성 콘텐츠입니다.', reporter: '박지민', reportedAt: '2025-01-27 11:15' },
  ];

  // ===== 댓글 상세 사이드 드로어 =====
  showCommentDrawer = signal(false);
  drawerKebabOpen = signal(false);
  selectedComment = signal<any>(null);

  // 드로어 신고 내역 그리드
  drawerReportColumns: GridColumn[] = [
    { key: 'title', label: '콘텐츠 제목' },
    { key: 'content', label: '내용' },
    { key: 'reporter', label: '신고자', width: '120px' },
    { key: 'reportedAt', label: '신고일시', width: '150px' },
  ];

  drawerReportData = [
    { title: '호롤롤롤롤로', content: '신고 내용', reporter: '고식혜', reportedAt: '2023-01-01 16:10' },
    { title: '호롤롤롤롤로', content: '신고 내용', reporter: '고식혜', reportedAt: '2023-01-01 16:10' },
    { title: '호롤롤롤롤로', content: '신고 내용', reporter: '고식혜', reportedAt: '2023-01-01 16:10' },
  ];

  openCommentDrawer(comment: any): void {
    this.selectedComment.set(comment);
    this.showCommentDrawer.set(true);
  }

  closeCommentDrawer(): void {
    this.showCommentDrawer.set(false);
    this.drawerKebabOpen.set(false);
  }

  toggleDrawerKebab(event: Event): void {
    event.stopPropagation();
    this.drawerKebabOpen.update(v => !v);
  }

  closeDrawerKebab(): void {
    this.drawerKebabOpen.set(false);
  }

  onDrawerHide(): void {
    this.drawerKebabOpen.set(false);
    this.showToast('숨김 되었습니다.');
  }

  onDrawerDelete(): void {
    this.drawerKebabOpen.set(false);
    this.showCommentDeleteDialog.set(true);
  }

  // ===== 콘텐츠 삭제 다이얼로그 =====
  showDeleteDialog = signal(false);

  openDeleteDialog(): void {
    this.moreMenuOpen.set(false);
    this.moreMenu2Open.set(false);
    this.showDeleteDialog.set(true);
  }

  closeDeleteDialog(): void {
    this.showDeleteDialog.set(false);
  }

  confirmDelete(): void {
    this.showDeleteDialog.set(false);
    this.showToast('삭제가 완료 되었습니다.');
  }

  // ===== 댓글 삭제 다이얼로그 =====
  showCommentDeleteDialog = signal(false);

  closeCommentDeleteDialog(): void {
    this.showCommentDeleteDialog.set(false);
  }

  confirmCommentDelete(): void {
    this.showCommentDeleteDialog.set(false);
    this.showCommentDrawer.set(false);
    this.showToast('삭제가 완료 되었습니다.');
  }
}
