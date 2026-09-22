import { Component, OnInit, signal, inject, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { BootcampContextService } from '../../services/bootcamp-context.service';
import { formatDate } from '../../shared/format-date';
import { DataGridComponent, GridColumn, GridRow } from '../../components/data-grid/data-grid.component';

interface SummaryCard {
  label: string;
  value: number;
  icon: string;
  color: string;
  bgColor: string;
  route: string;
}

interface BootcampRow {
  id: number;
  name: string;
  status: string;
  statusLabel: string;
  studentCount: number;
  applicantCount: number;
  courseCount: number;
  period: string;
}

const STATUS_MAP: Record<string, string> = {
  PREPARING: '준비',
  RECRUITING: '모집중',
  OPERATING: '운영중',
  CLOSED: '마감',
  ENDED: '종료',
};

const STATUS_COLORS: Record<string, string> = {
  PREPARING: 'bg-zinc-100 text-zinc-600',
  RECRUITING: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
  OPERATING: 'bg-blue-50 text-blue-600 border border-blue-200',
  CLOSED: 'bg-orange-50 text-orange-600 border border-orange-200',
  ENDED: 'bg-zinc-100 text-zinc-500',
};

@Component({
  selector: 'adm-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, DataGridComponent],
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.css',
})
export class DashboardPage implements OnInit {
  @ViewChild('signupChart') signupChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('contentChart') contentChartRef!: ElementRef<HTMLCanvasElement>;

  private api = inject(ApiService);
  private router = inject(Router);
  private bootcampCtx = inject(BootcampContextService);

  isLoading = signal(true);
  summaryCards = signal<SummaryCard[]>([]);
  signupData = signal<{ date: string; count: number }[]>([]);
  signupTooltip = signal<{ visible: boolean; x: number; y: number; date: string; count: number }>({
    visible: false, x: 0, y: 0, date: '', count: 0,
  });
  private signupPointGeometry: { x: number; y: number; idx: number }[] = [];
  contentData = signal<{ date: string; WEBTOON: number; ILLUSTRATION: number; WRITING: number }[]>([]);
  contentTooltip = signal<{ visible: boolean; x: number; y: number; date: string; webtoon: number; illustration: number; writing: number; total: number }>({
    visible: false, x: 0, y: 0, date: '', webtoon: 0, illustration: 0, writing: 0, total: 0,
  });
  private contentBarGeometry: { x: number; w: number; idx: number }[] = [];
  bootcamps = signal<BootcampRow[]>([]);
  bootcampGridColumns: GridColumn[] = [
    { key: 'name', label: '부트캠프명' },
    { key: 'statusLabel', label: '상태', badge: 'status', badgeStyles: {
      '준비': 'bg-zinc-100 text-zinc-600',
      '모집중': 'bg-emerald-50 text-emerald-600 border border-emerald-200',
      '운영중': 'bg-blue-50 text-blue-600 border border-blue-200',
      '마감': 'bg-orange-50 text-orange-600 border border-orange-200',
      '종료': 'bg-zinc-100 text-zinc-500',
    }},
    { key: 'studentCount', label: '수강생' },
    { key: 'applicantCount', label: '지원자' },
    { key: 'courseCount', label: '과정수' },
    { key: 'period', label: '교육 기간' },
  ];
  bootcampGridData = signal<GridRow[]>([]);
  recentUsers = signal<{ id: number; nickname: string; email: string; createdAt: string; profileImage: string | null }[]>([]);
  recentContents = signal<{ id: number; title: string; type: string; createdAt: string; author: { nickname: string } }[]>([]);
  recentInquiries = signal<{ id: number; title: string; status: string; createdAt: string; author: { nickname: string } }[]>([]);

  signupPeriod = signal<'daily' | 'weekly' | 'monthly'>('daily');
  activeRecentTab = signal<'users' | 'contents' | 'inquiries'>('users');

  async ngOnInit(): Promise<void> {
    this.isLoading.set(true);
    try {
      await Promise.all([
        this.loadSummary(),
        this.loadSignupTrend(),
        this.loadContentTrend(),
        this.loadBootcampOverview(),
        this.loadRecentActivity(),
      ]);
    } finally {
      this.isLoading.set(false);
      setTimeout(() => this.drawCharts(), 100);
    }
  }

  private async loadSummary(): Promise<void> {
    const s = await this.api.dashboard.summary();
    this.summaryCards.set([
      { label: '전체 회원', value: s.users, icon: 'people', color: '#3B82F6', bgColor: '#DBEAFE', route: '/members' },
      { label: '콘텐츠', value: s.contents, icon: 'article', color: '#7C3AED', bgColor: '#EDE9FE', route: '/content' },
      { label: '활성 부트캠프', value: s.activeBootcamps, icon: 'school', color: '#059669', bgColor: '#D1FAE5', route: '/bootcamp' },
      { label: '미답변 문의', value: s.pendingInquiries, icon: 'help', color: '#D97706', bgColor: '#FEF3C7', route: '/support/inquiries' },
    ]);
  }

  private async loadSignupTrend(): Promise<void> {
    const rangeDays = this.signupPeriod() === 'daily' ? 30 : this.signupPeriod() === 'weekly' ? 180 : 365;
    const data = await this.api.dashboard.signupTrend(this.signupPeriod(), rangeDays);
    this.signupData.set(data);
  }

  private async loadContentTrend(): Promise<void> {
    const data = await this.api.dashboard.contentTrend(5);
    this.contentData.set(data);
  }

  private async loadBootcampOverview(): Promise<void> {
    const data = await this.api.dashboard.bootcampOverview();
    const rows = data.map(b => ({
      id: b.id,
      name: b.name,
      status: b.status,
      statusLabel: STATUS_MAP[b.status] || b.status,
      studentCount: `${b.studentCount}명`,
      applicantCount: `${b.applicantCount}명`,
      courseCount: `${b.courseCount}개`,
      period: b.startDate && b.endDate
        ? `${new Date(b.startDate).toLocaleDateString('ko-KR')} ~ ${new Date(b.endDate).toLocaleDateString('ko-KR')}`
        : '-',
    }));
    this.bootcamps.set(rows as unknown as BootcampRow[]);
    this.bootcampGridData.set(rows);
  }

  private async loadRecentActivity(): Promise<void> {
    const data = await this.api.dashboard.recentActivity();
    this.recentUsers.set(data.recentUsers);
    this.recentContents.set(data.recentContents);
    this.recentInquiries.set(data.recentInquiries);
  }

  async changeSignupPeriod(period: 'daily' | 'weekly' | 'monthly'): Promise<void> {
    this.signupPeriod.set(period);
    await this.loadSignupTrend();
    setTimeout(() => this.drawSignupChart(), 50);
  }

  navigateCard(card: SummaryCard): void {
    this.router.navigate([card.route]);
  }

  navigateToDetail(basePath: string, id: number): void {
    this.router.navigate([`/${basePath}`, id]).then(() => {
      const content = document.querySelector('.overflow-y-auto');
      content?.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  navigateToInquiry(id: number): void {
    this.router.navigate(['/support/inquiries'], { queryParams: { open: id } }).then(() => {
      const content = document.querySelector('.overflow-y-auto');
      content?.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  onBootcampRowClick(gridRow: GridRow): void {
    const row = gridRow as Record<string, unknown>;
    const id = row['id'] as number;
    const name = (row['name'] as string) || '';
    this.bootcampCtx.setBootcamp(id, name);
    this.router.navigate(['/bootcamp/home/dashboard']);
  }

  selectRecentTab(tab: 'users' | 'contents' | 'inquiries'): void {
    this.activeRecentTab.set(tab);
  }

  getStatusClass(status: string): string {
    return STATUS_COLORS[status] || 'bg-zinc-100 text-zinc-500';
  }

  getTypeLabel(type: string): string {
    const map: Record<string, string> = { WEBTOON: '웹툰', ILLUSTRATION: '그림', WRITING: '글' };
    return map[type] || type;
  }

  getInquiryStatusLabel(status: string): string {
    return status === 'PENDING' ? '대기' : '완료';
  }

  getInquiryStatusClass(status: string): string {
    return status === 'PENDING'
      ? 'bg-amber-50 text-amber-600 border border-amber-200'
      : 'bg-emerald-50 text-emerald-600 border border-emerald-200';
  }

  formatDate(date: string): string {
    return formatDate(date);
  }

  getInitial(name: string): string {
    return (name || 'U').charAt(0).toUpperCase();
  }

  // ===== Canvas Chart Drawing =====

  private drawCharts(): void {
    this.drawSignupChart();
    this.drawContentChart();
  }

  private drawSignupChart(highlightIdx?: number): void {
    if (this.signupPeriod() === 'daily') {
      this.drawSignupBarChart(highlightIdx);
    } else {
      this.drawSignupLineChart(highlightIdx);
    }
  }

  /** 일별: 바 차트 */
  private signupBarGeometry: { x: number; w: number; idx: number }[] = [];

  private drawSignupBarChart(highlightIdx?: number): void {
    const canvas = this.signupChartRef?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const data = this.signupData();
    if (data.length === 0) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const pad = { top: 20, right: 20, bottom: 36, left: 40 };
    const cw = w - pad.left - pad.right;
    const ch = h - pad.top - pad.bottom;

    ctx.clearRect(0, 0, w, h);
    const rawMax = Math.max(...data.map(d => d.count), 1);

    const niceStep = this.calcNiceStep(rawMax);
    const maxVal = Math.ceil(rawMax / niceStep) * niceStep || 1;
    const tickCount = Math.round(maxVal / niceStep);

    // Grid lines
    ctx.strokeStyle = '#F4F4F5';
    ctx.lineWidth = 1;
    for (let i = 0; i <= tickCount; i++) {
      const val = maxVal - niceStep * i;
      const y = pad.top + (ch / tickCount) * i;
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(w - pad.right, y); ctx.stroke();
      ctx.fillStyle = '#A1A1AA'; ctx.font = '11px SUIT, sans-serif'; ctx.textAlign = 'right';
      ctx.fillText(String(Math.round(val)), pad.left - 8, y + 4);
    }

    // Bar dimensions
    const gap = cw / data.length;
    const barW = Math.min(20, gap * 0.55);
    const radius = Math.min(4, barW / 2);

    this.signupBarGeometry = [];
    this.signupPointGeometry = [];

    data.forEach((d, i) => {
      const x = pad.left + gap * i + (gap - barW) / 2;
      const barH = (d.count / maxVal) * ch;
      const barY = pad.top + ch - barH;

      this.signupBarGeometry.push({ x, w: barW, idx: i });
      this.signupPointGeometry.push({ x: x + barW / 2, y: barY, idx: i });

      const isHighlighted = highlightIdx === i;

      if (d.count === 0) {
        // 0건: 최소 잔여 막대 표시
        ctx.fillStyle = 'rgba(200, 200, 210, 0.35)';
        ctx.beginPath();
        ctx.roundRect(x, pad.top + ch - 2, barW, 2, [1, 1, 0, 0]);
        ctx.fill();
      } else {
        // Gradient fill per bar
        const barGrad = ctx.createLinearGradient(0, barY, 0, pad.top + ch);
        if (isHighlighted) {
          barGrad.addColorStop(0, '#60A5FA');
          barGrad.addColorStop(1, '#3B82F6');
        } else {
          barGrad.addColorStop(0, 'rgba(96, 165, 250, 0.7)');
          barGrad.addColorStop(1, 'rgba(59, 130, 246, 0.45)');
        }

        ctx.fillStyle = barGrad;
        ctx.beginPath();
        ctx.roundRect(x, barY, barW, barH, [radius, radius, 0, 0]);
        ctx.fill();

        // Highlight shadow
        if (isHighlighted) {
          ctx.save();
          ctx.shadowColor = 'rgba(59, 130, 246, 0.3)';
          ctx.shadowBlur = 8;
          ctx.shadowOffsetY = 2;
          ctx.fillStyle = 'transparent';
          ctx.beginPath();
          ctx.roundRect(x, barY, barW, barH, [radius, radius, 0, 0]);
          ctx.fill();
          ctx.restore();

          // Value label above bar
          ctx.fillStyle = '#3B82F6';
          ctx.font = 'bold 11px SUIT, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(String(d.count), x + barW / 2, barY - 6);
        }
      }
    });

    // X-axis labels
    const labelStep = Math.max(1, Math.floor(data.length / 10));
    data.forEach((d, i) => {
      if (i % labelStep === 0 || i === data.length - 1) {
        const x = pad.left + gap * i + gap / 2;
        const dayPart = d.date.substring(5); // MM-DD
        if (highlightIdx === i) {
          ctx.fillStyle = '#3B82F6';
          ctx.font = 'bold 10px SUIT, sans-serif';
        } else {
          ctx.fillStyle = '#A1A1AA';
          ctx.font = '10px SUIT, sans-serif';
        }
        ctx.textAlign = 'center';
        ctx.fillText(dayPart, x, h - pad.bottom + 16);
      }
    });
  }

  /** 주별/월별: 라인 차트 */
  private drawSignupLineChart(highlightIdx?: number): void {
    const canvas = this.signupChartRef?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const data = this.signupData();
    if (data.length === 0) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const pad = { top: 20, right: 20, bottom: 36, left: 40 };
    const cw = w - pad.left - pad.right;
    const ch = h - pad.top - pad.bottom;

    ctx.clearRect(0, 0, w, h);
    const rawMax = Math.max(...data.map(d => d.count), 1);

    const niceStep = this.calcNiceStep(rawMax);
    const maxVal = Math.ceil(rawMax / niceStep) * niceStep || 1;
    const tickCount = Math.round(maxVal / niceStep);
    const stepX = cw / Math.max(data.length - 1, 1);

    // Grid lines
    ctx.strokeStyle = '#F4F4F5';
    ctx.lineWidth = 1;
    for (let i = 0; i <= tickCount; i++) {
      const val = maxVal - niceStep * i;
      const y = pad.top + (ch / tickCount) * i;
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(w - pad.right, y); ctx.stroke();
      ctx.fillStyle = '#A1A1AA'; ctx.font = '11px SUIT, sans-serif'; ctx.textAlign = 'right';
      ctx.fillText(String(Math.round(val)), pad.left - 8, y + 4);
    }

    // Calculate points
    const pts = data.map((d, i) => ({ x: pad.left + stepX * i, y: pad.top + ch - (d.count / maxVal) * ch }));
    this.signupPointGeometry = pts.map((p, i) => ({ x: p.x, y: p.y, idx: i }));

    // Bezier curve helper (control points clamped to chart bounds)
    const yMin = pad.top;
    const yMax = pad.top + ch;
    const clampY = (v: number) => Math.max(yMin, Math.min(yMax, v));

    const buildSmoothPath = (points: { x: number; y: number }[]) => {
      ctx.moveTo(points[0].x, points[0].y);
      if (points.length === 2) {
        ctx.lineTo(points[1].x, points[1].y);
        return;
      }
      for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[Math.max(i - 1, 0)];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = points[Math.min(i + 2, points.length - 1)];
        const tension = 0.3;
        const cp1x = p1.x + (p2.x - p0.x) * tension;
        const cp1y = clampY(p1.y + (p2.y - p0.y) * tension);
        const cp2x = p2.x - (p3.x - p1.x) * tension;
        const cp2y = clampY(p2.y - (p3.y - p1.y) * tension);
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
      }
    };

    // Gradient fill under curve
    const grad = ctx.createLinearGradient(0, pad.top, 0, h - pad.bottom);
    grad.addColorStop(0, 'rgba(59, 130, 246, 0.12)');
    grad.addColorStop(1, 'rgba(59, 130, 246, 0)');
    ctx.beginPath();
    ctx.moveTo(pts[0].x, h - pad.bottom);
    ctx.lineTo(pts[0].x, pts[0].y);
    if (pts.length > 2) {
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[Math.max(i - 1, 0)];
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const p3 = pts[Math.min(i + 2, pts.length - 1)];
        const tension = 0.3;
        ctx.bezierCurveTo(
          p1.x + (p2.x - p0.x) * tension, clampY(p1.y + (p2.y - p0.y) * tension),
          p2.x - (p3.x - p1.x) * tension, clampY(p2.y - (p3.y - p1.y) * tension),
          p2.x, p2.y
        );
      }
    } else if (pts.length === 2) {
      ctx.lineTo(pts[1].x, pts[1].y);
    }
    ctx.lineTo(pts[pts.length - 1].x, h - pad.bottom);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Smooth line
    ctx.beginPath();
    buildSmoothPath(pts);
    ctx.strokeStyle = '#3B82F6';
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();

    // Hover: vertical guide line + highlighted dot
    if (highlightIdx !== undefined && pts[highlightIdx]) {
      const hp = pts[highlightIdx];
      ctx.save();
      ctx.setLineDash([4, 3]);
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(hp.x, pad.top);
      ctx.lineTo(hp.x, h - pad.bottom);
      ctx.stroke();
      ctx.restore();

      ctx.beginPath();
      ctx.arc(hp.x, hp.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(59, 130, 246, 0.15)';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(hp.x, hp.y, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = '#3B82F6';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // X-axis labels
    ctx.fillStyle = '#A1A1AA'; ctx.font = '10px SUIT, sans-serif'; ctx.textAlign = 'center';
    const period = this.signupPeriod();
    const labelStep = Math.max(1, Math.floor(data.length / 8));
    data.forEach((d, i) => {
      if (i % labelStep === 0 || i === data.length - 1) {
        let label = d.date.substring(5);
        if (period === 'monthly') {
          const m = parseInt(d.date.substring(5, 7), 10);
          label = `${m}월`;
        }
        if (highlightIdx === i) {
          ctx.fillStyle = '#3B82F6';
          ctx.font = 'bold 10px SUIT, sans-serif';
        } else {
          ctx.fillStyle = '#A1A1AA';
          ctx.font = '10px SUIT, sans-serif';
        }
        ctx.fillText(label, pad.left + stepX * i, h - pad.bottom + 16);
      }
    });
  }

  onSignupChartHover(event: MouseEvent): void {
    const canvas = this.signupChartRef?.nativeElement;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = event.clientX - rect.left;
    const data = this.signupData();
    const period = this.signupPeriod();

    let nearest = -1;

    if (period === 'daily') {
      // Bar chart: hit-test by bar X range
      const tolerance = 4;
      const hit = this.signupBarGeometry.find(
        b => mx >= b.x - tolerance && mx <= b.x + b.w + tolerance
      );
      if (hit) nearest = hit.idx;
    } else {
      // Line chart: nearest point by X
      let minDist = Infinity;
      for (const pt of this.signupPointGeometry) {
        const dist = Math.abs(mx - pt.x);
        if (dist < minDist) {
          minDist = dist;
          nearest = pt.idx;
        }
      }
      if (minDist > 30) nearest = -1;
    }

    if (nearest >= 0 && data[nearest]) {
      const d = data[nearest];
      const pt = this.signupPointGeometry[nearest];
      // Format date label
      let dateLabel = d.date;
      if (period === 'daily') {
        const parts = d.date.split('-');
        dateLabel = `${parseInt(parts[1], 10)}월 ${parseInt(parts[2], 10)}일`;
      } else if (period === 'weekly') {
        dateLabel = `${d.date} 주`;
      } else {
        const m = parseInt(d.date.substring(5, 7), 10);
        dateLabel = `${d.date.substring(0, 4)}년 ${m}월`;
      }

      const tooltipX = Math.min(Math.max(pt.x, 60), rect.width - 100);
      const tooltipY = Math.max(pt.y - 60, 0);
      this.signupTooltip.set({
        visible: true,
        x: tooltipX,
        y: tooltipY,
        date: dateLabel,
        count: d.count,
      });
      this.drawSignupChart(nearest);
    } else {
      this.hideSignupTooltip();
    }
  }

  hideSignupTooltip(): void {
    if (this.signupTooltip().visible) {
      this.signupTooltip.update(t => ({ ...t, visible: false }));
      this.drawSignupChart();
    }
  }

  private drawContentChart(): void {
    const canvas = this.contentChartRef?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const data = this.contentData();
    if (data.length === 0) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const pad = { top: 20, right: 20, bottom: 36, left: 40 };
    const cw = w - pad.left - pad.right;
    const ch = h - pad.top - pad.bottom;

    ctx.clearRect(0, 0, w, h);
    const totals = data.map(d => d.WEBTOON + d.ILLUSTRATION + d.WRITING);
    const maxVal = Math.max(...totals, 1);
    const barW = Math.min(24, (cw / data.length) * 0.6);
    const gap = cw / data.length;
    const colors: [string, string][] = [['WEBTOON', '#38C4D1'], ['ILLUSTRATION', '#D37FC8'], ['WRITING', '#7B7EDF']];

    // Grid
    ctx.strokeStyle = '#F4F4F5'; ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (ch / 4) * i;
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(w - pad.right, y); ctx.stroke();
      ctx.fillStyle = '#A1A1AA'; ctx.font = '11px SUIT, sans-serif'; ctx.textAlign = 'right';
      ctx.fillText(String(Math.round(maxVal - (maxVal / 4) * i)), pad.left - 8, y + 4);
    }

    // Bars — store geometry for tooltip hit-testing
    this.contentBarGeometry = [];
    data.forEach((d, i) => {
      const x = pad.left + gap * i + (gap - barW) / 2;
      this.contentBarGeometry.push({ x, w: barW, idx: i });
      let offset = 0;
      const total = d.WEBTOON + d.ILLUSTRATION + d.WRITING;
      if (total === 0) {
        // 0건: 최소 잔여 막대 표시
        ctx.fillStyle = 'rgba(200, 200, 210, 0.4)';
        ctx.beginPath();
        ctx.roundRect(x, pad.top + ch - 3, barW, 3, [2, 2, 0, 0]);
        ctx.fill();
      } else {
        for (const [key, color] of colors) {
          const val = d[key as keyof typeof d] as number;
          const barH = (val / maxVal) * ch;
          ctx.fillStyle = color;
          ctx.fillRect(x, pad.top + ch - offset - barH, barW, barH);
          offset += barH;
        }
      }
      // X label
      const step = Math.max(1, Math.floor(data.length / 8));
      if (i % step === 0 || i === data.length - 1) {
        ctx.fillStyle = '#A1A1AA'; ctx.font = '10px SUIT, sans-serif'; ctx.textAlign = 'center';
        const monthNum = parseInt(d.date.substring(5, 7), 10);
        ctx.fillText(`${monthNum}월`, x + barW / 2, h - pad.bottom + 16);
      }
    });
  }

  // ===== Content Chart Tooltip =====

  onContentChartHover(event: MouseEvent): void {
    const canvas = this.contentChartRef?.nativeElement;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = event.clientX - rect.left;
    const data = this.contentData();

    // Find which bar the mouse is over (with some horizontal tolerance)
    const tolerance = 6;
    const hit = this.contentBarGeometry.find(
      b => mx >= b.x - tolerance && mx <= b.x + b.w + tolerance
    );

    if (hit && data[hit.idx]) {
      const d = data[hit.idx];
      const total = d.WEBTOON + d.ILLUSTRATION + d.WRITING;
      // Position tooltip relative to chart-body container
      const tooltipX = Math.min(hit.x + hit.w / 2, rect.width - 150);
      const tooltipY = Math.max(event.clientY - rect.top - 110, 0);
      this.contentTooltip.set({
        visible: true,
        x: tooltipX,
        y: tooltipY,
        date: `${d.date.substring(0, 4)}년 ${parseInt(d.date.substring(5, 7), 10)}월`,
        webtoon: d.WEBTOON,
        illustration: d.ILLUSTRATION,
        writing: d.WRITING,
        total,
      });
    } else {
      this.hideContentTooltip();
    }
  }

  hideContentTooltip(): void {
    this.contentTooltip.update(t => ({ ...t, visible: false }));
  }

  /** 데이터 최대값에 맞는 Y축 눈금 간격 계산 (nice number) */
  private calcNiceStep(maxVal: number): number {
    if (maxVal <= 5) return 1;
    if (maxVal <= 10) return 2;
    const magnitude = Math.pow(10, Math.floor(Math.log10(maxVal)));
    const fraction = maxVal / magnitude;
    let niceFraction: number;
    if (fraction <= 1.5) niceFraction = 1;
    else if (fraction <= 3) niceFraction = 2;
    else if (fraction <= 7) niceFraction = 5;
    else niceFraction = 10;
    return niceFraction * magnitude / 4;
  }
}
