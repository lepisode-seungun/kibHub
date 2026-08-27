import { Component, signal, inject, effect, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';

interface BootcampItem {
  id: number;
  name: string;
  status: '신청 완료' | '수강 중' | '마감';
  dateRange: string;
}

@Component({
  selector: 'app-my-bootcamp',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './my-bootcamp.page.html',
  styleUrls: ['./my-bootcamp.page.css'],
})
export class MyBootcampPage implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private api = inject(ApiService);

  tabs = ['전체', '수강완료', '수강 중', '마감'];
  activeTab = signal('전체');

  allItems: BootcampItem[] = [
    { id: 1, name: '케나즈 아카데미 초급반 13기', status: '신청 완료', dateRange: '2025.01.20 - 2026.01.20' },
    { id: 2, name: '케나즈 아카데미 초급반 13기', status: '마감', dateRange: '2025.01.20 - 2026.01.20' },
    { id: 3, name: '케나즈 아카데미 초급반 13기', status: '수강 중', dateRange: '2025.01.20 - 2026.01.20' },
    { id: 4, name: '케나즈 아카데미 초급반 13기', status: '마감', dateRange: '2025.01.20 - 2026.01.20' },
    { id: 5, name: '케나즈 아카데미 초급반 13기', status: '수강 중', dateRange: '2025.01.20 - 2026.01.20' },
    { id: 6, name: '케나즈 아카데미 초급반 13기', status: '마감', dateRange: '2025.01.20 - 2026.01.20' },
    { id: 7, name: '케나즈 아카데미 초급반 13기', status: '마감', dateRange: '2025.01.20 - 2026.01.20' },
  ];

  constructor() {
    effect(() => {
      if (this.authService.authChecked() && !this.authService.isLoggedIn()) {
        this.router.navigate(['/login']);
      }
    });
  }

  ngOnInit(): void { this.loadBootcamps(); }

  private async loadBootcamps(): Promise<void> {
    try {
      const bootcamps = await this.api.bootcamps.findAll();
      if (bootcamps.length > 0) {
        this.allItems = bootcamps.map(b => ({
          id: b.id,
          name: b.name,
          status: b.status === 'RECRUITING' ? '수강 중' as const
            : b.status === 'ENDED' ? '마감' as const
            : '신청 완료' as const,
          dateRange: '',
        }));
      }
    } catch (e) {
      console.error('부트칠프 로드 실패:', e);
    }
  }

  get filteredItems(): BootcampItem[] {
    const tab = this.activeTab();
    if (tab === '전체') return this.allItems;
    if (tab === '수강완료') return this.allItems.filter(i => i.status === '신청 완료');
    return this.allItems.filter(i => i.status === tab);
  }

  selectTab(tab: string): void {
    this.activeTab.set(tab);
  }

  navigateToDetail(id: number): void {
    this.router.navigate(['/my-bootcamp', id]);
  }
}
