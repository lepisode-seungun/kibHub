import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './terms.page.html',
  styleUrl: './terms.page.css',
})
export class TermsPage implements OnInit {
  private api = inject(ApiService);

  termsContent = signal('');
  isLoading = signal(true);

  async ngOnInit(): Promise<void> {
    try {
      const result = await this.api.siteSettings.get('terms_of_service');
      this.termsContent.set(result.value || '');
    } catch {
      this.termsContent.set('');
    } finally {
      this.isLoading.set(false);
    }
  }
}
