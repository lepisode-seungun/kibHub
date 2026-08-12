import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SearchService {
  /** 현재 검색어 */
  searchQuery = signal('');

  setQuery(query: string): void {
    this.searchQuery.set(query);
  }

  clearQuery(): void {
    this.searchQuery.set('');
  }
}
