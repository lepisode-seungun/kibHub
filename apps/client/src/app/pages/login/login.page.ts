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
    const success = await this.authService.login(this.email, this.password);
    if (success) {
      this.router.navigate(['/']);
    } else {
      this.showPasswordError.set(true);
    }
  }
}
