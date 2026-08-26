import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../shared/toast/toast.service';
import { inject } from '@angular/core';

@Component({
  selector: 'adm-business-info',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './business-info.page.html',
  styleUrl: './business-info.page.css',
})
export class BusinessInfoPage {
  private toast = inject(ToastService);

  businessInfoExpanded = signal(true);

  form = signal({
    companyName: '',
    representativeName: '',
    name: '',
    businessType: '',
    address: '',
    businessNumber: '',
  });

  updateField(field: string, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.form.update(f => ({ ...f, [field]: value }));
  }

  cancel(): void {
    this.form.set({
      companyName: '',
      representativeName: '',
      name: '',
      businessType: '',
      address: '',
      businessNumber: '',
    });
  }

  register(): void {
    this.toast.success('등록 완료 되었습니다.');
  }
}
