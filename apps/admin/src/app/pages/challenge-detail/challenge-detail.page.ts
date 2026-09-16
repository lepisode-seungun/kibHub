import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { DataGridComponent, GridColumn } from '../../components/data-grid/data-grid.component';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../shared/toast/toast.service';
import { formatDate } from '../../shared/format-date';

interface ChallengeEntry {
  id: number;
  title: string;
  description: string;
  images: string[];
  likeCount: number;
  isWinner: boolean;
  rank: number | null;
  createdAt: string;
  user?: { id: number; nickname: string; profileImage?: string };
}

interface EntryRow {
  [key: string]: unknown;
  id: number;
  title: string;
  nickname: string;
  likeCount: number;
  imageCount: number;
  isWinner: string;
  createdAt: string;
  _raw: ChallengeEntry;
}

@Component({
  selector: 'adm-challenge-detail',
  standalone: true,
  imports: [CommonModule, DataGridComponent],
  templateUrl: './challenge-detail.page.html',
  styleUrl: './challenge-detail.page.css',
})
export class ChallengeDetailPage implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);

  challengeId = 0;
  challengeTitle = '';
  entryRows = signal<EntryRow[]>([]);

  // 드로어
  drawerOpen = signal(false);
  drawerEntry = signal<ChallengeEntry | null>(null);
  drawerImageIndex = signal(0);

  gridColumns: GridColumn[] = [
    { key: 'id', label: '번호', width: '60px' },
    { key: 'title', label: '작품명' },
    { key: 'nickname', label: '작성자', width: '120px' },
    { key: 'likeCount', label: '좋아요', width: '80px' },
    { key: 'imageCount', label: '이미지', width: '80px' },
    { key: 'isWinner', label: '수상', width: '80px' },
    { key: 'createdAt', label: '제출일', width: '120px' },
  ];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.challengeId = Number(id);
      this.load();
    }
  }

  async load(): Promise<void> {
    try {
      const data = await this.api.challenges.getStats(this.challengeId);
      this.challengeTitle = data.title;
      const rows: EntryRow[] = (data.entries || []).map((e: ChallengeEntry) => ({
        id: e.id,
        title: e.title,
        nickname: e.user?.nickname || '-',
        likeCount: e.likeCount,
        imageCount: e.images?.length || 0,
        isWinner: e.isWinner ? `${e.rank || '🏆'}등` : '-',
        createdAt: formatDate(e.createdAt, 'date'),
        _raw: e,
      }));
      this.entryRows.set(rows);
    } catch {
      this.toast.error('챌린지 로드 실패');
    }
  }

  onRowClick(row: Record<string, unknown>): void {
    const entry = row as unknown as EntryRow;
    this.drawerEntry.set(entry._raw);
    this.drawerImageIndex.set(0);
    this.drawerOpen.set(true);
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
    this.drawerEntry.set(null);
  }

  prevImage(): void {
    if (this.drawerImageIndex() > 0) {
      this.drawerImageIndex.update(i => i - 1);
    }
  }

  nextImage(): void {
    const entry = this.drawerEntry();
    if (entry && this.drawerImageIndex() < entry.images.length - 1) {
      this.drawerImageIndex.update(i => i + 1);
    }
  }

  goBack(): void {
    this.router.navigate(['/content/challenges']);
  }

  goEdit(): void {
    this.router.navigate(['/content/challenges', this.challengeId, 'edit']);
  }
}
