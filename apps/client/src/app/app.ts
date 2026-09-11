import { Component, inject } from '@angular/core';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { HeaderComponent } from './components/header/header.component';
import { SubHeaderComponent } from './components/sub-header/sub-header.component';
import { SignupCompleteModalComponent } from './components/signup-complete-modal/signup-complete-modal.component';

@Component({
  imports: [RouterModule, HeaderComponent, SubHeaderComponent, SignupCompleteModalComponent],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected title = 'kibhub';

  private router = inject(Router);

  /** 현재 라우트가 홈('/') 또는 홈 상세페이지('/content/...')인지 추적 */
  isHome = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => {
        const url = e.urlAfterRedirects.split('?')[0];
        return url === '/' || url.startsWith('/content/');
      })
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

  /** 현재 라우트가 업로드 페이지인지 추적 */
  isUpload = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects.startsWith('/upload'))
    ),
    { initialValue: false }
  );

  /** 모바일에서 글로벌 헤더/서브헤더를 숨길 페이지인지 추적 */
  isMobileHeaderHidden = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => {
        const url = e.urlAfterRedirects.split('?')[0];
        return url.startsWith('/change-email')
          || url.startsWith('/change-password')
          || /^\/my-bootcamp\/\d+/.test(url);
      })
    ),
    { initialValue: false }
  );

  /** 현재 라우트가 고객센터 페이지인지 추적 */
  isCustomerCenter = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects.split('?')[0].startsWith('/customer-center'))
    ),
    { initialValue: window.location.pathname.startsWith('/customer-center') }
  );

  /** 현재 라우트가 내 부트캠프 관련 페이지인지 추적 */
  isMyBootcamp = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects.split('?')[0].startsWith('/my-bootcamp'))
    ),
    { initialValue: window.location.pathname.startsWith('/my-bootcamp') }
  );
}
