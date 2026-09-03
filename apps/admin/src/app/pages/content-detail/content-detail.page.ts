import { formatDate } from '../../shared/format-date';
import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DataGridComponent, GridColumn } from '../../components/data-grid/data-grid.component';
import { CONTENT_STATUS_BADGES } from '../../shared/badge-styles';
import { ToastService } from '../../shared/toast/toast.service';
import { ApiService } from '../../services/api.service';
import { Content, Comment, CommentRow, ReportRow } from '../../shared/types';

@Component({
  selector: 'adm-content-detail',
  standalone: true,
  imports: [CommonModule, DataGridComponent],
  templateUrl: './content-detail.page.html',
  styleUrl: './content-detail.page.css',
})
export class ContentDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toast = inject(ToastService);
  private api = inject(ApiService);

  section1Expanded = signal(true);
  section2Expanded = signal(true);
  section3Expanded = signal(true);
  section4Expanded = signal(true);
  moreMenuOpen = signal(false);
  moreMenu2Open = signal(false);

  // ===== 토스트 =====
  toastMessage = signal('');
  toastVisible = signal(false);
  private toastTimer: ReturnType<typeof setTimeout> | undefined;

  showToast(message: string): void {
    this.toastMessage.set(message);
    this.toastVisible.set(true);
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => { this.toastVisible.set(false); }, 3000);
  }

  // ===== 콘텐츠 데이터 =====
  content = signal<Content | null>(null);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) this.loadContent(id);
  }

  async loadContent(id: number): Promise<void> {
    try {
      const c = await this.api.contents.findOne(id);
      this.content.set(c);
      const comments = await this.api.comments.findByContent(id);
      const rows: CommentRow[] = [];
      for (const cm of comments) {
        rows.push({
          id: cm.id,
          status: cm.status === 'VISIBLE' ? '노출' : '숨김',
          type: '댓글',
          content: cm.body,
          author: cm.author?.nickname || cm.author?.name || '',
          reports: cm.reportCount || 0,
          likes: cm.likeCount || 0,
          createdAt: formatDate(cm.createdAt),
          images: (cm as any).images || [],
        });
        for (const reply of ((cm as any).replies || [])) {
          rows.push({
            id: reply.id,
            status: reply.status === 'VISIBLE' ? '노출' : '숨김',
            type: '대댓글',
            content: reply.body,
            author: reply.author?.nickname || reply.author?.name || '',
            reports: reply.reportCount || 0,
            likes: reply.likeCount || 0,
            createdAt: formatDate(reply.createdAt),
            images: reply.images || [],
          });
        }
      }
      this.commentData.set(rows);

      // 콘텐츠 신고 내역 로드
      const reports = await this.api.reports.findAll({ type: 'CONTENT', targetId: String(id) });
      this.reportData.set(reports.map((r: any) => ({
        id: r.id,
        title: c.title || '-',
        commentContent: '',
        content: r.reason || '',
        reporter: r.reporter?.nickname || r.reporter?.name || '',
        reportedAt: formatDate(r.createdAt),
      })));
    } catch (e) {
      console.error('콘텐츠 상세 로드 실패:', e);
    }
  }

  toggleSection1(): void { this.section1Expanded.update(v => !v); }
  toggleSection2(): void { this.section2Expanded.update(v => !v); }
  toggleSection3(): void { this.section3Expanded.update(v => !v); }
  toggleSection4(): void { this.section4Expanded.update(v => !v); }

  toggleMoreMenu(event: Event): void { event.stopPropagation(); this.moreMenuOpen.update(v => !v); }
  toggleMoreMenu2(event: Event): void { event.stopPropagation(); this.moreMenu2Open.update(v => !v); }
  closeMoreMenu(): void { this.moreMenuOpen.set(false); }
  closeMoreMenu2(): void { this.moreMenu2Open.set(false); }

  async onHide(): Promise<void> {
    this.moreMenuOpen.set(false);
    this.moreMenu2Open.set(false);
    const c = this.content();
    if (c) {
      try {
        await this.api.contents.update(c.id, { status: 'HIDDEN' });
        this.toast.success('숨김 되었습니다.');
      } catch (e: unknown) { this.toast.error(e instanceof Error ? e.message : '처리 실패'); }
    }
  }

  onDelete(): void {
    this.moreMenuOpen.set(false);
    this.moreMenu2Open.set(false);
    this.openDeleteDialog();
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

  commentData = signal<CommentRow[]>([]);

  // ===== 콘텐츠 신고내역 그리드 =====
  reportColumns: GridColumn[] = [
    { key: 'id', label: '순번', width: '60px' },
    { key: 'title', label: '콘텐츠 제목' },
    { key: 'content', label: '내용' },
    { key: 'reporter', label: '신고자', width: '100px' },
    { key: 'reportedAt', label: '신고일시', width: '160px' },
    { key: 'delete', label: '', width: '50px', type: 'action' },
  ];

  reportData = signal<ReportRow[]>([]);

  // ===== 댓글 상세 사이드 드로어 =====
  showCommentDrawer = signal(false);
  drawerKebabOpen = signal(false);
  selectedComment = signal<CommentRow | null>(null);

  drawerReportColumns: GridColumn[] = [
    { key: 'content', label: '내용' },
    { key: 'reporter', label: '신고자', width: '120px' },
    { key: 'reportedAt', label: '신고일시', width: '150px' },
    { key: 'delete', label: '', width: '50px', type: 'action' },
  ];

  drawerReportData = signal<ReportRow[]>([]);

  async openCommentDrawer(comment: CommentRow): Promise<void> {
    this.selectedComment.set(comment);
    this.showCommentDrawer.set(true);
    // 해당 댓글의 신고 내역 로드
    try {
      const reports = await this.api.reports.findAll({ type: 'COMMENT', targetId: String(comment.id) });
      this.drawerReportData.set(reports.map((r: any) => ({
        id: r.id,
        commentContent: comment.content,
        content: r.reason || '',
        reporter: r.reporter?.nickname || r.reporter?.name || '',
        reportedAt: formatDate(r.createdAt),
      })));
    } catch (e) {
      console.error('신고 내역 로드 실패:', e);
      this.drawerReportData.set([]);
    }
  }

  closeCommentDrawer(): void {
    this.showCommentDrawer.set(false);
    this.drawerKebabOpen.set(false);
  }

  toggleDrawerKebab(event: Event): void { event.stopPropagation(); this.drawerKebabOpen.update(v => !v); }
  closeDrawerKebab(): void { this.drawerKebabOpen.set(false); }

  async onDrawerHide(): Promise<void> {
    this.drawerKebabOpen.set(false);
    const comment = this.selectedComment();
    if (comment) {
      try {
        await this.api.comments.update(comment.id, { status: 'HIDDEN' as any });
        this.toast.success('숨김 되었습니다.');
        const id = Number(this.route.snapshot.paramMap.get('id'));
        if (id) await this.loadContent(id);
        this.showCommentDrawer.set(false);
      } catch (e: unknown) {
        this.toast.error(e instanceof Error ? e.message : '처리 실패');
      }
    }
  }

  onDrawerDelete(): void {
    this.drawerKebabOpen.set(false);
    this.showCommentDeleteDialog.set(true);
  }

  // ===== 콘텐츠 삭제 =====
  showDeleteDialog = signal(false);

  openDeleteDialog(): void {
    this.moreMenuOpen.set(false);
    this.moreMenu2Open.set(false);
    this.showDeleteDialog.set(true);
  }

  closeDeleteDialog(): void { this.showDeleteDialog.set(false); }

  async confirmDelete(): Promise<void> {
    const c = this.content();
    if (c) {
      try {
        await this.api.contents.delete(c.id);
        this.toast.success('삭제가 완료 되었습니다.');
        this.router.navigate(['/content']);
      } catch (e: unknown) { this.toast.error(e instanceof Error ? e.message : '삭제 실패'); }
    }
    this.showDeleteDialog.set(false);
  }

  // ===== 댓글 삭제 =====
  showCommentDeleteDialog = signal(false);

  closeCommentDeleteDialog(): void { this.showCommentDeleteDialog.set(false); }

  async confirmCommentDelete(): Promise<void> {
    const comment = this.selectedComment();
    if (comment) {
      try {
        await this.api.comments.delete(comment.id);
        this.toast.success('삭제가 완료 되었습니다.');
        const id = Number(this.route.snapshot.paramMap.get('id'));
        if (id) await this.loadContent(id);
      } catch (e: unknown) { this.toast.error(e instanceof Error ? e.message : '삭제 실패'); }
    }
    this.showCommentDeleteDialog.set(false);
    this.showCommentDrawer.set(false);
  }

  // ===== 신고 삭제 =====
  async onReportDelete(event: { key: string; row: any }): Promise<void> {
    try {
      await this.api.reports.delete(event.row.id);
      this.toast.success('신고가 삭제되었습니다.');
      const id = Number(this.route.snapshot.paramMap.get('id'));
      if (id) await this.loadContent(id);
    } catch (e: unknown) {
      this.toast.error(e instanceof Error ? e.message : '삭제 실패');
    }
  }

  async onDrawerReportDelete(event: { key: string; row: any }): Promise<void> {
    try {
      await this.api.reports.delete(event.row.id);
      this.toast.success('신고가 삭제되었습니다.');
      // 드로어 신고 내역 새로고침
      const comment = this.selectedComment();
      if (comment) {
        const reports = await this.api.reports.findAll({ type: 'COMMENT', targetId: String(comment.id) });
        this.drawerReportData.set(reports.map((r: any) => ({
          id: r.id,
          commentContent: comment.content,
          content: r.reason || '',
          reporter: r.reporter?.nickname || r.reporter?.name || '',
          reportedAt: formatDate(r.createdAt),
        })));
      }
      // 댓글 그리드도 새로고침 (reportCount 반영)
      const id = Number(this.route.snapshot.paramMap.get('id'));
      if (id) await this.loadContent(id);
    } catch (e: unknown) {
      this.toast.error(e instanceof Error ? e.message : '삭제 실패');
    }
  }
}
