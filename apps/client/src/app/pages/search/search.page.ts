import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { SearchService } from '../../services/search.service';
import { ApiService } from '../../services/api.service';

interface ContentResult {
  type: 'content';
  id: number;
  userName: string;
  profileImage: string;
  title: string;
  thumbnailUrl: string;
  thumbnailGradient: string;
  feedbackCount: number;
}

interface BootcampResult {
  type: 'bootcamp';
  id: number;
  title: string;
  description: string;
  status: string;
  thumbnailUrl: string;
  thumbnailGradient: string;
}

interface PortfolioResult {
  type: 'portfolio';
  id: number;
  userName: string;
  bootcampName: string;
  workTitle: string;
  genre: string;
  thumbnailUrl: string;
  thumbnailGradient: string;
  isHallOfFame: boolean;
}

type AnyResult = ContentResult | BootcampResult | PortfolioResult;

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './search.page.html',
  styleUrl: './search.page.css',
})
export class SearchPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private searchService = inject(SearchService);
  private api = inject(ApiService);

  searchQuery = signal('');
  searchPlaceholder = '질문, 유저명, 댓글까지 자유롭게 검색해보세요.';

  activeTab = signal<'all' | 'content' | 'bootcamp' | 'portfolio' | 'hallOfFame'>('all');

  contentResults = signal<ContentResult[]>([]);
  bootcampResults = signal<BootcampResult[]>([]);
  portfolioResults = signal<PortfolioResult[]>([]);
  hallOfFameResults = signal<PortfolioResult[]>([]);

  filteredResults = computed<AnyResult[]>(() => {
    const tab = this.activeTab();
    if (tab === 'content') return this.contentResults();
    if (tab === 'bootcamp') return this.bootcampResults();
    if (tab === 'portfolio') return this.portfolioResults();
    if (tab === 'hallOfFame') return this.hallOfFameResults();
    return [...this.contentResults(), ...this.bootcampResults(), ...this.portfolioResults(), ...this.hallOfFameResults()];
  });

  resultCount = computed(() => this.filteredResults().length);
  totalCount = computed(() => this.contentResults().length + this.bootcampResults().length + this.portfolioResults().length + this.hallOfFameResults().length);
  isLoading = signal(false);

  private gradients = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  ];

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const q = params['q'] || '';
      this.searchQuery.set(q);
      this.searchService.setQuery(q);
      if (q) this.doSearch(q);
    });
  }

  private async doSearch(q: string): Promise<void> {
    this.isLoading.set(true);
    try {
      const data: any = await this.api.search.query(q);

      this.contentResults.set((data.contents || []).map((c: any, i: number): ContentResult => ({
        type: 'content',
        id: c.id,
        userName: c.author?.nickname || c.author?.name || 'user',
        profileImage: c.author?.profileImage || '',
        title: c.title || '',
        thumbnailUrl: c.thumbnail || '',
        thumbnailGradient: this.gradients[i % this.gradients.length],
        feedbackCount: 0,
      })));

      this.bootcampResults.set((data.bootcamps || []).map((b: any, i: number): BootcampResult => ({
        type: 'bootcamp',
        id: b.id,
        title: b.name,
        description: b.description || '',
        status: b.status === 'RECRUITING' ? '모집중' : b.status === 'OPERATING' ? '운영중' : b.status === 'ENDED' ? '종료' : '준비중',
        thumbnailUrl: b.thumbnail || '',
        thumbnailGradient: this.gradients[(i + 2) % this.gradients.length],
      })));

      const allPortfolios = (data.portfolios || []).map((p: any, i: number): PortfolioResult => ({
        type: 'portfolio',
        id: p.id,
        userName: p.userName,
        bootcampName: p.bootcampName,
        workTitle: p.workTitle || '',
        genre: p.genre || '',
        thumbnailUrl: p.thumbnail || p.files?.[0]?.url || '',
        thumbnailGradient: this.gradients[(i + 4) % this.gradients.length],
        isHallOfFame: p.isHallOfFame,
      }));
      this.portfolioResults.set(allPortfolios.filter((p: PortfolioResult) => !p.isHallOfFame));
      this.hallOfFameResults.set(allPortfolios.filter((p: PortfolioResult) => p.isHallOfFame));
    } catch {
      this.contentResults.set([]);
      this.bootcampResults.set([]);
      this.portfolioResults.set([]);
      this.hallOfFameResults.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }

  setTab(tab: 'all' | 'content' | 'bootcamp' | 'portfolio' | 'hallOfFame'): void {
    this.activeTab.set(tab);
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
  }

  onSearchSubmit(): void {
    const q = this.searchQuery().trim();
    if (q) {
      this.router.navigate(['/search'], { queryParams: { q } });
    }
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.onSearchSubmit();
    }
  }
}
