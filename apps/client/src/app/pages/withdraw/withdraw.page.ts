import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-withdraw',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './withdraw.page.html',
  styleUrls: ['./withdraw.page.css'],
})
export class WithdrawPage {
  private router = inject(Router);

  agreed = signal(false);

  toggleAgreed(): void {
    this.agreed.update(v => !v);
  }

  onCancel(): void {
    this.router.navigate(['/profile-edit']);
  }

  onWithdraw(): void {
    if (!this.agreed()) return;
    // TODO: API 호출 → 탈퇴 처리
    console.log('회원탈퇴 처리');
    this.router.navigate(['/']);
  }
}
