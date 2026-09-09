import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { SignupModalService } from '../../services/signup-modal.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './signup.page.html',
  styleUrl: './signup.page.css',
})
export class SignupPage {
  private authService = inject(AuthService);
  private api = inject(ApiService);
  private router = inject(Router);
  private signupModalService = inject(SignupModalService);

  email = '';
  name = '';
  nickname = '';
  password = '';
  passwordConfirm = '';
  phone = '';
  birthday = '';

  countryCode = signal('+82');
  agreeTerms = signal(false);
  showCountryDropdown = signal(false);
  signupError = signal('');
  emailCheckError = signal('');
  emailCheckSuccess = signal(false);
  isCheckingEmail = signal(false);

  verificationCode = '';
  codeSent = signal(false);
  codeError = signal('');
  isCodeVerified = signal(false);
  isVerifying = signal(false);

  countryCodes = ['+82', '+1', '+81', '+86', '+44'];

  userInitial(): string {
    return this.nickname ? this.nickname.charAt(0).toUpperCase() : '';
  }

  onInput(field: string, event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    switch (field) {
      case 'email':
        this.email = val;
        this.emailCheckError.set('');
        this.emailCheckSuccess.set(false);
        this.codeSent.set(false);
        this.isCodeVerified.set(false);
        this.codeError.set('');
        break;
      case 'nickname': this.nickname = val; break;
      case 'name': this.name = val; break;
      case 'password': this.password = val; break;
      case 'passwordConfirm': this.passwordConfirm = val; break;
      case 'phone': this.phone = val; break;
      case 'birthday': this.birthday = val; break;
    }
  }

  onCodeInput(event: Event): void {
    this.verificationCode = (event.target as HTMLInputElement).value;
    this.codeError.set('');
  }

  toggleTerms(): void {
    this.agreeTerms.update(v => !v);
  }

  async checkEmailDuplicate(): Promise<void> {
    if (!this.email) return;

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      this.emailCheckError.set('올바른 이메일 형식을 입력해주세요.');
      return;
    }

    this.emailCheckError.set('');
    this.emailCheckSuccess.set(false);
    this.isCheckingEmail.set(true);

    try {
      const result = await this.api.auth.checkEmail({ email: this.email });
      if (!result.available) {
        this.emailCheckError.set('이미 가입된 이메일입니다.');
        this.isCheckingEmail.set(false);
        return;
      }

      this.emailCheckSuccess.set(true);

      // 중복확인 성공 → 바로 인증번호 발송
      await this.api.auth.sendVerification({ email: this.email });
      this.codeSent.set(true);
    } catch (e: unknown) {
      const err = e as Record<string, Record<string, string>>;
      this.emailCheckError.set(err['error']?.['error'] || '인증번호 발송에 실패했습니다.');
    }

    this.isCheckingEmail.set(false);
  }

  async verifyCode(): Promise<void> {
    const code = this.verificationCode.trim();
    if (!code) {
      this.codeError.set('인증번호를 입력해주세요.');
      return;
    }

    this.isVerifying.set(true);
    this.codeError.set('');

    try {
      const result = await this.api.auth.verifyCode({ email: this.email, code });
      if (result.verified) {
        this.isCodeVerified.set(true);
      }
    } catch {
      this.codeError.set('인증번호가 일치하지 않습니다.');
    }

    this.isVerifying.set(false);
  }

  toggleCountryDropdown(): void {
    this.showCountryDropdown.update(v => !v);
  }

  selectCountryCode(code: string): void {
    this.countryCode.set(code);
    this.showCountryDropdown.set(false);
  }

  get passwordMismatch(): boolean {
    return this.passwordConfirm.length > 0 && this.password !== this.passwordConfirm;
  }

  async onSignup(): Promise<void> {
    if (!this.email || !this.nickname || !this.password) {
      this.signupError.set('이메일, 닉네임, 비밀번호를 모두 입력해주세요.');
      return;
    }
    if (!this.isCodeVerified()) {
      this.signupError.set('이메일 인증을 완료해주세요.');
      return;
    }
    if (this.passwordMismatch) {
      this.signupError.set('비밀번호가 일치하지 않습니다.');
      return;
    }

    this.signupError.set('');

    try {
      const result = await this.authService.register({
        email: this.email,
        password: this.password,
        name: this.name,
        nickname: this.nickname,
        phone: this.phone,
        birthday: this.birthday,
      });

      if (result.success) {
        this.signupModalService.open(this.nickname, '');
        this.router.navigate(['/']);
      } else {
        console.error('회원가입 실패:', result.error);
        this.signupError.set(result.error || '회원가입에 실패했습니다.');
      }
    } catch (e) {
      console.error('회원가입 에러:', e);
      this.signupError.set('서버에 연결할 수 없습니다.');
    }
  }
}
