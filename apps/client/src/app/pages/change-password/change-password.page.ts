import { Component, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './change-password.page.html',
  styleUrls: ['./change-password.page.css'],
})
export class ChangePasswordPage {
  private router = inject(Router);
  private authService = inject(AuthService);
  private api = inject(ApiService);

  currentPassword = signal('');
  newPassword = signal('');
  confirmPassword = signal('');

  showCurrentPw = signal(false);
  showNewPw = signal(false);
  showConfirmPw = signal(false);

  passwordError = signal('');
  successMessage = signal('');
  passwordMatch = computed(() => {
    const np = this.newPassword();
    const cp = this.confirmPassword();
    if (!np || !cp) return null;
    return np === cp;
  });

  onCurrentPwInput(event: Event): void {
    this.currentPassword.set((event.target as HTMLInputElement).value);
    this.passwordError.set('');
  }

  onNewPwInput(event: Event): void {
    this.newPassword.set((event.target as HTMLInputElement).value);
  }

  onConfirmPwInput(event: Event): void {
    this.confirmPassword.set((event.target as HTMLInputElement).value);
  }

  toggleCurrentPw(): void { this.showCurrentPw.update(v => !v); }
  toggleNewPw(): void { this.showNewPw.update(v => !v); }
  toggleConfirmPw(): void { this.showConfirmPw.update(v => !v); }

  cancel(): void {
    this.router.navigate(['/profile']);
  }

  async confirm(): Promise<void> {
    if (!this.currentPassword().trim()) {
      this.passwordError.set('현재 비밀번호를 입력해주세요.');
      return;
    }
    if (!this.newPassword().trim()) {
      this.passwordError.set('새 비밀번호를 입력해주세요.');
      return;
    }
    if (this.passwordMatch() !== true) {
      this.passwordError.set('비밀번호가 일치하지 않습니다.');
      return;
    }

    try {
      await this.api.auth.changePassword({
        currentPassword: this.currentPassword(),
        newPassword: this.newPassword(),
      });
      this.successMessage.set('비밀번호가 변경되었습니다.');
      setTimeout(() => this.router.navigate(['/profile']), 1500);
    } catch (e: unknown) {
      const err = e as Record<string, Record<string, string>>;
      const msg = err['error']?.['error'] || err['error']?.['message'] || '비밀번호 변경에 실패했습니다.';
      this.passwordError.set(msg);
    }
  }

  goBack(): void {
    this.router.navigate(['/profile']);
  }
}
