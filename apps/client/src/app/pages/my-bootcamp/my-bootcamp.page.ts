import { Component, signal, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';

interface BootcampItem {
  id: number;
  bootcampId: number;
  name: string;
  status: string;
  canEnter: boolean;
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

  tabs = ['전체', '수강중', '신청 완료', '수강대기', '불합격'];
  activeTab = signal('전체');

  allItems = signal<BootcampItem[]>([]);

  /** 어드민 ApplicantStatus → 클라이언트 뱃지 매핑 */
  private readonly STATUS_MAP: Record<string, string> = {
    PENDING: '신청 완료',
    ACCEPTED: '수강중',
    WAITING: '수강대기',
    COMPLETED: '수료',
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

    const items: BootcampItem[] = [];
    const instructorBootcampIds = new Set<number>();

    // 1. 강사로 초대된 부트캠프 (우선 로드)
    if (user.role === 'INSTRUCTOR' || user.role === 'ADMIN') {
      try {
        const bootcamps = await this.api.bootcamps.findByInstructor(user.id);
        const BOOTCAMP_STATUS_MAP: Record<string, string> = {
          PREPARING: '수강대기', RECRUITING: '수강대기', OPERATING: '수강중', CLOSED: '수료', ENDED: '수료',
        };
        for (const bc of bootcamps) {
          instructorBootcampIds.add(bc.id);
          // 종료된 부트캠프만 목록에서 숨기기
          if (bc.status === 'ENDED') continue;
          const fmt = (d: string) => d ? d.substring(0, 10) : '';
          items.push({
            id: bc.id,
            bootcampId: bc.id,
            name: bc.name || `부트캠프 #${bc.id}`,
            status: BOOTCAMP_STATUS_MAP[bc.status] || bc.status || '수강중',
            canEnter: bc.status !== 'CLOSED',
            dateRange: bc.startDate && bc.endDate
              ? `${fmt(bc.startDate)} - ${fmt(bc.endDate)}`
              : '',
          });
        }
      } catch (e) {
        console.error('강사 부트캠프 로드 실패:', e);
      }
    }

    // 2. 지원자(수강생)로 등록된 부트캠프 (강사인 부트캠프는 무시)
    try {
      const applicants = await this.api.applicants.findByUser(user.id);
      for (const a of applicants) {
        const bc = a.bootcamp || {} as Partial<typeof a.bootcamp & { id: number; name: string; status: string; startDate: string; endDate: string }>;
        const bootcampId = ('id' in bc ? bc.id : undefined) || a.bootcampId;
        // 강사인 부트캠프의 수강생 데이터는 무시
        if (instructorBootcampIds.has(bootcampId)) continue;
        const fmt = (d: string) => d ? d.substring(0, 10) : '';
        const mappedStatus = this.STATUS_MAP[a.status] || '신청 완료';
        const bcStatus = bc.status || '';
        if (bcStatus === 'ENDED') continue;
        items.push({
          id: a.id,
          bootcampId,
          name: bc.name || `부트캠프 #${a.bootcampId}`,
          status: mappedStatus,
          canEnter: mappedStatus === '수강중' && bcStatus !== 'CLOSED',
          dateRange: bc.startDate && bc.endDate
            ? `${fmt(bc.startDate)} - ${fmt(bc.endDate)}`
            : '',
        });
      }
    } catch (e) {
      console.error('수강생 부트캠프 로드 실패:', e);
    }

    this.allItems.set(items);
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

  getBadgeClass(status: string): string {
    switch (status) {
      case '수강중': return 'mb-badge mb-badge-active';
      case '신청 완료': return 'mb-badge mb-badge-applied';
      case '수강대기': return 'mb-badge mb-badge-waiting';
      case '수료': return 'mb-badge mb-badge-completed';
      case '불합격': return 'mb-badge mb-badge-closed';
      default: return 'mb-badge';
    }
  }
}
