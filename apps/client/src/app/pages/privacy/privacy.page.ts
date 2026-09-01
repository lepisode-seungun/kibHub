import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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

  privacyContent = signal('');
  isLoading = signal(true);

  async ngOnInit(): Promise<void> {
    try {
      const result = await this.api.siteSettings.get('privacy_policy');
      this.privacyContent.set(result.value || '');
    } catch {
      this.privacyContent.set('');
    } finally {
      this.isLoading.set(false);
    }
  }
}
