import { Component, signal, computed, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { SearchService } from '../../services/search.service';
import { AuthService } from '../../services/auth.service';

interface Language {
  code: string;
  label: string;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent {
  private searchService = inject(SearchService);
  private router = inject(Router);
  readonly authService = inject(AuthService);

  activeMenu = '명예의전당';
  searchPlaceholder = '질문, 유저명, 댓글까지 자유롭게 검색해보세요.';
  searchValue = '';

  readonly isLoggedIn = this.authService.isLoggedIn;
  readonly userName = computed(() => this.authService.currentUser()?.nickname ?? '');
  readonly userInitial = computed(() => this.authService.currentUser()?.initial ?? '');

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

  toggleSidebar(): void {
    this.isSidebarOpen.update(v => !v);
    document.body.style.overflow = this.isSidebarOpen() ? 'hidden' : '';
  }

  closeSidebar(): void {
    this.isSidebarOpen.set(false);
    document.body.style.overflow = '';
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
    this.isLogoutModalOpen.set(true);
  }

  closeLogoutModal(): void {
    this.isLogoutModalOpen.set(false);
  }

  async confirmLogout(): Promise<void> {
    this.isLogoutModalOpen.set(false);
    await this.authService.logout();
    this.router.navigate(['/']);
  }

  /* ===== 알림 패널 ===== */
  isNotificationOpen = signal(false);

  notifications: Notification[] = [
    { id: 1, label: '부트캠프 지원 완료', target: '네원 부트캠프 13기', message: '부트캠프에 지원이 완료되었습니다.', date: '2024. 01. 01 (월) 13:24', isRead: false, isChecked: false },
    { id: 2, label: '부트캠프 지원 완료', target: '네원 부트캠프 13기', message: '부트캠프에 지원이 완료되었습니다.', date: '2024. 01. 01 (월) 13:24', isRead: true, isChecked: false },
    { id: 3, label: '부트캠프 지원 완료', target: '네원 부트캠프 13기', message: '부트캠프에 지원이 완료되었습니다.', date: '2024. 01. 01 (월) 13:24', isRead: false, isChecked: false },
    { id: 4, label: '부트캠프 지원 완료', target: '네원 부트캠프 13기', message: '부트캠프에 지원이 완료되었습니다.', date: '2024. 01. 01 (월) 13:24', isRead: false, isChecked: false },
    { id: 5, label: '부트캠프 지원 완료', target: '네원 부트캠프 13기', message: '부트캠프에 지원이 완료되었습니다.', date: '2024. 01. 01 (월) 13:24', isRead: false, isChecked: false },
  ];

  openNotification(): void {
    this.closeSidebar();
    this.isNotificationOpen.set(true);
  }

  closeNotification(): void {
    this.isNotificationOpen.set(false);
  }

  toggleNotiCheck(noti: Notification): void {
    noti.isChecked = !noti.isChecked;
  }

  onSelectAll(): void {
    const allChecked = this.notifications.every(n => n.isChecked);
    this.notifications.forEach(n => n.isChecked = !allChecked);
  }

  onDeleteSelected(): void {
    this.notifications = this.notifications.filter(n => !n.isChecked);
  }

  onMarkAllRead(): void {
    this.notifications.forEach(n => n.isRead = true);
  }
}

interface Notification {
  id: number;
  label: string;
  target: string;
  message: string;
  date: string;
  isRead: boolean;
  isChecked: boolean;
}
