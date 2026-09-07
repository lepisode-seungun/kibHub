import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-find-email',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './find-email.page.html',
  styleUrl: './find-email.page.css',
})
export class FindEmailPage implements OnInit, OnDestroy {
  private api = inject(ApiService);

  ngOnInit(): void {
    document.body.style.overflow = 'hidden';
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
  }

  name = '';
  phone = '';
  birthday = '';
  countryCode = signal('+82');
  showCountryDropdown = signal(false);
  foundEmail = signal('');

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

  findError = signal('');

  async onFindEmail(): Promise<void> {
    this.findError.set('');
    this.foundEmail.set('');
    if (!this.phone || !this.birthday) {
      this.findError.set('연락처와 생년월일을 모두 입력해주세요.');
      return;
    }
    try {
      const result = await this.api.auth.findEmail({ phone: this.phone, birthday: this.birthday });
      this.foundEmail.set(result.email);
    } catch {
      this.findError.set('일치하는 사용자가 없습니다. 정보를 확인 후 다시 시도해주세요.');
    }
  }
}

