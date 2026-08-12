import { Component, signal, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

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
export class MyBootcampPage {
  private authService = inject(AuthService);
  private router = inject(Router);

  tabs = ['전체', '수강완료', '수강 중', '마감'];
  activeTab = signal('전체');

  allItems: BootcampItem[] = [
    { id: 1, name: '케나즈 아카데미 초급반 13기', status: '신청 완료', dateRange: '2025.01.20 - 2026.01.20' },
    { id: 2, name: '케나즈 아카데미 초급반 13기', status: '마감', dateRange: '2025.01.20 - 2026.01.20' },
    { id: 3, name: '케나즈 아카데미 초급반 13기', status: '수강 중', dateRange: '' },
    { id: 4, name: '케나즈 아카데미 초급반 13기', status: '마감', dateRange: '2025.01.20 - 2026.01.20' },
    { id: 5, name: '케나즈 아카데미 초급반 13기', status: '수강 중', dateRange: '2025.01.20 - 2026.01.20' },
    { id: 6, name: '케나즈 아카데미 초급반 13기', status: '마감', dateRange: '2025.01.20 - 2026.01.20' },
    { id: 7, name: '케나즈 아카데미 초급반 13기', status: '마감', dateRange: '2025.01.20 - 2026.01.20' },
  ];

  constructor() {
    // 인증 확인 완료 후 비로그인 시 리다이렉트
    effect(() => {
      if (this.authService.authChecked() && !this.authService.isLoggedIn()) {
        this.router.navigate(['/login']);
      }
    });
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
