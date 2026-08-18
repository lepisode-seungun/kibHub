import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
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
  private router = inject(Router);
  private signupModalService = inject(SignupModalService);

  email = '';
  nickname = '';
  password = '';
  passwordConfirm = '';
  phone = '';
  intro = '';
  countryCode = signal('+82');
  agreeTerms = signal(false);
  showCountryDropdown = signal(false);
  signupError = signal('');
  emailCheckError = signal('');
  emailCheckSuccess = signal(false);
  verificationCode = '';
  isCodeVerified = signal(false);

  countryCodes = ['+82', '+1', '+81', '+86', '+44'];

  userInitial(): string {
    return this.nickname ? this.nickname.charAt(0).toUpperCase() : '';
  }

  onInput(field: string, event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    switch (field) {
      case 'email': this.email = val; this.emailCheckError.set(''); this.emailCheckSuccess.set(false); break;
      case 'nickname': this.nickname = val; break;
      case 'password': this.password = val; break;
      case 'passwordConfirm': this.passwordConfirm = val; break;
      case 'phone': this.phone = val; break;
      case 'intro': this.intro = val; break;
    }
  }

  toggleTerms(): void {
    this.agreeTerms.update(v => !v);
  }

  async checkEmailDuplicate(): Promise<void> {
    if (!this.email) return;
    this.emailCheckError.set('');
    this.emailCheckSuccess.set(false);

    const result = await this.authService.checkEmail(this.email);
    if (result.available) {
      this.emailCheckSuccess.set(true);
    } else {
      this.emailCheckError.set(result.error || '이미 가입된 이메일입니다.');
    }
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
    if (this.passwordMismatch) {
      this.signupError.set('비밀번호가 일치하지 않습니다.');
      return;
    }

    this.signupError.set('');

    try {
      const result = await this.authService.register({
        email: this.email,
        password: this.password,
        nickname: this.nickname,
        phone: this.phone,
        intro: this.intro,
      });

      if (result.success) {
        // 서비스에 모달 상태 저장 후 홈으로 라우팅
        this.signupModalService.open(this.nickname, this.intro);
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
