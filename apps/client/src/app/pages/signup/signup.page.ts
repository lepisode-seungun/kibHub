import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

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

  countryCodes = ['+82', '+1', '+81', '+86', '+44'];

  onInput(field: string, event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    switch (field) {
      case 'email': this.email = val; break;
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
    if (!this.email || !this.nickname || !this.password) return;
    if (this.passwordMismatch) return;

    const result = await this.authService.register({
      email: this.email,
      password: this.password,
      nickname: this.nickname,
      phone: this.phone,
      intro: this.intro,
    });

    if (result.success) {
      this.router.navigate(['/']);
    } else {
      this.signupError.set(result.error || '회원가입에 실패했습니다.');
    }
  }
}
