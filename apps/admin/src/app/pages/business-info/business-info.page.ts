import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../shared/toast/toast.service';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'adm-business-info',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './business-info.page.html',
  styleUrl: './business-info.page.css',
})
export class BusinessInfoPage implements OnInit {
  private toast = inject(ToastService);
  private api = inject(ApiService);

  businessInfoExpanded = signal(true);
  isSaving = signal(false);

  form = signal({
    companyName: '',
    representativeName: '',
    name: '',
    businessType: '',
    address: '',
    businessNumber: '',
    phone: '',
    email: '',
  });

  async ngOnInit(): Promise<void> {
    try {
      const result = await this.api.siteSettings.get('business_info');
      if (result.value) {
        const saved = JSON.parse(result.value);
        this.form.set({ ...this.form(), ...saved });
      }
    } catch {
      // 아직 저장된 데이터가 없는 경우
    }
  }

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
      phone: '',
      email: '',
    });
  }

  async register(): Promise<void> {
    if (this.isSaving()) return;
    this.isSaving.set(true);
    try {
      await this.api.siteSettings.set('business_info', JSON.stringify(this.form()));
      this.toast.success('사업자 정보가 저장되었습니다.');
    } catch {
      this.toast.error('저장에 실패했습니다.');
    } finally {
      this.isSaving.set(false);
    }
  }
}
