import { Component, inject } from '@angular/core';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { HeaderComponent } from './components/header/header.component';
import { SubHeaderComponent } from './components/sub-header/sub-header.component';

@Component({
  imports: [RouterModule, HeaderComponent, SubHeaderComponent],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected title = 'kibhub';

  private router = inject(Router);

  /** 현재 라우트가 홈('/')인지 추적 */
  isHome = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects === '/')
    ),
    { initialValue: true }
  );

  /** 현재 라우트가 로그인('/login') 또는 회원가입('/signup')인지 추적 */
  isLogin = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => ['/login', '/signup', '/find-email', '/find-password'].includes(e.urlAfterRedirects))
    ),
    { initialValue: false }
  );
}
