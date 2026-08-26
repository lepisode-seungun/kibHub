import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

interface NavItem {
  label: string;
  icon: string;
  route?: string;
  action?: string;
  children?: { label: string; route: string; action?: string }[];
}

@Component({
  selector: 'adm-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.css',
})
export class AdminLayoutComponent implements OnInit {
  private router = inject(Router);

  expandedMenus = signal<Set<string>>(new Set());
  navMode = signal<'main' | 'bootcampHome'>('main');

  roleName = '최고관리자';
  roleLabel = '권한';
  currentMenuTitle = '회원관리';
  breadcrumb = '홈';

  navItems: NavItem[] = [
    { label: '회원관리', icon: 'people', route: '/members' },
    {
      label: '콘텐츠 관리',
      icon: 'article',
      children: [
        { label: '콘텐츠 목록', route: '/content' },
        { label: '신고내역', route: '/content/reports' },
      ],
    },
    {
      label: '부트캠프 관리',
      icon: 'school',
      children: [
        { label: '부트캠프 목록', route: '/bootcamp' },
        { label: '홈 관리', route: '/bootcamp/home', action: 'switchToBootcampHome' },
      ],
    },
    {
      label: '사이트 관리',
      icon: 'web',
      children: [
        { label: '부트캠프 소개', route: '/site/bootcamp-intro' },
        { label: '포트폴리오 / 명예의 전당', route: '/site/portfolio' },
        { label: '사업자 정보', route: '/site/business-info' },
        { label: '약관 관리', route: '/site/terms' },
        { label: '번역 관리', route: '/site/translation' },
      ],
    },
    {
      label: '관리자 관리',
      icon: 'admin',
      children: [
        { label: '관리자 목록', route: '/admins' },
        { label: '관리자 등록', route: '/admins/create' },
        { label: '권한 설정', route: '/admins/permissions' },
      ],
    },
    {
      label: '고객센터 관리',
      icon: 'support',
      children: [
        { label: '공지사항 관리', route: '/support/notices' },
        { label: 'FAQ 관리', route: '/support/faq' },
        { label: '1:1문의 관리', route: '/support/inquiries' },
      ],
    },
  ];

  // ===== 홈 관리 전용 네비게이션 =====
  bootcampTitle = signal('케나즈 아카데미 초급반/중급반 13기');

  homeNavItems: NavItem[] = [
    { label: '홈으로', icon: 'home', action: 'backToMain' },
    { label: '대시보드', icon: 'dashboard', route: '/bootcamp/home/dashboard' },
    { label: '지원자 관리', icon: 'applicant', route: '/bootcamp/home/applicants' },
    { label: '모집 페이지 관리', icon: 'recruitment', route: '/bootcamp/home/recruitment' },
    { label: '과정 관리', icon: 'curriculum', route: '/bootcamp/home/curriculum' },
    { label: '공지사항 관리', icon: 'notice', route: '/bootcamp/home/notices' },
  ];

  private allRoutes: { route: string; label: string; parent?: string }[] = [];

  ngOnInit(): void {
    // 모든 라우트 수집
    const collectRoutes = (items: NavItem[], parent?: string) => {
      for (const item of items) {
        if (item.route) {
          this.allRoutes.push({ route: item.route, label: item.label, parent });
        }
        if (item.children) {
          for (const child of item.children) {
            if (child.route) {
              this.allRoutes.push({ route: child.route, label: child.label, parent: item.label });
            }
          }
        }
      }
    };
    collectRoutes(this.navItems);
    collectRoutes(this.homeNavItems);

    this.syncFromUrl(this.router.url);
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd)
    ).subscribe(e => this.syncFromUrl(e.urlAfterRedirects));
  }

  private findBestMatch(url: string): { route: string; label: string; parent?: string } | null {
    let best: { route: string; label: string; parent?: string } | null = null;
    for (const r of this.allRoutes) {
      if (url === r.route || url.startsWith(r.route + '/')) {
        if (!best || r.route.length > best.route.length) {
          best = r;
        }
      }
    }
    return best;
  }

  private syncFromUrl(url: string): void {
    const match = this.findBestMatch(url);
    if (match) {
      this.currentMenuTitle = match.label;
      if (match.parent) {
        this.expandedMenus.update(set => { const s = new Set(set); s.add(match.parent!); return s; });
      }
    }
  }

  toggleMenu(label: string): void {
    this.expandedMenus.update(set => {
      const newSet = new Set(set);
      if (newSet.has(label)) {
        newSet.delete(label);
      } else {
        newSet.add(label);
      }
      return newSet;
    });
  }

  isExpanded(label: string): boolean {
    return this.expandedMenus().has(label);
  }

  isActive(route: string): boolean {
    const match = this.findBestMatch(this.router.url);
    return match?.route === route;
  }

  navigateTo(route: string, label: string, action?: string): void {
    if (action === 'switchToBootcampHome') {
      this.navMode.set('bootcampHome');
      this.currentMenuTitle = '대시보드';
      this.router.navigate(['/bootcamp/home/dashboard']);
      return;
    }
    if (action === 'backToMain') {
      this.navMode.set('main');
      this.currentMenuTitle = '부트캠프 목록';
      this.router.navigate(['/bootcamp']);
      return;
    }
    this.currentMenuTitle = label;
    this.router.navigate([route]);
  }
}
