import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './reset-password.page.html',
  styleUrl: './reset-password.page.css',
})
export class ResetPasswordPage implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  token = '';
  newPassword = '';
  confirmPassword = '';

  isSubmitting = signal(false);
  successMessage = signal('');
  errorMessage = signal('');
  tokenError = signal(false);

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.token = params['token'] || '';
      if (!this.token) {
        this.tokenError.set(true);
        this.errorMessage.set('유효하지 않은 접근입니다.');
      }
    });
  }

  onInput(field: string, event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    if (field === 'newPassword') this.newPassword = val;
    if (field === 'confirmPassword') this.confirmPassword = val;
    this.errorMessage.set('');
  }

  get passwordMismatch(): boolean {
    return this.confirmPassword.length > 0 && this.newPassword !== this.confirmPassword;
  }

  async onSubmit(): Promise<void> {
    if (!this.newPassword || !this.confirmPassword) {
      this.errorMessage.set('비밀번호를 입력해주세요.');
      return;
    }
    if (this.newPassword.length < 6) {
      this.errorMessage.set('비밀번호는 6자 이상이어야 합니다.');
      return;
    }
    if (this.passwordMismatch) {
      this.errorMessage.set('비밀번호가 일치하지 않습니다.');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    try {
      const result = await this.api.auth.confirmResetPassword({
        token: this.token,
        newPassword: this.newPassword,
      });
      this.successMessage.set(result.message || '비밀번호가 성공적으로 변경되었습니다.');
    } catch (e: unknown) {
      const err = e as { error?: { error?: string } };
      const msg = err?.error?.error || '비밀번호 재설정에 실패했습니다. 링크가 만료되었을 수 있습니다.';
      this.errorMessage.set(msg);
    }

    this.isSubmitting.set(false);
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
