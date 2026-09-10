import { Component, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-withdraw',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './withdraw.page.html',
  styleUrls: ['./withdraw.page.css'],
})
export class WithdrawPage {
  private router = inject(Router);
  private api = inject(ApiService);
  private authService = inject(AuthService);

  agreed = signal(false);
  userEmail = computed(() => this.authService.currentUser()?.email || '');
  password = '';
  reason = '';
  errorMessage = signal('');
  showConfirmModal = signal(false);

  toggleAgreed(): void {
    this.agreed.update(v => !v);
  }

  onPasswordInput(event: Event): void {
    this.password = (event.target as HTMLInputElement).value;
  }

  onReasonInput(event: Event): void {
    this.reason = (event.target as HTMLTextAreaElement).value;
  }

  onCancel(): void {
    this.router.navigate(['/profile-edit']);
  }

  async onWithdraw(): Promise<void> {
    if (!this.agreed()) return;
    if (!this.password) {
      this.errorMessage.set('비밀번호를 입력해주세요.');
      return;
    }
    this.errorMessage.set('');
    this.showConfirmModal.set(true);
  }

  closeConfirmModal(): void {
    this.showConfirmModal.set(false);
  }

  async confirmWithdraw(): Promise<void> {
    this.showConfirmModal.set(false);
    this.errorMessage.set('');
    try {
      await this.api.auth.withdraw({ password: this.password, reason: this.reason });
      await this.authService.logout();
      this.router.navigate(['/']);
    } catch {
      this.errorMessage.set('비밀번호를 확인해주세요.');
    }
  }
}
