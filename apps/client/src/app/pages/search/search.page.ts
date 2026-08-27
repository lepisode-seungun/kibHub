import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SearchService } from '../../services/search.service';
import { ApiService } from '../../services/api.service';

interface SearchResult {
  id: number;
  userName: string;
  title: string;
  thumbnailGradient: string;
  rank: number | null;
  featured: boolean;
  comment?: string;
  commenter?: string;
  commentTime?: string;
}

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule],
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

  results = signal<SearchResult[]>([]);
  resultCount = computed(() => this.results().length);
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
      const data = await this.api.contents.findAll({ search: q });
      const items = Array.isArray(data) ? data : [];
      this.results.set(items.map((c, i: number) => ({
        id: c.id,
        userName: 'user',
        title: c.title || '',
        thumbnailGradient: this.gradients[i % this.gradients.length],
        rank: null,
        featured: false,
      })));
    } catch {
      this.results.set([]);
    } finally {
      this.isLoading.set(false);
    }
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

