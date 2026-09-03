import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-privacy',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './privacy.page.html',
  styleUrl: './privacy.page.css',
})
export class PrivacyPage implements OnInit {
  private api = inject(ApiService);
  private sanitizer = inject(DomSanitizer);

  privacyContent = signal<SafeHtml>('');
  isLoading = signal(true);

  async ngOnInit(): Promise<void> {
    try {
      const result = await this.api.siteSettings.get('privacy_policy');
      this.privacyContent.set(this.sanitizer.bypassSecurityTrustHtml(result.value || ''));
    } catch {
      this.privacyContent.set('');
    } finally {
      this.isLoading.set(false);
    }
  }
}
