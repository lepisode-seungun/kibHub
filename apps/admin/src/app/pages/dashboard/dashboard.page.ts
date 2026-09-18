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
    const data = await this.api.dashboard.signupTrend(this.signupPeriod(), 30);
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

  private drawSignupChart(): void {
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
    const maxVal = Math.max(...data.map(d => d.count), 1);
    const stepX = cw / Math.max(data.length - 1, 1);

    // Grid
    ctx.strokeStyle = '#F4F4F5';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (ch / 4) * i;
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(w - pad.right, y); ctx.stroke();
      ctx.fillStyle = '#A1A1AA'; ctx.font = '11px SUIT, sans-serif'; ctx.textAlign = 'right';
      ctx.fillText(String(Math.round(maxVal - (maxVal / 4) * i)), pad.left - 8, y + 4);
    }

    // Points
    const pts = data.map((d, i) => ({ x: pad.left + stepX * i, y: pad.top + ch - (d.count / maxVal) * ch }));

    // Fill
    const grad = ctx.createLinearGradient(0, pad.top, 0, h - pad.bottom);
    grad.addColorStop(0, 'rgba(59, 130, 246, 0.15)');
    grad.addColorStop(1, 'rgba(59, 130, 246, 0)');
    ctx.beginPath(); ctx.moveTo(pts[0].x, h - pad.bottom);
    pts.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(pts[pts.length - 1].x, h - pad.bottom);
    ctx.closePath(); ctx.fillStyle = grad; ctx.fill();

    // Line
    ctx.beginPath(); pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
    ctx.strokeStyle = '#3B82F6'; ctx.lineWidth = 2; ctx.stroke();

    // Dots
    pts.forEach(p => {
      ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#3B82F6'; ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
    });

    // X labels
    ctx.fillStyle = '#A1A1AA'; ctx.font = '10px SUIT, sans-serif'; ctx.textAlign = 'center';
    const step = Math.max(1, Math.floor(data.length / 8));
    data.forEach((d, i) => {
      if (i % step === 0 || i === data.length - 1) ctx.fillText(d.date.substring(5), pad.left + stepX * i, h - pad.bottom + 16);
    });
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
}
