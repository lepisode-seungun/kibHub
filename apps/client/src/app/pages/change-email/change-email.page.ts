import { Component, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-change-email',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './change-email.page.html',
  styleUrls: ['./change-email.page.css'],
})
export class ChangeEmailPage {
  private router = inject(Router);
  private authService = inject(AuthService);
  private api = inject(ApiService);

  currentEmail = computed(() => this.authService.currentUser()?.email ?? '');
  newEmail = '';
  emailError = signal('');
  emailValid = signal(false);
  isChecking = signal(false);

  verificationCode = '';
  codeSent = signal(false);
  codeVerified = signal(false);
  codeError = signal('');
  isSendingCode = signal(false);
  isVerifying = signal(false);

  onNewEmailChange(): void {
    this.emailError.set('');
    this.emailValid.set(false);
    this.codeSent.set(false);
    this.codeVerified.set(false);
  }

  async checkEmail(): Promise<void> {
    console.log('[checkEmail] 함수 진입, newEmail:', this.newEmail);
    const email = this.newEmail.trim();
    if (!email) {
      console.log('[checkEmail] 이메일 빈값');
      this.emailError.set('이메일을 입력해주세요.');
      return;
    }

    if (email === this.currentEmail()) {
      console.log('[checkEmail] 현재 이메일과 동일');
      this.emailError.set('현재 사용 중인 이메일과 동일합니다.');
      return;
    }

    this.isChecking.set(true);
    this.emailError.set('');

    try {
      console.log('[checkEmail] API 호출 시작');
      const result = await this.api.auth.checkEmail({ email });
      console.log('[checkEmail] 중복확인 결과:', result);

      if (!result.available) {
        this.emailError.set('이미 가입된 이메일입니다.');
        this.isChecking.set(false);
        return;
      }

      this.emailValid.set(true);

      console.log('[checkEmail] 인증번호 발송 시작');
      await this.api.auth.sendVerification({ email });
      console.log('[checkEmail] 인증번호 발송 성공');
      this.codeSent.set(true);
    } catch (e: any) {
      console.error('[checkEmail] 에러:', e);
      this.emailError.set(e?.error?.error || '인증번호 발송에 실패했습니다.');
    }

    this.isChecking.set(false);
  }

  async resendCode(): Promise<void> {
    const email = this.newEmail.trim();
    if (!email) return;

    this.isSendingCode.set(true);
    this.codeError.set('');

    try {
      await this.api.auth.sendVerification({ email });
      this.codeSent.set(true);
    } catch {
      this.codeError.set('인증번호 발송에 실패했습니다.');
    }

    this.isSendingCode.set(false);
  }

  async verifyCode(): Promise<void> {
    const code = this.verificationCode.trim();
    if (!code) {
      this.codeError.set('인증번호를 입력해주세요.');
      return;
    }

    this.isVerifying.set(true);

    try {
      const result = await this.api.auth.verifyCode({ email: this.newEmail.trim(), code });
      if (result.verified) {
        this.codeVerified.set(true);
      }
    } catch {
      this.codeError.set('인증번호가 올바르지 않거나 만료되었습니다.');
    }

    this.isVerifying.set(false);
  }

  cancel(): void {
    this.router.navigate(['/profile']);
  }

  async confirm(): Promise<void> {
    if (!this.codeVerified()) {
      this.codeError.set('이메일 인증을 완료해주세요.');
      return;
    }

    try {
      await this.api.auth.changeEmail({
        newEmail: this.newEmail.trim(),
      });
      await this.authService.refreshUser();
      this.router.navigate(['/profile']);
    } catch {
      this.emailError.set('이메일 변경에 실패했습니다.');
    }
  }

  goBack(): void {
    this.router.navigate(['/profile']);
  }
}
