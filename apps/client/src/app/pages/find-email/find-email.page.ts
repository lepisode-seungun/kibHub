import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-find-email',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './find-email.page.html',
  styleUrl: './find-email.page.css',
})
export class FindEmailPage {
  name = '';
  phone = '';
  birthday = '';
  countryCode = signal('+82');
  showCountryDropdown = signal(false);

  countryCodes = ['+82', '+1', '+81', '+86', '+44'];

  onInput(field: string, event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    switch (field) {
      case 'name': this.name = val; break;
      case 'phone': this.phone = val; break;
      case 'birthday': this.birthday = val; break;
    }
  }

  toggleCountryDropdown(): void {
    this.showCountryDropdown.update(v => !v);
  }

  selectCountryCode(code: string): void {
    this.countryCode.set(code);
    this.showCountryDropdown.set(false);
  }

  onFindEmail(): void {
    if (!this.name || !this.phone || !this.birthday) return;
    // 추후 API 연결
  }
}
