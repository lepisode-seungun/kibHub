import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';

interface CcItem {
  id: number;
  category: string; // '공지사항' | '1:1문의' | 'FAQ'
  title: string;
  content: string;
  date: string;
  author: string;
  status?: '대기' | '완료'; // 1:1문의 전용
  pinned?: boolean;
  answer?: string; // FAQ 답변
  image?: string; // FAQ 이미지 URL
  attachments?: { name: string }[]; // FAQ 첨부파일
}

@Component({
  selector: 'app-customer-center',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './customer-center.page.html',
  styleUrls: ['./customer-center.page.css'],
})
export class CustomerCenterPage implements OnInit, OnDestroy {
  private router = inject(Router);
  private api = inject(ApiService);

  ngOnInit(): void {
    document.body.classList.add('page-customer-center');
    this.loadAllData();
  }

  ngOnDestroy(): void {
    document.body.classList.remove('page-customer-center');
  }

  tabs = ['공지사항', '1:1문의', 'FAQ'];
  activeTab = signal('공지사항');

  searchQuery = signal('');
  hasSearched = signal(false);
  currentPage = signal(1);
  pageSize = 5;

  // API에서 로드한 데이터
  allItems = signal<CcItem[]>([]);

  async loadAllData(): Promise<void> {
    try {
      const [notices, faqs, inquiries] = await Promise.all([
        this.api.notices.findAll({ type: 'SUPPORT' }),
        this.api.faqs.findAll(),
        this.api.inquiries.findAll(),
      ]);

      this.allItems.set([
        ...notices.map(n => ({
          id: n.id,
          category: '공지사항',
          title: n.title,
          content: (n.body || '').replace(/<[^>]*>/g, ''),
          date: new Date(n.createdAt).toLocaleDateString('ko-KR'),
          author: n.author?.nickname || '관리자',
          pinned: n.pinned || false,
        })),
        ...inquiries.map(q => ({
          id: q.id,
          category: '1:1문의',
          title: q.title,
          content: q.body || '',
          date: new Date(q.createdAt).toLocaleDateString('ko-KR'),
          author: q.author?.nickname || q.author?.name || 'user',
          status: (q.status === 'ANSWERED' ? '완료' : '대기') as '대기' | '완료',
        })),
        ...faqs.map(f => ({
          id: f.id,
          category: 'FAQ',
          title: f.question,
          content: '',
          date: new Date(f.createdAt).toLocaleDateString('ko-KR'),
          author: '관리자',
          answer: f.answer,
        })),
      ]);
    } catch (e) {
      console.error('고객센터 데이터 로드 실패:', e);
    }
  }

  filteredItems = computed(() => {
    const tabItems = this.allItems().filter(i => i.category === this.activeTab());
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) return tabItems;
    return tabItems.filter(i => i.title.toLowerCase().includes(q) || i.content.toLowerCase().includes(q));
  });

  items = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filteredItems().slice(start, start + this.pageSize);
  });

  totalCount = computed(() => this.filteredItems().length);

  totalPages = computed(() => Math.max(1, Math.ceil(this.filteredItems().length / this.pageSize)));

  pageNumbers = computed(() => {
    const pages: number[] = [];
    for (let i = 1; i <= this.totalPages(); i++) pages.push(i);
    return pages;
  });

  selectTab(tab: string): void {
    this.activeTab.set(tab);
    this.hasSearched.set(false);
    this.searchQuery.set('');
    this.currentPage.set(1);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  onSearch(): void {
    this.hasSearched.set(true);
    this.currentPage.set(1);
  }

  expandedFaqId = signal<number | null>(null);

  toggleFaq(id: number): void {
    this.expandedFaqId.set(this.expandedFaqId() === id ? null : id);
  }

  onWrite(): void {
    this.router.navigate(['/inquiry/new']);
  }

  openItem(item: CcItem): void {
    if (item.category === '1:1문의') {
      this.router.navigate(['/inquiry', item.id]);
    } else if (item.category === '공지사항') {
      this.router.navigate(['/notice', item.id]);
    }
  }

  onSearchInput(value: string): void {
    this.searchQuery.set(value);
  }
}
