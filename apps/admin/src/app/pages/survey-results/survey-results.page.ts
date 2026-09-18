import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';

interface QuestionStat {
  questionId: string;
  title: string;
  type: string;
  totalAnswers: number;
  distribution?: { option?: string; rating?: number; count: number; percentage: number }[];
  average?: number;
  answers?: string[];
}

interface SurveyStats {
  surveyId: number;
  title: string;
  bootcamp: { id: number; name: string };
  totalStudents: number;
  totalResponses: number;
  responseRate: number;
  questionStats: QuestionStat[];
}

@Component({
  selector: 'adm-survey-results',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './survey-results.page.html',
  styleUrl: './survey-results.page.css',
})
export class SurveyResultsPage implements OnInit {
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);

  isLoading = signal(true);
  stats = signal<SurveyStats | null>(null);
  surveyId = 0;

  async ngOnInit(): Promise<void> {
    this.surveyId = Number(this.route.snapshot.paramMap.get('surveyId'));
    if (this.surveyId) {
      await this.loadStats();
    }
  }

  private async loadStats(): Promise<void> {
    this.isLoading.set(true);
    try {
      const data = await this.api.surveys.getStats(this.surveyId) as SurveyStats;
      this.stats.set(data);
    } catch (e) {
      console.error('설문 통계 로드 실패:', e);
    } finally {
      this.isLoading.set(false);
    }
  }

  downloadCsv(): void {
    const url = this.api.surveys.exportCsvUrl(this.surveyId);
    window.open(url, '_blank');
  }

  getBarWidth(percentage: number): string {
    return `${Math.max(percentage, 2)}%`;
  }

  getBarColor(index: number): string {
    const colors = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4', '#84CC16'];
    return colors[index % colors.length];
  }

  getRatingBarColor(rating: number): string {
    const colors: Record<number, string> = { 5: '#10B981', 4: '#34D399', 3: '#FBBF24', 2: '#F97316', 1: '#EF4444' };
    return colors[rating] || '#A1A1AA';
  }

  getStars(avg: number): string {
    const full = Math.floor(avg);
    const half = avg - full >= 0.5 ? 1 : 0;
    return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(5 - full - half);
  }
}
