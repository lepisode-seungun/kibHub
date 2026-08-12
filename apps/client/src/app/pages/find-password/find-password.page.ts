import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-find-password',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './find-password.page.html',
  styleUrl: './find-password.page.css',
})
export class FindPasswordPage {
  email = '';

  onEmailInput(event: Event): void {
    this.email = (event.target as HTMLInputElement).value;
  }

  onFindPassword(): void {
    if (!this.email) return;
    // 추후 API 연결
  }
}
