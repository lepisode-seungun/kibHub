import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'adm-login',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login.page.html',
  styleUrl: './login.page.css',
})
export class LoginPage {
  private authService = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  autoLogin = signal(false);
  showError = signal(false);

  roleName = '채용대행사';
  roleLabel = '권한';

  onEmailInput(event: Event): void {
    this.email = (event.target as HTMLInputElement).value;
    this.showError.set(false);
  }

  onPasswordInput(event: Event): void {
    this.password = (event.target as HTMLInputElement).value;
    this.showError.set(false);
  }

  toggleAutoLogin(): void {
    this.autoLogin.update(v => !v);
  }

  async onLogin(): Promise<void> {
    if (!this.email || !this.password) return;
    const success = await this.authService.login(this.email, this.password);
    if (success) {
      this.router.navigate(['/members']);
    } else {
      this.showError.set(true);
    }
  }
}
