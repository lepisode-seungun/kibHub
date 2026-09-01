import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'adm-schedule',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './schedule.page.html',
  styleUrl: './schedule.page.css',
})
export class SchedulePage implements OnInit {
  private api = inject(ApiService);

  activeTab = signal<'schedule' | 'management'>('schedule');

  // 탭별 에디터 내용
  termsContent = signal('');
  privacyContent = signal('');

  isSaving = signal(false);

  async ngOnInit(): Promise<void> {
    await Promise.all([this.loadTerms(), this.loadPrivacy()]);
  }

  setTab(tab: 'schedule' | 'management'): void {
    this.activeTab.set(tab);
  }

  private async loadTerms(): Promise<void> {
    try {
      const result = await this.api.siteSettings.get('terms_of_service');
      this.termsContent.set(result.value || '');
    } catch {
      this.termsContent.set('');
    }
  }

  private async loadPrivacy(): Promise<void> {
    try {
      const result = await this.api.siteSettings.get('privacy_policy');
      this.privacyContent.set(result.value || '');
    } catch {
      this.privacyContent.set('');
    }
  }

  updateTermsContent(event: Event): void {
    const value = (event.target as HTMLTextAreaElement).value;
    this.termsContent.set(value);
  }

  updatePrivacyContent(event: Event): void {
    const value = (event.target as HTMLTextAreaElement).value;
    this.privacyContent.set(value);
  }

  async saveTerms(): Promise<void> {
    if (this.isSaving()) return;
    this.isSaving.set(true);
    try {
      await this.api.siteSettings.set('terms_of_service', this.termsContent());
      alert('이용약관이 저장되었습니다.');
    } catch {
      alert('저장에 실패했습니다.');
    } finally {
      this.isSaving.set(false);
    }
  }

  async savePrivacy(): Promise<void> {
    if (this.isSaving()) return;
    this.isSaving.set(true);
    try {
      await this.api.siteSettings.set('privacy_policy', this.privacyContent());
      alert('개인정보처리방침이 저장되었습니다.');
    } catch {
      alert('저장에 실패했습니다.');
    } finally {
      this.isSaving.set(false);
    }
  }
}
