import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataGridComponent, GridColumn } from '../../components/data-grid/data-grid.component';
import { ApiService } from '../../services/api.service';
import { Report, ReportRow } from '../../shared/types';

function toReportRow(r: Report): ReportRow {
  return {
    id: r.id,
    commentContent: r.reason,
    content: r.reason,
    reporter: r.reporter?.nickname || r.reporter?.name || '',
    reportedAt: new Date(r.createdAt).toLocaleString('ko-KR'),
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
  activeTab = signal<'content' | 'comment'>('content');

  setTab(tab: 'content' | 'comment'): void {
    this.activeTab.set(tab);
  }

  ngOnInit(): void {
    this.loadReports();
  }

  async loadReports(): Promise<void> {
    try {
      const data = await this.api.reports.findAll();
      const contentReports: ReportRow[] = [];
      const commentReports: ReportRow[] = [];
      data.forEach((r: Report) => {
        const mapped = toReportRow(r);
        if (r.type === 'CONTENT') contentReports.push(mapped);
        else commentReports.push(mapped);
      });
      this.contentReportData.set(contentReports);
      this.commentReportData.set(commentReports);
    } catch (e) {
      console.error('신고 목록 로드 실패:', e);
    }
  }

  contentReportColumns: GridColumn[] = [
    { key: 'id', label: '순번', width: '60px' },
    { key: 'commentContent', label: '댓글내용' },
    { key: 'content', label: '내용' },
    { key: 'reporter', label: '신고자', width: '100px' },
    { key: 'reportedAt', label: '신고일시', width: '160px' },
  ];

  contentReportData = signal<ReportRow[]>([]);

  commentReportColumns: GridColumn[] = [
    { key: 'id', label: '순번', width: '60px' },
    { key: 'commentContent', label: '댓글내용' },
    { key: 'content', label: '내용' },
    { key: 'reporter', label: '신고자', width: '100px' },
    { key: 'reportedAt', label: '신고일시', width: '160px' },
  ];

  commentReportData = signal<ReportRow[]>([]);

  showAutoHideDrawer = signal(false);
  reportCountValue = signal('');

  openAutoHideDrawer(): void { this.showAutoHideDrawer.set(true); }
  closeAutoHideDrawer(): void { this.showAutoHideDrawer.set(false); }

  onReportCountInput(event: Event): void {
    this.reportCountValue.set((event.target as HTMLInputElement).value);
  }

  submitAutoHide(): void { this.showAutoHideDrawer.set(false); }
}
