import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
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
  private sanitizer = inject(DomSanitizer);

  termsContent = signal<SafeHtml>('');
  isLoading = signal(true);

  async ngOnInit(): Promise<void> {
    try {
      const result = await this.api.siteSettings.get('terms_of_service');
      this.termsContent.set(this.sanitizer.bypassSecurityTrustHtml(result.value || ''));
    } catch {
      this.termsContent.set('');
    } finally {
      this.isLoading.set(false);
    }
  }
}
