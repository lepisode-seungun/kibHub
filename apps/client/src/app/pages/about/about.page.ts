import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';

interface BusinessInfo {
  companyName: string;
  representativeName: string;
  name: string;
  businessType: string;
  address: string;
  businessNumber: string;
  phone: string;
  email: string;
}

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './about.page.html',
  styleUrl: './about.page.css',
})
export class AboutPage implements OnInit {
  private api = inject(ApiService);

  info = signal<BusinessInfo>({
    companyName: '',
    representativeName: '',
    name: '',
    businessType: '',
    address: '',
    businessNumber: '',
    phone: '',
    email: '',
  });

  isLoading = signal(true);

  async ngOnInit(): Promise<void> {
    try {
      const result = await this.api.siteSettings.get('business_info');
      if (result.value) {
        const saved = JSON.parse(result.value);
        this.info.set({ ...this.info(), ...saved });
      }
    } catch {
      // 데이터 없음
    } finally {
      this.isLoading.set(false);
    }
  }
}
