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
  successMessage = signal('');
  errorMessage = signal('');

  onEmailInput(event: Event): void {
    this.email = (event.target as HTMLInputElement).value;
  }

  async onFindPassword(): Promise<void> {
    if (!this.email) return;
    this.successMessage.set('');
    this.errorMessage.set('');
    try {
      const result = await this.api.auth.resetPassword({ email: this.email });
      this.successMessage.set(result.message || '비밀번호 재설정 메일을 발송했습니다.');
    } catch {
      this.errorMessage.set('존재하지 않는 이메일입니다.');
    }
  }
}
