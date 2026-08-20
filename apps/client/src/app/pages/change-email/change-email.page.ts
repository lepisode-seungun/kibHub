import { Component, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-change-email',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './change-email.page.html',
  styleUrls: ['./change-email.page.css'],
})
export class ChangeEmailPage {
  private router = inject(Router);
  private authService = inject(AuthService);

  currentEmail = computed(() => this.authService.currentUser()?.email ?? '');
  newEmail = signal('');
  emailError = signal('');
  emailValid = signal(false);
  isChecking = signal(false);

  verificationCode = signal('');

  onNewEmailInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.newEmail.set(input.value);
    this.emailError.set('');
    this.emailValid.set(false);
  }

  async checkEmail(): Promise<void> {
    const email = this.newEmail().trim();
    if (!email) {
      this.emailError.set('이메일을 입력해주세요.');
      return;
    }

    if (email === this.currentEmail()) {
      this.emailError.set('현재 사용 중인 이메일과 동일합니다.');
      return;
    }

    this.isChecking.set(true);
    this.emailError.set('');

    const result = await this.authService.checkEmail(email);

    if (!result.available) {
      this.emailError.set('이미 가입된 이메일입니다.');
    } else {
      this.emailValid.set(true);
    }

    this.isChecking.set(false);
  }

  onCodeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.verificationCode.set(input.value);
  }

  verifyCode(): void {
    const code = this.verificationCode().trim();
    if (!code) return;
    // TODO: 인증번호 검증 API 연동
  }

  cancel(): void {
    this.router.navigate(['/profile']);
  }

  confirm(): void {
    // TODO: API 연동
    this.router.navigate(['/profile']);
  }

  goBack(): void {
    this.router.navigate(['/profile']);
  }
}
