import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-find-password',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './find-password.page.html',
  styleUrl: './find-password.page.css',
})
export class FindPasswordPage {
  private api = inject(ApiService);

  email = '';
  isSubmitting = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

  onEmailInput(event: Event): void {
    this.email = (event.target as HTMLInputElement).value;
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  async onFindPassword(): Promise<void> {
    if (!this.email) return;
    this.successMessage.set('');
    this.errorMessage.set('');
    this.isSubmitting.set(true);

    try {
      const result = await this.api.auth.resetPassword({ email: this.email });
      this.successMessage.set(result.message || '임시 비밀번호가 이메일로 발송되었습니다.');
    } catch (e: any) {
      const msg = e?.error?.error || e?.error?.message || '등록되지 않은 이메일입니다.';
      this.errorMessage.set(msg);
    }

    this.isSubmitting.set(false);
  }
}
