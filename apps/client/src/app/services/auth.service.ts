import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface User {
  id: number;
  email: string;
  nickname: string;
  initial: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private platformId = inject(PLATFORM_ID);
  private _currentUser = signal<User | null>(null);
  private _authChecked = signal(false);

  readonly currentUser = this._currentUser.asReadonly();
  readonly isLoggedIn = computed(() => this._currentUser() !== null);
  readonly authChecked = this._authChecked.asReadonly();

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.checkAuth();
    }
    // SSR에서는 authChecked가 false로 유지 → 페이지에서 리다이렉트 안 함
  }

  /** 쿠키 토큰으로 유저 복원 (새로고침 대응) */
  private async checkAuth(): Promise<void> {
    try {
      const res = await fetch('/api/auth/me', {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        this._currentUser.set(data.user);
      }
    } catch {
      // 서버 미연결 시 무시
    } finally {
      this._authChecked.set(true);
    }
  }

  /** 로그인 */
  async login(email: string, password: string): Promise<boolean> {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) return false;

      const data = await res.json();
      this._currentUser.set(data.user);
      return true;
    } catch {
      return false;
    }
  }

  /** 회원가입 */
  async register(payload: {
    email: string;
    password: string;
    nickname: string;
    phone?: string;
    intro?: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error };
      }

      this._currentUser.set(data.user);
      return { success: true };
    } catch {
      return { success: false, error: '서버에 연결할 수 없습니다.' };
    }
  }

  /** 이메일 중복 확인 */
  async checkEmail(email: string): Promise<{ available: boolean; error?: string }> {
    try {
      const res = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { available: false, error: data.error };
      }

      return { available: data.available };
    } catch {
      return { available: false, error: '서버에 연결할 수 없습니다.' };
    }
  }

  /** 로그아웃 */
  async logout(): Promise<void> {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // 무시
    }
    this._currentUser.set(null);
  }
}
