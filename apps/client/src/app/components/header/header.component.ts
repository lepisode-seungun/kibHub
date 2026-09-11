import { Component, signal, computed, HostListener, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { SearchService } from '../../services/search.service';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';

interface Language {
  code: string;
  label: string;
}

interface AppNotification {
  id: number;
  type: string;
  message: string;
  isRead: boolean;
  isChecked: boolean;
  actorNickname: string;
  actorProfileImage: string | null;
  targetId: number | null;
  targetType: string | null;
  createdAt: string;
  relativeTime: string;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent implements OnInit, OnDestroy {
  private searchService = inject(SearchService);
  private router = inject(Router);
  readonly authService = inject(AuthService);
  private api = inject(ApiService);

  activeMenu = '명예의전당';
  searchPlaceholder = '질문, 유저명, 댓글까지 자유롭게 검색해보세요.';
  searchValue = '';

  readonly isLoggedIn = this.authService.isLoggedIn;
  readonly userName = computed(() => this.authService.currentUser()?.nickname ?? '');
  readonly userInitial = computed(() => this.authService.currentUser()?.initial ?? '');
  readonly userProfileImage = computed(() => this.authService.currentUser()?.profileImage ?? null);

  isSidebarOpen = signal(false);
  isBootcampOpen = signal(false);
  isBootcampRoute = signal(false);
  isHomeRoute = signal(false);
  isMobileSearchOpen = signal(false);
  isLangSheetOpen = signal(false);
  isLogoutModalOpen = signal(false);
  currentUrl = signal('/');

  private bootcampPrefixes = ['/bootcamp-intro', '/k-digital', '/student-portfolio', '/hall-of-fame', '/bootcamp-detail'];
  private homePrefixes = ['/', '/content'];
  private notiInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd)
    ).subscribe((e) => {
      const url = e.urlAfterRedirects.split('?')[0];
      this.isBootcampRoute.set(
        this.bootcampPrefixes.some(prefix => url.startsWith(prefix))
      );
      this.isHomeRoute.set(
        url === '/' || this.homePrefixes.some(prefix => prefix !== '/' && url.startsWith(prefix))
      );
      this.currentUrl.set(url);
    });
  }

  ngOnInit(): void {
    this.loadNotifications();
    // 60초마다 알림 갱신
    this.notiInterval = setInterval(() => this.loadNotifications(), 60000);
  }

  ngOnDestroy(): void {
    if (this.notiInterval) clearInterval(this.notiInterval);
  }

  toggleSidebar(): void {
    this.isSidebarOpen.update(v => !v);

    const drawer = document.querySelector<HTMLElement>('.side-drawer');

    if (window.innerWidth <= 768) {
      // 모바일: 스크롤 잠금 + 인라인 left 제거 (데스크톱 잔존 방지)
      document.body.style.overflow = this.isSidebarOpen() ? 'hidden' : '';
      if (drawer) drawer.style.left = '';
    } else {
      // 데스크톱: 햄버거 버튼 기준 드롭다운 위치 설정
      if (this.isSidebarOpen()) {
        const btn = document.querySelector<HTMLElement>('.icon-btn');
        if (btn && drawer) {
          const rect = btn.getBoundingClientRect();
          drawer.style.left = rect.left + 'px';
        }
      } else if (drawer) {
        setTimeout(() => { drawer.style.left = ''; }, 250);
      }
    }
  }

  closeSidebar(): void {
    this.isSidebarOpen.set(false);
    document.body.style.overflow = '';
    const drawer = document.querySelector<HTMLElement>('.side-drawer');
    if (drawer) {
      setTimeout(() => { drawer.style.left = ''; }, 250);
    }
  }

  toggleMobileSearch(): void {
    this.isMobileSearchOpen.update(v => !v);
  }

  toggleLangSheet(): void {
    this.closeSidebar();
    setTimeout(() => {
      this.isLangSheetOpen.set(true);
      document.body.style.overflow = 'hidden';
    }, 300);
  }

  closeLangSheet(): void {
    this.isLangSheetOpen.set(false);
    document.body.style.overflow = '';
  }

  toggleBootcamp(): void {
    this.isBootcampOpen.update(v => !v);
  }

  onSearch(event: Event): void {
    this.searchValue = (event.target as HTMLInputElement).value;
    this.searchService.setQuery(this.searchValue);
  }

  onSearchKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && this.searchValue.trim()) {
      this.navigateSearch();
    }
  }

  onSearchClick(): void {
    if (this.searchValue.trim()) {
      this.navigateSearch();
    }
  }

  private navigateSearch(): void {
    const query = this.searchValue.trim();
    this.searchValue = '';
    const input = document.querySelector<HTMLInputElement>('.search-input');
    if (input) input.value = '';
    this.isMobileSearchOpen.set(false);
    document.body.style.overflow = '';
    this.router.navigate(['/search'], { queryParams: { q: query } });
  }

  isLangOpen = signal(false);

  languages: Language[] = [
    { code: 'KR', label: '한국어' },
    { code: 'EN', label: 'English' },
  ];

  selectedLang = signal<Language>(this.languages[0]);

  get currentLang(): string {
    return this.selectedLang().code;
  }

  toggleLangDropdown(): void {
    this.isLangOpen.update(v => !v);
  }

  selectLang(lang: Language): void {
    this.selectedLang.set(lang);
    this.isLangOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.lang-selector')) {
      this.isLangOpen.set(false);
    }
  }

  showLogoutModal(): void {
    this.closeSidebar();
    setTimeout(async () => {
      await this.authService.logout();
      await this.router.navigate(['/']);
      this.isLogoutModalOpen.set(true);
    }, 300);
  }

  closeLogoutModal(): void {
    this.isLogoutModalOpen.set(false);
  }

  goToLogin(): void {
    this.isLogoutModalOpen.set(false);
    this.router.navigate(['/login']);
  }

  goHome(): void {
    this.router.navigate(['/']);
  }

  /* ===== 알림 패널 ===== */
  isNotificationOpen = signal(false);
  notifications = signal<AppNotification[]>([]);
  unreadCount = signal(0);

  private async loadNotifications(): Promise<void> {
    if (!this.isLoggedIn()) return;
    try {
      const [list, countRes] = await Promise.all([
        this.api.notifications.findAll(),
        this.api.notifications.unreadCount(),
      ]);
      this.notifications.set(list.map((n: any) => ({
        id: n.id,
        type: n.type,
        message: n.message,
        isRead: n.isRead,
        isChecked: false,
        actorNickname: n.actor?.nickname || '',
        actorProfileImage: n.actor?.profileImage || null,
        targetId: n.targetId,
        targetType: n.targetType,
        createdAt: n.createdAt,
        relativeTime: this.getRelativeTime(n.createdAt),
      })));
      this.unreadCount.set(countRes.count);
    } catch { /* 로그인 안 한 상태면 무시 */ }
  }

  private getRelativeTime(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return '방금 전';
    if (mins < 60) return `${mins}분 전`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}시간 전`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}일 전`;
    return new Date(dateStr).toLocaleDateString('ko-KR');
  }

  async openNotification(): Promise<void> {
    this.closeSidebar();
    await this.loadNotifications();
    this.isNotificationOpen.set(true);
    document.body.style.overflow = 'hidden';
  }

  closeNotification(): void {
    this.isNotificationOpen.set(false);
    document.body.style.overflow = '';
  }

  toggleNotiCheck(noti: AppNotification): void {
    this.notifications.update(list =>
      list.map(n => n.id === noti.id ? { ...n, isChecked: !n.isChecked } : n)
    );
  }

  onSelectAll(): void {
    const allChecked = this.notifications().every(n => n.isChecked);
    this.notifications.update(list =>
      list.map(n => ({ ...n, isChecked: !allChecked }))
    );
  }

  async onDeleteSelected(): Promise<void> {
    const ids = this.notifications().filter(n => n.isChecked).map(n => n.id);
    if (ids.length === 0) return;
    try {
      await this.api.notifications.deleteMany(ids);
      this.notifications.update(list => list.filter(n => !n.isChecked));
      this.unreadCount.set(this.notifications().filter(n => !n.isRead).length);
    } catch { /* ignore */ }
  }

  async onMarkAllRead(): Promise<void> {
    try {
      await this.api.notifications.markAllRead();
      this.notifications.update(list =>
        list.map(n => ({ ...n, isRead: true }))
      );
      this.unreadCount.set(0);
    } catch { /* ignore */ }
  }

  onNotiClick(noti: AppNotification): void {
    // 읽음 처리
    if (!noti.isRead) {
      this.notifications.update(list =>
        list.map(n => n.id === noti.id ? { ...n, isRead: true } : n)
      );
      this.unreadCount.update(c => Math.max(0, c - 1));
      this.api.notifications.markRead([noti.id]).catch(() => {});
    }
    // 타겟으로 이동
    if (noti.targetType === 'content' && noti.targetId) {
      this.closeNotification();
      this.router.navigate(['/content', noti.targetId]);
    } else if (noti.type === 'FOLLOW' && noti.actorNickname) {
      this.closeNotification();
    }
  }
}
