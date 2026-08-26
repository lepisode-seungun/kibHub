import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface AdminUser {
  id: number;
  email: string;
  nickname: string;
  role: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private platformId = inject(PLATFORM_ID);
  private _currentUser = signal<AdminUser | null>(null);
  private _authChecked = signal(false);

  readonly currentUser = this._currentUser.asReadonly();
  readonly isLoggedIn = computed(() => this._currentUser() !== null);
  readonly authChecked = this._authChecked.asReadonly();

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.checkAuth();
    }
  }

  private async checkAuth(): Promise<void> {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        this._currentUser.set(data.user);
      }
    } catch {
      // ignore
    } finally {
      this._authChecked.set(true);
    }
  }

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

  async logout(): Promise<void> {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch { /* ignore */ }
    this._currentUser.set(null);
  }
}
