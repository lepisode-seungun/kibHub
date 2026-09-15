import { formatDate } from '../../shared/format-date';
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataGridComponent, GridColumn, GridRow } from '../../components/data-grid/data-grid.component';
import { ToastService } from '../../shared/toast/toast.service';
import { ApiService } from '../../services/api.service';
import { BootcampContextService } from '../../services/bootcamp-context.service';

@Component({
  selector: 'adm-reviews',
  standalone: true,
  imports: [CommonModule, DataGridComponent],
  templateUrl: './reviews.page.html',
  styleUrl: './reviews.page.css',
})
export class ReviewsPage implements OnInit {
  private api = inject(ApiService);
  private bootcampCtx = inject(BootcampContextService);
  private toast = inject(ToastService);

  columns: GridColumn[] = [
    { key: 'id', label: '순번' },
    { key: 'userName', label: '작성자' },
    { key: 'rating', label: '별점' },
    { key: 'createdAt', label: '작성일' },
  ];

  reviewRowClass = (row: GridRow): string => {
    return row['isRead'] ? 'rv-row-read' : 'rv-row-unread';
  };

  reviews = signal<GridRow[]>([]);
  avgRating = signal(0);
  totalCount = signal(0);
  ratingDist = signal<number[]>([0, 0, 0, 0, 0]);

  // ===== 설문 설정 드로어 =====
  surveyDrawerOpen = signal(false);
  drawerQuestions: { _id: number; text: string; type: string; editing: boolean }[] = [];
  private _qIdSeq = 0;
  surveyTitle = signal('수료 설문');

  get bootcampId(): number {
    return this.bootcampCtx.currentBootcampId() || 0;
  }

  ngOnInit(): void {
    this.loadReviews();
  }

  async loadReviews(): Promise<void> {
    if (!this.bootcampId) return;
    try {
      const data = await this.api.reviews.findByBootcamp(this.bootcampId);
      this.avgRating.set(data.avgRating);
      this.totalCount.set(data.totalCount);
      this.ratingDist.set(data.ratingDist);
      this.reviews.set(data.reviews.map((r: any) => ({
        id: r.id,
        userId: r.user?.id,
        userName: r.user?.nickname || r.user?.name || '-',
        rating: `★ ${r.rating}`,
        ratingNum: r.rating,
        isRead: r.isApproved, // isApproved를 읽음 상태로 활용
        createdAt: formatDate(r.createdAt),
      })));
    } catch (e) {
      console.error('설문조사 목록 로드 실패:', e);
    }
  }

  // ===== 리뷰 상세 드로어 =====
  detailDrawerOpen = signal(false);
  detailReview = signal<any>(null);
  detailSurvey = signal<any>(null);
  detailAnswers = signal<any[]>([]);

  async openDetailDrawer(row: GridRow): Promise<void> {
    // 클릭 시 자동 읽음 처리 (DB 저장)
    if (!row['isRead']) {
      this.reviews.update(list =>
        list.map(r => r['id'] === row['id'] ? { ...r, isRead: true } : r)
      );
      this.api.reviews.markAsRead(row['id'] as number).catch(() => {});
    }

    this.detailReview.set(row);
    this.detailSurvey.set(null);
    this.detailAnswers.set([]);
    this.detailDrawerOpen.set(true);

    // 설문 응답 로드
    try {
      const survey = await this.api.surveys.findActive(this.bootcampId);
      if (survey?.id && row['userId']) {
        this.detailSurvey.set(survey);
        const resp = await this.api.surveys.findUserResponse(survey.id, row['userId'] as number);
        if (resp?.answers) {
          this.detailAnswers.set(resp.answers);
        }
      }
    } catch { /* 설문 없음 */ }
  }

  closeDetailDrawer(): void {
    this.detailDrawerOpen.set(false);
  }

  getRatingBarWidth(count: number): string {
    const total = this.totalCount();
    if (!total) return '0%';
    return `${(count / total) * 100}%`;
  }

  getContextMenuItems = (): string[] => {
    return ['삭제'];
  };

  async onContextMenuSelect(event: { action: string; row: GridRow }): Promise<void> {
    const { action, row } = event;
    if (action === '삭제') {
      this.deleteModalMessage = '이 설문조사를 삭제하시겠습니까?';
      this.deleteModalMode = 'single';
      this.deleteTargetRow = row;
      this.deleteModalOpen = true;
    }
  }

  // ===== 케밥 메뉴 + 일괄 액션 =====
  kebabOpen = false;
  selectedReviews: GridRow[] = [];

  onSelectionChange(selected: GridRow[]): void {
    this.selectedReviews = selected;
  }

  markSelectedAsRead(): void {
    if (!this.selectedReviews.length) {
      this.toast.error('선택된 항목이 없습니다.');
      this.kebabOpen = false;
      return;
    }
    const ids = this.selectedReviews.map(r => r['id'] as number);
    this.reviews.update(list =>
      list.map(r => ids.includes(r['id'] as number) ? { ...r, isRead: true } : r)
    );
    this.api.reviews.markManyAsRead(ids).catch(() => {});
    this.toast.success(`${ids.length}건 읽음 처리되었습니다.`);
    this.kebabOpen = false;
  }

  async deleteSelected(): Promise<void> {
    if (!this.selectedReviews.length) {
      this.toast.error('선택된 항목이 없습니다.');
      this.kebabOpen = false;
      return;
    }
    this.deleteModalMessage = `${this.selectedReviews.length}건의 설문조사를 삭제하시겠습니까?`;
    this.deleteModalMode = 'bulk';
    this.deleteModalOpen = true;
    this.kebabOpen = false;
  }

  // ===== 삭제 확인 모달 =====
  deleteModalOpen = false;
  deleteModalMessage = '';
  deleteModalMode: 'single' | 'bulk' = 'single';
  deleteTargetRow: GridRow | null = null;

  closeDeleteModal(): void {
    this.deleteModalOpen = false;
    this.deleteTargetRow = null;
  }

  async confirmDelete(): Promise<void> {
    if (this.deleteModalMode === 'single' && this.deleteTargetRow) {
      try {
        await this.api.reviews.delete(this.deleteTargetRow['id'] as number);
        this.reviews.update(list => list.filter(r => r['id'] !== this.deleteTargetRow!['id']));
        this.totalCount.update(c => c - 1);
        this.toast.success('삭제되었습니다.');
      } catch (e) {
        console.error('설문조사 삭제 실패:', e);
      }
    } else if (this.deleteModalMode === 'bulk') {
      for (const row of this.selectedReviews) {
        try {
          await this.api.reviews.delete(row['id'] as number);
        } catch { /* skip */ }
      }
      const ids = new Set(this.selectedReviews.map(r => r['id']));
      this.reviews.update(list => list.filter(r => !ids.has(r['id'])));
      this.totalCount.update(c => c - ids.size);
      this.toast.success(`${ids.size}건 삭제되었습니다.`);
      this.selectedReviews = [];
    }
    this.closeDeleteModal();
  }

  // ===== 설문 드로어 =====
  async openSurveyDrawer(): Promise<void> {
    try {
      const existing = await this.api.surveys.findActive(this.bootcampId);
      if (existing && existing.questions) {
        this.surveyTitle.set(existing.title || '수료 설문');
        this.drawerQuestions = (existing.questions as any[]).map((q: any) => ({
          _id: ++this._qIdSeq,
          text: q.text || q.question || '',
          type: q.type || 'text',
          editing: false,
        }));
      } else {
        this.surveyTitle.set('수료 설문');
        this.drawerQuestions = [];
      }
    } catch {
      this.surveyTitle.set('수료 설문');
      this.drawerQuestions = [];
    }
    this.surveyDrawerOpen.set(true);
  }

  closeSurveyDrawer(): void {
    this.surveyDrawerOpen.set(false);
  }

  addDrawerQuestion(): void {
    this.drawerQuestions = [...this.drawerQuestions, { _id: ++this._qIdSeq, text: '', type: 'text', editing: true }];
  }

  removeDrawerQuestion(index: number): void {
    this.drawerQuestions = this.drawerQuestions.filter((_, i) => i !== index);
  }

  updateDrawerQuestion(index: number, value: string): void {
    this.drawerQuestions[index].text = value;
  }

  updateDrawerQuestionType(index: number, type: string): void {
    this.drawerQuestions[index].type = type;
    this.drawerQuestions = [...this.drawerQuestions];
  }

  editDrawerQuestion(index: number): void {
    this.drawerQuestions[index].editing = true;
    this.drawerQuestions = [...this.drawerQuestions]; // trigger re-render
  }

  saveDrawerQuestion(index: number): void {
    this.drawerQuestions[index].editing = false;
    this.drawerQuestions = [...this.drawerQuestions]; // trigger re-render
  }

  updateSurveyTitle(value: string): void {
    this.surveyTitle.set(value);
  }

  async submitSurveyDrawer(): Promise<void> {
    const questions = this.drawerQuestions
      .filter(q => q.text.trim())
      .map(q => ({ text: q.text.trim(), type: q.type }));

    try {
      await this.api.surveys.upsert(this.bootcampId, {
        title: this.surveyTitle(),
        questions,
      });
      this.toast.success('설문 설정이 저장되었습니다.');
    } catch (e: unknown) {
      const err = e as { error?: { message?: string }; message?: string };
      this.toast.error('저장 실패: ' + (err?.error?.message || err?.message || '알 수 없는 오류'));
    }
    this.surveyDrawerOpen.set(false);
  }
}
