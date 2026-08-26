import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataGridComponent, GridColumn } from '../../components/data-grid/data-grid.component';

@Component({
  selector: 'adm-reports',
  standalone: true,
  imports: [CommonModule, DataGridComponent],
  templateUrl: './reports.page.html',
  styleUrl: './reports.page.css',
})
export class ReportsPage {
  activeTab = signal<'content' | 'comment'>('content');

  setTab(tab: 'content' | 'comment'): void {
    this.activeTab.set(tab);
  }

  // ===== 콘텐츠 신고 그리드 =====
  contentReportColumns: GridColumn[] = [
    { key: 'id', label: '순번', width: '60px' },
    { key: 'commentContent', label: '댓글내용' },
    { key: 'content', label: '내용' },
    { key: 'reporter', label: '신고자', width: '100px' },
    { key: 'reportedAt', label: '신고일시', width: '160px' },
  ];

  contentReportData = [
    { id: 1, commentContent: '이 작품 정말 별로에요', content: '부적절한 내용 포함', reporter: '홍길동', reportedAt: '2025-01-25 09:00' },
    { id: 2, commentContent: '저작권 침해 콘텐츠입니다', content: '저작권 침해 의심', reporter: '김영희', reportedAt: '2025-01-26 14:30' },
    { id: 3, commentContent: '광고성 댓글입니다', content: '스팸성 콘텐츠', reporter: '박지민', reportedAt: '2025-01-27 11:15' },
    { id: 4, commentContent: '허위 정보가 포함되어 있습니다', content: '허위 정보 게시', reporter: '이수진', reportedAt: '2025-01-28 16:22' },
    { id: 5, commentContent: '욕설이 포함된 댓글', content: '욕설 포함', reporter: '최민호', reportedAt: '2025-01-29 10:45' },
  ];

  // ===== 댓글 신고 그리드 =====
  commentReportColumns: GridColumn[] = [
    { key: 'id', label: '순번', width: '60px' },
    { key: 'commentContent', label: '댓글내용' },
    { key: 'content', label: '내용' },
    { key: 'reporter', label: '신고자', width: '100px' },
    { key: 'reportedAt', label: '신고일시', width: '160px' },
  ];

  commentReportData = [
    { id: 1, commentContent: '욕설이 포함된 댓글입니다', content: '욕설 및 비방', reporter: '고식혜', reportedAt: '2025-02-01 09:30' },
    { id: 2, commentContent: '스팸 광고 링크 포함', content: '스팸 광고', reporter: '홍길동', reportedAt: '2025-02-02 14:15' },
    { id: 3, commentContent: '부적절한 내용의 댓글', content: '부적절한 내용', reporter: '김영희', reportedAt: '2025-02-03 11:42' },
    { id: 4, commentContent: '개인정보가 노출된 댓글', content: '개인정보 노출', reporter: '박지민', reportedAt: '2025-02-04 16:00' },
  ];

  // ===== 자동 숨김 설정 드로어 =====
  showAutoHideDrawer = signal(false);
  reportCountValue = signal('');

  openAutoHideDrawer(): void {
    this.showAutoHideDrawer.set(true);
  }

  closeAutoHideDrawer(): void {
    this.showAutoHideDrawer.set(false);
  }

  onReportCountInput(event: Event): void {
    this.reportCountValue.set((event.target as HTMLInputElement).value);
  }

  submitAutoHide(): void {
    this.showAutoHideDrawer.set(false);
    // TODO: 자동 숨김 등록 로직
  }
}
