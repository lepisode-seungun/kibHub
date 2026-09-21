import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';

interface ChallengeCard {
  id: number;
  title: string;
  description: string;
  thumbnail: string | null;
  category: string;
  status: string;
  startDate: string;
  endDate: string;
  entryCount: number;
  daysLeft: number | null;
}

interface ChallengeListItem {
  id: number;
  title: string;
  description?: string;
  thumbnail?: string;
  category: string;
  status: string;
  startDate: string;
  endDate: string;
  entryCount?: number;
}

const CATEGORY_LABELS: Record<string, string> = { DRAWING: '드로잉', WEBTOON: '웹툰', WRITING: '글' };

@Component({
  selector: 'app-challenges-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './challenges.page.html',
  styleUrl: './challenges.page.css',
})
export class ChallengesPage implements OnInit {
  private api = inject(ApiService);

  activeFilter = signal<string>('');
  challenges = signal<ChallengeCard[]>([]);
  filtered = signal<ChallengeCard[]>([]);

  ngOnInit(): void {
    this.loadChallenges();
  }

  async loadChallenges(): Promise<void> {
    try {
      const data = await this.api.challenges.findAll();
      const cards: ChallengeCard[] = (data as ChallengeListItem[]).map((c) => {
        const end = new Date(c.endDate);
        const now = new Date();
        const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return {
          id: c.id,
          title: c.title,
          description: c.description || '',
          thumbnail: c.thumbnail ?? null,
          category: CATEGORY_LABELS[c.category] || c.category,
          status: c.status,
          startDate: c.startDate,
          endDate: c.endDate,
          entryCount: c.entryCount || 0,
          daysLeft: c.status === 'ACTIVE' ? Math.max(0, diff) : null,
        };
      });
      this.challenges.set(cards);
      this.applyFilter();
    } catch (e) {
      console.error(e);
    }
  }

  setFilter(status: string): void {
    this.activeFilter.set(status);
    this.applyFilter();
  }

  private applyFilter(): void {
    const f = this.activeFilter();
    this.filtered.set(f ? this.challenges().filter(c => c.status === f) : this.challenges());
  }

  getStatusLabel(status: string): string {
    return status === 'ACTIVE' ? '진행중' : '종료';
  }

  getStatusClass(status: string): string {
    return status === 'ACTIVE' ? 'badge-active' : 'badge-ended';
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' });
  }
}
