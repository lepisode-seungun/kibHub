import { formatDate } from '../../shared/format-date';
import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DataGridComponent, GridColumn } from '../../components/data-grid/data-grid.component';
import { ToastService } from '../../shared/toast/toast.service';
import { ApiService } from '../../services/api.service';

interface ChallengeRow {
  [key: string]: unknown;
  id: number;
  title: string;
  category: string;
  status: string;
  statusLabel: string;
  period: string;
  entryCount: number;
  createdAt: string;
}

const STATUS_LABELS: Record<string, string> = {
  UPCOMING: '예정',
  ACTIVE: '진행중',
  ENDED: '종료',
};

const CATEGORY_LABELS: Record<string, string> = {
  DRAWING: '드로잉',
  WEBTOON: '웹툰',
  WRITING: '글',
};

@Component({
  selector: 'adm-challenges',
  standalone: true,
  imports: [CommonModule, DataGridComponent],
  templateUrl: './challenges.page.html',
  styleUrl: './challenges.page.css',
})
export class ChallengesPage implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);
  private toast = inject(ToastService);

  activeFilter = signal<string>('');
  challenges = signal<ChallengeRow[]>([]);
  filteredChallenges = signal<ChallengeRow[]>([]);

  // 순위 모달
  rankModalOpen = signal(false);
  rankChallengeId = signal(0);
  rankEntries = signal<{ id: number; title: string; nickname: string; likeCount: number; images: string[]; rank: number }[]>([]);

  columns: GridColumn[] = [
    { key: 'id', label: '번호', width: '60px' },
    { key: 'title', label: '제목' },
    { key: 'category', label: '카테고리', width: '90px' },
    { key: 'statusLabel', label: '상태', width: '80px', badge: 'status', badgeStyles: {
      '예정': 'bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-semibold',
      '진행중': 'bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-semibold',
      '종료': 'bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full text-xs font-semibold',
    } },
    { key: 'period', label: '기간', width: '200px' },
    { key: 'entryCount', label: '참여', width: '60px' },
    { key: 'createdAt', label: '생성일', width: '120px' },
  ];

  ngOnInit(): void {
    this.loadChallenges();
  }

  async loadChallenges(): Promise<void> {
    try {
      const data = await this.api.challenges.findAll();
      const rows: ChallengeRow[] = data.map((c: any) => ({
        id: c.id,
        title: c.title,
        category: CATEGORY_LABELS[c.category] || c.category,
        status: c.status,
        statusLabel: STATUS_LABELS[c.status] || c.status,
        period: `${formatDate(c.startDate, 'date')} ~ ${formatDate(c.endDate, 'date')}`,
        entryCount: c.entryCount || 0,
        createdAt: formatDate(c.createdAt, 'date'),
      }));
      this.challenges.set(rows);
      this.applyFilter();
    } catch (e) {
      console.error('챌린지 목록 로드 실패:', e);
    }
  }

  setFilter(status: string): void {
    this.activeFilter.set(status);
    this.applyFilter();
  }

  private applyFilter(): void {
    const filter = this.activeFilter();
    if (!filter) {
      this.filteredChallenges.set(this.challenges());
    } else {
      this.filteredChallenges.set(this.challenges().filter(c => c.status === filter));
    }
  }

  onRowClick(row: any): void {
    this.router.navigate(['/content/challenges', row.id]);
  }

  goToNew(): void {
    this.router.navigate(['/content/challenges/new']);
  }

  onContextMenuSelect(event: { action: string; row: any }): void {
    const row = event.row as ChallengeRow;
    switch (event.action) {
      case '수정':
        this.router.navigate(['/content/challenges', row.id, 'edit']);
        break;
      case '시작':
        this.updateStatus(row.id, 'ACTIVE');
        break;
      case '종료':
        this.openRankModal(row.id);
        break;
      case '삭제':
        this.deleteChallenge(row.id);
        break;
    }
  }

  async openRankModal(challengeId: number): Promise<void> {
    try {
      const stats = await this.api.challenges.getStats(challengeId);
      const entries = (stats.entries || [])
        .sort((a: { likeCount: number }, b: { likeCount: number }) => b.likeCount - a.likeCount)
        .map((e: { id: number; title: string; likeCount: number; images: string[]; user?: { nickname: string } }, i: number) => ({
          id: e.id,
          title: e.title,
          nickname: e.user?.nickname || '-',
          likeCount: e.likeCount,
          images: e.images || [],
          rank: i + 1,
        }));
      this.rankChallengeId.set(challengeId);
      this.rankEntries.set(entries);
      this.rankModalOpen.set(true);
    } catch {
      this.toast.error('출품작 로드 실패');
    }
  }

  moveRankUp(index: number): void {
    if (index === 0) return;
    this.rankEntries.update(list => {
      const arr = [...list];
      [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
      return arr.map((e, i) => ({ ...e, rank: i + 1 }));
    });
  }

  moveRankDown(index: number): void {
    const list = this.rankEntries();
    if (index >= list.length - 1) return;
    this.rankEntries.update(list => {
      const arr = [...list];
      [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
      return arr.map((e, i) => ({ ...e, rank: i + 1 }));
    });
  }

  closeRankModal(): void {
    this.rankModalOpen.set(false);
  }

  async confirmEndWithRanks(): Promise<void> {
    const id = this.rankChallengeId();
    const entries = this.rankEntries();
    try {
      // 수상작 저장
      const winners = entries.map(e => ({ entryId: e.id, rank: e.rank }));
      await this.api.challenges.setWinners(id, winners);
      // 상태 변경
      await this.api.challenges.updateStatus(id, 'ENDED');
      this.toast.success('챌린지가 종료되고 순위가 저장되었습니다.');
      this.rankModalOpen.set(false);
      this.loadChallenges();
    } catch {
      this.toast.error('종료 처리 실패');
    }
  }

  async deleteChallenge(id: number): Promise<void> {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    try {
      await this.api.challenges.delete(id);
      this.toast.success('챌린지가 삭제되었습니다.');
      this.loadChallenges();
    } catch {
      this.toast.error('삭제 실패');
    }
  }

  async updateStatus(id: number, status: string): Promise<void> {
    try {
      await this.api.challenges.updateStatus(id, status);
      this.toast.success(`상태가 ${STATUS_LABELS[status]}(으)로 변경되었습니다.`);
      this.loadChallenges();
    } catch {
      this.toast.error('상태 변경 실패');
    }
  }
}
