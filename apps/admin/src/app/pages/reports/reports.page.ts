import { formatDate } from '../../shared/format-date';
import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataGridComponent, GridColumn } from '../../components/data-grid/data-grid.component';
import { ToastService } from '../../shared/toast/toast.service';
import { ApiService } from '../../services/api.service';
import { Report } from '../../shared/types';

const CONTENT_AUTO_HIDE_KEY = 'autoHideContentReportCount';
const COMMENT_AUTO_HIDE_KEY = 'autoHideCommentReportCount';

interface ContentReportRow {
  [key: string]: unknown;
  id: number;
  contentTitle: string;
  reason: string;
  reporter: string;
  reportedAt: string;
}

interface CommentReportRow {
  [key: string]: unknown;
  id: number;
  commentContent: string;
  content: string;
  reporter: string;
  reportedAt: string;
}

function toContentReportRow(r: Report): ContentReportRow {
  return {
    id: r.id,
    contentTitle: r.targetTitle || '-',
    reason: r.reason || '-',
    reporter: r.reporter?.nickname || r.reporter?.name || '',
    reportedAt: formatDate(r.createdAt),
  };
}

function toCommentReportRow(r: Report): CommentReportRow {
  return {
    id: r.id,
    commentContent: r.targetBody || '-',
    content: r.reason || '-',
    reporter: r.reporter?.nickname || r.reporter?.name || '',
    reportedAt: formatDate(r.createdAt),
  };
}

@Component({
  selector: 'adm-reports',
  standalone: true,
  imports: [CommonModule, DataGridComponent],
  templateUrl: './reports.page.html',
  styleUrl: './reports.page.css',
})
export class ReportsPage implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  activeTab = signal<'content' | 'comment'>('content');

  setTab(tab: 'content' | 'comment'): void {
    this.activeTab.set(tab);
  }

  ngOnInit(): void {
    this.loadReports();
  }

  async loadReports(): Promise<void> {
    try {
      const raw = await this.api.reports.findAll();
      const data: Report[] = Array.isArray(raw) ? raw : ((raw as { data?: Report[] }).data || []);
      const contentReports: ContentReportRow[] = [];
      const commentReports: CommentReportRow[] = [];
      data.forEach((r: Report) => {
        if (r.type === 'CONTENT') contentReports.push(toContentReportRow(r));
        else commentReports.push(toCommentReportRow(r));
      });
      this.contentReportData.set(contentReports);
      this.commentReportData.set(commentReports);
    } catch (e) {
      console.error('신고 목록 로드 실패:', e);
    }
  }

  contentReportColumns: GridColumn[] = [
    { key: 'id', label: '순번', width: '60px' },
    { key: 'contentTitle', label: '콘텐츠 제목' },
    { key: 'reason', label: '신고 사유' },
    { key: 'reporter', label: '신고자', width: '100px' },
    { key: 'reportedAt', label: '신고일시', width: '160px' },
  ];

  contentReportData = signal<ContentReportRow[]>([]);

  commentReportColumns: GridColumn[] = [
    { key: 'id', label: '순번', width: '60px' },
    { key: 'commentContent', label: '댓글내용' },
    { key: 'content', label: '내용' },
    { key: 'reporter', label: '신고자', width: '100px' },
    { key: 'reportedAt', label: '신고일시', width: '160px' },
  ];

  commentReportData = signal<CommentReportRow[]>([]);

  // ===== 자동 숨김 설정 드로어 =====
  showAutoHideDrawer = signal(false);
  reportCountValue = signal('');

  /** 현재 활성 탭에 따라 올바른 설정 키 반환 */
  private get autoHideKey(): string {
    return this.activeTab() === 'content' ? CONTENT_AUTO_HIDE_KEY : COMMENT_AUTO_HIDE_KEY;
  }

  private get autoHideLabel(): string {
    return this.activeTab() === 'content' ? '콘텐츠' : '댓글';
  }

  async openAutoHideDrawer(): Promise<void> {
    try {
      const result = await this.api.siteSettings.get(this.autoHideKey);
      this.reportCountValue.set(result.value || '');
    } catch {
      this.reportCountValue.set('');
    }
    this.showAutoHideDrawer.set(true);
  }

  closeAutoHideDrawer(): void { this.showAutoHideDrawer.set(false); }

  onReportCountInput(event: Event): void {
    this.reportCountValue.set((event.target as HTMLInputElement).value);
  }

  async submitAutoHide(): Promise<void> {
    const val = this.reportCountValue().trim();
    if (!val || isNaN(Number(val)) || Number(val) < 1) {
      this.toast.error('1 이상의 숫자를 입력하세요.');
      return;
    }
    try {
      await this.api.siteSettings.set(this.autoHideKey, val);
      this.toast.success(`${this.autoHideLabel} 신고 ${val}회 이상 시 자동 숨김 설정이 저장되었습니다.`);
      this.showAutoHideDrawer.set(false);
    } catch (e: unknown) {
      this.toast.error(e instanceof Error ? e.message : '저장 실패');
    }
  }
}
