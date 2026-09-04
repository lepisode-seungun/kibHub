import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './login.page.html',
  styleUrl: './login.page.css',
})
export class LoginPage {
  private authService = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  autoLogin = signal(false);
  showPasswordError = signal(false);
  errorMessage = signal('');

  onEmailInput(event: Event): void {
    this.email = (event.target as HTMLInputElement).value;
  }

  onPasswordInput(event: Event): void {
    this.password = (event.target as HTMLInputElement).value;
  }

  toggleAutoLogin(): void {
    this.autoLogin.update(v => !v);
  }

  async onLogin(): Promise<void> {
    if (!this.email || !this.password) return;
    const result = await this.authService.login(this.email, this.password);
    if (result.success) {
      this.router.navigate(['/']);
    } else {
      this.errorMessage.set(result.error || '이메일 또는 비밀번호가 올바르지 않습니다.');
      this.showPasswordError.set(true);
    }
  }
}
