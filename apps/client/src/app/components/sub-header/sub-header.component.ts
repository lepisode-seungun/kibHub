import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';

export interface SubNavTab {
  id: string;
  label: string;
  route: string;
}

@Component({
  selector: 'app-sub-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sub-header.component.html',
  styleUrl: './sub-header.component.css',
})
export class SubHeaderComponent {
  private router = inject(Router);

  tabs: SubNavTab[] = [
    { id: 'bootcamp-intro', label: '부트캠프 소개', route: '/bootcamp-intro' },
    { id: 'k-digital', label: '부트캠프 목록', route: '/k-digital' },
    { id: 'reviews', label: '수강생 포트폴리오', route: '/student-portfolio' },
    { id: 'hall-of-fame', label: '명예의전당', route: '/hall-of-fame' },
  ];

  /** 현재 URL 기반으로 활성 탭 추적 */
  activeTabId = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => {
        const url = e.urlAfterRedirects.split('?')[0];
        const tab = this.tabs.find((t) => url === t.route || url.startsWith(t.route + '/'));
        return tab?.id ?? '';
      })
    ),
    { initialValue: this.getInitialTab() }
  );

  private getInitialTab(): string {
    const url = this.router.url.split('?')[0];
    const tab = this.tabs.find((t) => url === t.route || url.startsWith(t.route + '/'));
    return tab?.id ?? '';
  }
}
