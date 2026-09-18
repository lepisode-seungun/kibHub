import { formatDate } from '../../shared/format-date';
import { Component, inject, signal, OnInit, ElementRef, ViewChildren, QueryList, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataGridComponent, GridColumn, GridRow } from '../../components/data-grid/data-grid.component';
import { ToastService } from '../../shared/toast/toast.service';
import { ApiService } from '../../services/api.service';
import { BootcampContextService } from '../../services/bootcamp-context.service';
import { Router } from '@angular/router';

interface QuestionStatItem {
  questionId?: number;
  title: string;
  type: string;
  totalAnswers: number;
  distribution?: { option: string; count: number; percentage: number; rating?: number }[];
  answers?: string[];
  average?: number;
  averageRating?: number;
  ratingDistribution?: Record<number, number>;
}

interface SurveyStatsData {
  surveyId: number;
  title: string;
  bootcamp?: { id: number; name: string };
  totalStudents: number;
  totalResponses: number;
  responseRate: number;
  questionStats: QuestionStatItem[];
}

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
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  activeSurveyId = signal<number | null>(null);

  // ===== 설문 통계 =====
  surveyStats = signal<SurveyStatsData | null>(null);
  showStats = signal(false);
  @ViewChildren('donutCanvas') donutCanvases!: QueryList<ElementRef<HTMLCanvasElement>>;

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
  roundRating = () => Math.round(this.avgRating());

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
    this.loadSurveyData();
  }

  async loadReviews(): Promise<void> {
    if (!this.bootcampId) return;
    try {
      const data = await this.api.reviews.findByBootcamp(this.bootcampId);
      this.avgRating.set(data.avgRating);
      this.totalCount.set(data.totalCount);
      this.ratingDist.set(data.ratingDist);
      this.reviews.set(data.reviews.map((r) => ({
        id: r.id,
        userId: r.user?.id,
        userName: r.user?.nickname || '-',
        rating: `★ ${r.rating}`,
        ratingNum: r.rating,
        isRead: r.isRead,
        createdAt: formatDate(r.createdAt),
      })));
    } catch (e) {
      console.error('설문조사 목록 로드 실패:', e);
    }
  }

  private async loadSurveyData(): Promise<void> {
    console.log('[Survey] bootcampId:', this.bootcampId);
    if (!this.bootcampId) return;
    try {
      const survey = await this.api.surveys.findActive(this.bootcampId);
      console.log('[Survey] findActive result:', survey);
      this.activeSurveyId.set(survey?.id || null);
      if (survey?.id) {
        const stats = await this.api.surveys.getStats(survey.id);
        console.log('[Survey] stats:', stats);
      this.surveyStats.set(stats as SurveyStatsData);
      }
    } catch (e) {
      console.error('설문 데이터 로드 실패:', e);
      this.activeSurveyId.set(null);
    }
  }

  async loadSurveyStats(): Promise<void> {
    const surveyId = this.activeSurveyId();
    if (!surveyId) { this.toast.error('등록된 설문이 없습니다.'); return; }
    try {
      const stats = await this.api.surveys.getStats(surveyId);
      this.surveyStats.set(stats as SurveyStatsData);
      this.showStats.set(true);
      this.cdr.detectChanges();
      setTimeout(() => this.drawAllDonuts(), 50);
    } catch (e) {
      console.error('설문 통계 로드 실패:', e);
      this.toast.error('설문 통계를 불러올 수 없습니다.');
    }
  }

  closeStats(): void {
    this.showStats.set(false);
  }

  async resetSurveyResponses(): Promise<void> {
    const surveyId = this.activeSurveyId();
    if (!surveyId) return;
    if (!confirm('설문 응답 데이터를 모두 삭제합니다. 계속하시겠습니까?')) return;
    try {
      const result = await this.api.surveys.resetResponses(surveyId);
      this.toast.success(`${result.deleted}건 응답 삭제됨`);
      await this.loadSurveyData();
      await this.loadSurveyStats();
    } catch (e) {
      console.error('응답 초기화 실패:', e);
      this.toast.error('응답 초기화에 실패했습니다.');
    }
  }

  downloadExcel(): void {
    const surveyId = this.activeSurveyId();
    if (!surveyId) { this.toast.error('등록된 설문이 없습니다.'); return; }
    const url = this.api.surveys.exportCsvUrl(surveyId);
    window.open(url, '_blank');
  }

  // ===== 도넛 차트 =====
  private readonly CHART_COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4', '#84CC16'];
  private canvasDataMap = new Map<HTMLCanvasElement, { slices: { start: number; end: number; idx: number }[]; distribution: { option: string; count: number; percentage: number }[]; total: number }>();
  private boundCanvases = new Set<HTMLCanvasElement>();

  private drawAllDonuts(): void {
    const stats = this.surveyStats();
    if (!stats) return;
    const choiceQuestions = stats.questionStats.filter((q: QuestionStatItem) => q.type === 'SINGLE' || q.type === 'MULTIPLE');
    this.donutCanvases.forEach((ref, i) => {
      if (choiceQuestions[i]) {
        this.drawDonut(ref.nativeElement, choiceQuestions[i].distribution || []);
      }
    });
  }

  private drawDonut(canvas: HTMLCanvasElement, distribution: { option: string; count: number; percentage: number }[]): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const size = 140;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    ctx.scale(dpr, dpr);

    const cx = size / 2, cy = size / 2, r = 58, inner = 36;
    const total = distribution.reduce((s, d) => s + d.count, 0);

    if (total === 0) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.arc(cx, cy, inner, 0, Math.PI * 2, true);
      ctx.fillStyle = '#F4F4F5';
      ctx.fill();
      return;
    }

    // 슬라이스 그리기 + 각도 저장
    const slices: { start: number; end: number; idx: number }[] = [];
    let startAngle = -Math.PI / 2;
    distribution.forEach((d, i) => {
      const sliceAngle = (d.count / total) * Math.PI * 2;
      const endAngle = startAngle + sliceAngle;
      slices.push({ start: startAngle, end: endAngle, idx: i });
      ctx.beginPath();
      ctx.arc(cx, cy, r, startAngle, endAngle);
      ctx.arc(cx, cy, inner, endAngle, startAngle, true);
      ctx.closePath();
      ctx.fillStyle = this.CHART_COLORS[i % this.CHART_COLORS.length];
      ctx.fill();
      startAngle = endAngle;
    });

    this.canvasDataMap.set(canvas, { slices, distribution, total });

    // 이벤트 리스너 (중복 방지)
    if (!this.boundCanvases.has(canvas)) {
      this.boundCanvases.add(canvas);
      canvas.style.cursor = 'pointer';
      canvas.addEventListener('mousemove', (e) => this.onDonutHover(canvas, e));
      canvas.addEventListener('mouseleave', () => this.onDonutLeave(canvas));
    }
  }

  private onDonutHover(canvas: HTMLCanvasElement, e: MouseEvent): void {
    const data = this.canvasDataMap.get(canvas);
    if (!data) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const cx = 70, cy = 70;
    const dx = mx - cx, dy = my - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 36 || dist > 58) {
      this.onDonutLeave(canvas);
      return;
    }

    let angle = Math.atan2(dy, dx);
    if (angle < -Math.PI / 2) angle += Math.PI * 2;

    const hit = data.slices.find(s => angle >= s.start && angle < s.end);
    if (!hit) { this.onDonutLeave(canvas); return; }

    const d = data.distribution[hit.idx];
    this.redrawDonutWithHighlight(canvas, data, hit.idx);

    // 중앙에 호버 정보 표시
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // 중앙 클리어
    ctx.beginPath();
    ctx.arc(cx, cy, 35, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    // 비율
    ctx.fillStyle = '#27272A';
    ctx.font = 'bold 20px SUIT, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${d.percentage}%`, cx, cy - 6);
    // 옵션명 (최대 6자)
    ctx.fillStyle = '#71717A';
    ctx.font = '500 10px SUIT, sans-serif';
    const label = d.option.length > 6 ? d.option.slice(0, 6) + '…' : d.option;
    ctx.fillText(label, cx, cy + 10);
    ctx.restore();
  }

  private onDonutLeave(canvas: HTMLCanvasElement): void {
    const data = this.canvasDataMap.get(canvas);
    if (!data) return;
    this.redrawDonutWithHighlight(canvas, data, -1);
  }

  private redrawDonutWithHighlight(canvas: HTMLCanvasElement, data: { slices: { start: number; end: number; idx: number }[]; distribution: { option: string; count: number; percentage: number }[]; total: number }, highlightIdx: number): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const size = 140;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);

    const cx = size / 2, cy = size / 2, r = 58, inner = 36;

    data.slices.forEach((s) => {
      const isHover = s.idx === highlightIdx;
      const outerR = isHover ? r + 4 : r;
      ctx.beginPath();
      ctx.arc(cx, cy, outerR, s.start, s.end);
      ctx.arc(cx, cy, inner, s.end, s.start, true);
      ctx.closePath();
      const baseColor = this.CHART_COLORS[s.idx % this.CHART_COLORS.length];
      ctx.fillStyle = (highlightIdx >= 0 && !isHover) ? this.dimColor(baseColor) : baseColor;
      ctx.fill();
    });
  }

  private dimColor(hex: string): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},0.3)`;
  }

  getRatingBarColor(rating: number): string {
    const colors: Record<number, string> = { 5: '#10B981', 4: '#34D399', 3: '#FBBF24', 2: '#F97316', 1: '#EF4444' };
    return colors[rating] || '#A1A1AA';
  }

  getRatingPercent(score: number): string {
    const total = this.totalCount();
    const count = this.ratingDist()[score - 1] || 0;
    if (total === 0) return '0%';
    const pct = (count / total) * 100;
    return `${Math.max(pct, count > 0 ? 3 : 0)}%`;
  }

  getRatingPctValue(score: number): number {
    const total = this.totalCount();
    const count = this.ratingDist()[score - 1] || 0;
    if (total === 0) return 0;
    return Math.round((count / total) * 100);
  }

  getRatingOpacity(score: number): number {
    const total = this.totalCount();
    const count = this.ratingDist()[score - 1] || 0;
    if (total === 0) return 0.3;
    const max = Math.max(...this.ratingDist());
    if (max === 0) return 0.3;
    return 0.3 + (count / max) * 0.7;
  }

  getBarWidth(pct: number): string {
    return `${Math.max(pct, 3)}%`;
  }

  getChartTicks(): number[] {
    const max = Math.max(...this.ratingDist(), 1);
    const step = Math.ceil(max / 4);
    const ticks: number[] = [];
    for (let i = 4; i >= 0; i--) {
      ticks.push(step * i);
    }
    return ticks;
  }

  // ===== 리뷰 상세 드로어 =====
  detailDrawerOpen = signal(false);
  detailReview = signal<GridRow | null>(null);
  detailSurvey = signal<Record<string, unknown> | null>(null);
  detailAnswers = signal<Record<string, unknown>[]>([]);

  async openDetailDrawer(row: GridRow): Promise<void> {
    // 클릭 시 자동 읽음 처리 (DB 저장)
    if (!row['isRead']) {
      this.reviews.update(list =>
        list.map(r => r['id'] === row['id'] ? { ...r, isRead: true } : r)
      );
      this.api.reviews.markAsRead(row['id'] as number).catch(() => { /* ignore */ });
    }

    this.detailReview.set(row);
    this.detailSurvey.set(null);
    this.detailAnswers.set([]);
    this.detailDrawerOpen.set(true);

    // 설문 응답 로드
    try {
      const survey = await this.api.surveys.findActive(this.bootcampId);
      if (survey?.id && row['userId']) {
        this.detailSurvey.set(survey as unknown as Record<string, unknown>);
        const resp = await this.api.surveys.findUserResponse(survey.id, row['userId'] as number);
        if (resp?.answers) {
          this.detailAnswers.set(resp.answers as unknown as Record<string, unknown>[]);
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
    this.api.reviews.markManyAsRead(ids).catch(() => { /* ignore */ });
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
      const targetId = this.deleteTargetRow['id'];
      try {
        await this.api.reviews.delete(targetId as number);
        this.toast.success('삭제되었습니다.');
      } catch (e) {
        console.error('삭제 실패:', e);
      }
    } else if (this.deleteModalMode === 'bulk') {
      for (const row of this.selectedReviews) {
        try {
          await this.api.reviews.delete(row['id'] as number);
        } catch { /* skip */ }
      }
      this.toast.success(`${this.selectedReviews.length}건 삭제되었습니다.`);
      this.selectedReviews = [];
    }
    this.closeDeleteModal();
    // 삭제 후 전체 데이터 리로드 (리뷰 목록 + 통계 + 설문)
    await this.loadReviews();
    await this.loadSurveyData();
  }

  // ===== 설문 드로어 =====
  async openSurveyDrawer(): Promise<void> {
    try {
      const existing = await this.api.surveys.findActive(this.bootcampId);
      if (existing && existing.questions) {
        this.surveyTitle.set(existing.title || '수료 설문');
        this.drawerQuestions = existing.questions.map((q) => ({
          _id: ++this._qIdSeq,
          text: q.text || '',
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
    this.drawerQuestions = [...this.drawerQuestions, { _id: ++this._qIdSeq, text: '', type: 'select', editing: true }];
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
      .map((q, i) => ({ id: `q_${i}_${Date.now()}`, text: q.text.trim(), type: q.type }));

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
