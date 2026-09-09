import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * 인증 가드: 로그인된 사용자만 접근 허용
 * 비로그인 시 /login 으로 리다이렉트
 */
export const authGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // auth 체크 대기 (최대 5초)
  for (let i = 0; i < 50; i++) {
    if (authService.authChecked()) break;
    await new Promise(r => setTimeout(r, 100));
  }

  const user = authService.currentUser();
  if (!user) {
    router.navigate(['/login']);
    return false;
  }

  return true;
};
