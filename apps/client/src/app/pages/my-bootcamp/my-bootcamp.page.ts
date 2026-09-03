import { Component, signal, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';

interface BootcampItem {
  id: number;
  bootcampId: number;
  name: string;
  status: '신청 완료' | '수강중' | '불합격';
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
  private platformId = inject(PLATFORM_ID);

  tabs = ['전체', '수강중', '신청 완료'];
  activeTab = signal('전체');

  allItems = signal<BootcampItem[]>([]);

  /** 어드민 ApplicantStatus → 클라이언트 뱃지 매핑 */
  private readonly STATUS_MAP: Record<string, '신청 완료' | '수강중' | '불합격'> = {
    PENDING: '신청 완료',
    ACCEPTED: '수강중',
    REJECTED: '불합격',
  };

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.waitAndLoad();
  }

  private async waitAndLoad(): Promise<void> {
    // authChecked가 될 때까지 폴링 (최대 5초)
    for (let i = 0; i < 50; i++) {
      if (this.authService.authChecked()) break;
      await new Promise(r => setTimeout(r, 100));
    }

    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    await this.loadMyBootcamps();
  }

  private async loadMyBootcamps(): Promise<void> {
    const user = this.authService.currentUser();
    if (!user) return;

    try {
      const items: BootcampItem[] = [];

      // 1. 지원자(수강생)로 등록된 부트캠프
      const applicants = await this.api.applicants.findByUser(user.id);
      const filtered = applicants.filter(a => a.status !== 'REJECTED');
      for (const a of filtered) {
        const bc = a.bootcamp || {};
        const fmt = (d: string) => d ? d.substring(0, 10) : '';
        items.push({
          id: a.id,
          bootcampId: bc.id || a.bootcampId,
          name: bc.name || `부트캠프 #${a.bootcampId}`,
          status: this.STATUS_MAP[a.status] || '신청 완료',
          dateRange: bc.startDate && bc.endDate
            ? `${fmt(bc.startDate)} - ${fmt(bc.endDate)}`
            : '',
        });
      }

      // 2. 강사로 초대된 부트캠프
      if (user.role === 'INSTRUCTOR') {
        const bootcamps = await this.api.bootcamps.findByInstructor(user.id);
        for (const bc of bootcamps) {
          // 이미 지원자로 등록된 부트캠프 중복 방지
          if (items.some(i => i.bootcampId === bc.id)) continue;
          const fmt = (d: string) => d ? d.substring(0, 10) : '';
          items.push({
            id: bc.id,
            bootcampId: bc.id,
            name: bc.name || `부트캠프 #${bc.id}`,
            status: '수강중',
            dateRange: bc.startDate && bc.endDate
              ? `${fmt(bc.startDate)} - ${fmt(bc.endDate)}`
              : '',
          });
        }
      }

      this.allItems.set(items);
    } catch (e) {
      console.error('내 부트캠프 로드 실패:', e);
    }
  }

  get filteredItems(): BootcampItem[] {
    const tab = this.activeTab();
    const items = this.allItems();
    if (tab === '전체') return items;
    return items.filter(i => i.status === tab);
  }

  selectTab(tab: string): void {
    this.activeTab.set(tab);
  }

  navigateToDetail(id: number): void {
    this.router.navigate(['/my-bootcamp', id]);
  }
}
