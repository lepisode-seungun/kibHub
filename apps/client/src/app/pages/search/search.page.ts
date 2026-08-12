import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SearchService } from '../../services/search.service';

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

  searchQuery = signal('');
  searchPlaceholder = '질문, 유저명, 댓글까지 자유롭게 검색해보세요.';

  /** 전체 데이터 (나중에 API로 교체) */
  private allResults: SearchResult[] = [
    { id: 1, userName: 'newon', title: '콘텐츠 제목 30자 이내 콘텐츠 제목 콘텐츠 제목 콘텐', thumbnailGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', rank: 1, featured: false },
    { id: 2, userName: 'newon', title: '콘텐츠 제목 30자 이내 콘텐츠 제목 콘텐츠 제목 콘텐', thumbnailGradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', rank: 1, featured: false },
    { id: 3, userName: 'newon', title: '콘텐츠 제목 30자 이내 콘텐츠 제목 콘텐츠 제목 콘텐', thumbnailGradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', rank: 1, featured: true,
      comment: '현재 부분 시간에 따른 그림자 표현이 적절하게 되어야할 것 같아요. 지금은 전혀 반영되지 않아 이미지가 너무 어색해 보입니다.',
      commenter: 'yomi13', commentTime: '2분 전' },
    { id: 4, userName: 'newon', title: '콘텐츠 제목 30자 이내 콘텐츠 제목 콘텐츠 제목 콘텐', thumbnailGradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', rank: 1, featured: false },
    { id: 5, userName: 'newon', title: '콘텐츠 제목 30자 이내 콘텐츠 제목 콘텐츠 제목 콘텐', thumbnailGradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', rank: null, featured: false },
    { id: 6, userName: 'newon', title: '콘텐츠 제목 30자 이내 콘텐츠 제목 콘텐츠 제목 콘텐', thumbnailGradient: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)', rank: 1, featured: false },
    { id: 7, userName: 'newon', title: '콘텐츠 제목 30자 이내 콘텐츠 제목 콘텐츠 제목 콘텐', thumbnailGradient: 'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)', rank: 1, featured: false },
    { id: 8, userName: 'newon', title: '콘텐츠 제목 30자 이내 콘텐츠 제목 콘텐츠 제목 콘텐', thumbnailGradient: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)', rank: 1, featured: false },
    { id: 9, userName: 'newon', title: '콘텐츠 제목 30자 이내 콘텐츠 제목 콘텐츠 제목 콘텐', thumbnailGradient: 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)', rank: 1, featured: false },
    { id: 10, userName: 'newon', title: '콘텐츠 제목 30자 이내 콘텐츠 제목 콘텐츠 제목 콘텐', thumbnailGradient: 'linear-gradient(135deg, #fddb92 0%, #d1fdff 100%)', rank: 1, featured: false },
    { id: 11, userName: 'newon', title: '콘텐츠 제목 30자 이내 콘텐츠 제목 콘텐츠 제목 콘텐', thumbnailGradient: 'linear-gradient(135deg, #f5576c 0%, #ff6a88 100%)', rank: 1, featured: false },
    { id: 12, userName: 'newon', title: '콘텐츠 제목 30자 이내 콘텐츠 제목 콘텐츠 제목 콘텐', thumbnailGradient: 'linear-gradient(135deg, #667eea 0%, #00c6fb 100%)', rank: 1, featured: false },
    { id: 13, userName: 'newon', title: '콘텐츠 제목 30자 이내 콘텐츠 제목 콘텐츠 제목 콘텐', thumbnailGradient: 'linear-gradient(135deg, #c471f5 0%, #fa71cd 100%)', rank: null, featured: false },
    { id: 14, userName: 'newon', title: '콘텐츠 제목 30자 이내 콘텐츠 제목 콘텐츠 제목 콘텐', thumbnailGradient: 'linear-gradient(135deg, #48c6ef 0%, #6f86d6 100%)', rank: 1, featured: false },
    { id: 15, userName: 'newon', title: '콘텐츠 제목 30자 이내 콘텐츠 제목 콘텐츠 제목 콘텐', thumbnailGradient: 'linear-gradient(135deg, #feada6 0%, #f5efef 100%)', rank: 1, featured: false },
    { id: 16, userName: 'newon', title: '콘텐츠 제목 30자 이내 콘텐츠 제목 콘텐츠 제목 콘텐', thumbnailGradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', rank: null, featured: false },
    { id: 17, userName: 'newon', title: '콘텐츠 제목 30자 이내 콘텐츠 제목 콘텐츠 제목 콘텐', thumbnailGradient: 'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)', rank: 1, featured: false },
    { id: 18, userName: 'newon', title: '콘텐츠 제목 30자 이내 콘텐츠 제목 콘텐츠 제목 콘텐', thumbnailGradient: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)', rank: 1, featured: false },
    { id: 19, userName: 'newon', title: '콘텐츠 제목 30자 이내 콘텐츠 제목 콘텐츠 제목 콘텐', thumbnailGradient: 'linear-gradient(135deg, #96fbc4 0%, #f9f586 100%)', rank: 1, featured: false },
    { id: 20, userName: 'newon', title: '콘텐츠 제목 30자 이내 콘텐츠 제목 콘텐츠 제목 콘텐', thumbnailGradient: 'linear-gradient(135deg, #e8198b 0%, #c7eafd 100%)', rank: null, featured: false },
    { id: 21, userName: 'newon', title: '콘텐츠 제목 30자 이내 콘텐츠 제목 콘텐츠 제목 콘텐', thumbnailGradient: 'linear-gradient(135deg, #7028e4 0%, #e5b2ca 100%)', rank: 1, featured: false },
    { id: 22, userName: 'newon', title: '콘텐츠 제목 30자 이내 콘텐츠 제목 콘텐츠 제목 콘텐', thumbnailGradient: 'linear-gradient(135deg, #09203f 0%, #537895 100%)', rank: 1, featured: false },
    { id: 23, userName: 'newon', title: '콘텐츠 제목 30자 이내 콘텐츠 제목 콘텐츠 제목 콘텐', thumbnailGradient: 'linear-gradient(135deg, #ddd6f3 0%, #faaca8 100%)', rank: 1, featured: false },
    { id: 24, userName: 'newon', title: '콘텐츠 제목 30자 이내 콘텐츠 제목 콘텐츠 제목 콘텐', thumbnailGradient: 'linear-gradient(135deg, #16bffd 0%, #cb3066 100%)', rank: 1, featured: false },
  ];

  filteredResults = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return [];
    return this.allResults.filter(c =>
      c.title.toLowerCase().includes(q) ||
      c.userName.toLowerCase().includes(q) ||
      (c.comment && c.comment.toLowerCase().includes(q))
    );
  });

  resultCount = computed(() => this.filteredResults().length);

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const q = params['q'] || '';
      this.searchQuery.set(q);
      this.searchService.setQuery(q);
    });
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
