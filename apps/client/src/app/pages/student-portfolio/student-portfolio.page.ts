import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';

interface PortfolioCardData {
  id: number;
  thumbnail: string;
  gradient: string;
  workTitle: string;
  userName: string;
  bootcampName: string;
}

@Component({
  selector: 'app-student-portfolio',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './student-portfolio.page.html',
  styleUrls: ['./student-portfolio.page.css'],
})
export class StudentPortfolioPage implements OnInit {
  private api = inject(ApiService);

  portfolios = signal<PortfolioCardData[]>([]);
  isLoading = signal(true);

  private readonly gradients = [
    'linear-gradient(135deg, #5a3a8c, #2a1a50)',
    'linear-gradient(135deg, #667eea, #764ba2)',
    'linear-gradient(135deg, #f093fb, #f5576c)',
    'linear-gradient(135deg, #4facfe, #00f2fe)',
    'linear-gradient(135deg, #43e97b, #38f9d7)',
    'linear-gradient(135deg, #fa709a, #fee140)',
    'linear-gradient(135deg, #a18cd1, #fbc2eb)',
    'linear-gradient(135deg, #ffecd2, #fcb69f)',
    'linear-gradient(135deg, #a1c4fd, #c2e9fb)',
    'linear-gradient(135deg, #d4fc79, #96e6a1)',
    'linear-gradient(135deg, #84fab0, #8fd3f4)',
    'linear-gradient(135deg, #cfd9df, #e2ebf0)',
  ];
  private readonly TOTAL_CARDS = 12;

  portfolioRows = computed<PortfolioCardData[][]>(() => {
    const all = this.portfolios();
    if (all.length === 0) return [];
    const rows: PortfolioCardData[][] = [];
    for (let i = 0; i < all.length; i += 4) {
      rows.push(all.slice(i, i + 4));
    }
    return rows;
  });

  async ngOnInit(): Promise<void> {
    try {
      const data = await this.api.portfolios.findAll({ isHallOfFame: 'false', status: 'VISIBLE' });
      this.portfolios.set((Array.isArray(data) ? data : []).map((p: any, i: number) => ({
        id: p.id,
        thumbnail: p.thumbnail || '',
        gradient: this.gradients[i % this.gradients.length],
        workTitle: p.workTitle || '',
        userName: p.userName || '',
        bootcampName: p.bootcampName || '',
      })));
    } catch {
      this.portfolios.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }
}
