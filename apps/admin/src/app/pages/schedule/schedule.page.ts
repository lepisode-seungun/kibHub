import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../shared/toast/toast.service';
import { TextEditorComponent } from '../../components/text-editor/text-editor.component';

@Component({
  selector: 'adm-schedule',
  standalone: true,
  imports: [CommonModule, TextEditorComponent],
  templateUrl: './schedule.page.html',
  styleUrl: './schedule.page.css',
})
export class SchedulePage implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);

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

  // 에디터에서 변경된 HTML을 draft에 저장
  private termsDraft = '';
  private privacyDraft = '';

  onTermsChange(html: string): void {
    this.termsDraft = html;
  }

  onPrivacyChange(html: string): void {
    this.privacyDraft = html;
  }

  async saveTerms(): Promise<void> {
    if (this.isSaving()) return;
    this.isSaving.set(true);
    try {
      await this.api.siteSettings.set('terms_of_service', this.termsDraft || this.termsContent());
      this.toast.success('이용약관이 저장되었습니다.');
    } catch {
      this.toast.error('저장에 실패했습니다.');
    } finally {
      this.isSaving.set(false);
    }
  }

  async savePrivacy(): Promise<void> {
    if (this.isSaving()) return;
    this.isSaving.set(true);
    try {
      await this.api.siteSettings.set('privacy_policy', this.privacyDraft || this.privacyContent());
      this.toast.success('개인정보처리방침이 저장되었습니다.');
    } catch {
      this.toast.error('저장에 실패했습니다.');
    } finally {
      this.isSaving.set(false);
    }
  }
}
