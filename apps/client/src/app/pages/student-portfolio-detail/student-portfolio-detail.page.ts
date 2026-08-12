import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-student-portfolio-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './student-portfolio-detail.page.html',
  styleUrls: ['./student-portfolio-detail.page.css'],
})
export class StudentPortfolioDetailPage {
  private location = inject(Location);

  goBack(): void {
    this.location.back();
  }

  /* 원고 뷰어 모달 */
  isViewerOpen = signal(false);
  currentViewerPage = signal(1);
  totalPages = 17;

  manuscriptImages = Array.from({ length: 17 }, (_, i) => ({
    id: i + 1,
    gradient: `linear-gradient(${135 + i * 15}deg, #2a2535 ${i * 3}%, #1a1520 ${50 + i * 2}%, #2a2035 100%)`,
  }));

  openManuscriptViewer(): void {
    this.currentViewerPage.set(1);
    this.isViewerOpen.set(true);
  }

  closeViewer(): void {
    this.isViewerOpen.set(false);
  }

  prevPage(): void {
    this.currentViewerPage.update(p => p > 1 ? p - 1 : this.totalPages);
  }

  nextPage(): void {
    this.currentViewerPage.update(p => p < this.totalPages ? p + 1 : 1);
  }

  onViewerOverlayClick(event: Event): void {
    if ((event.target as HTMLElement).classList.contains('viewer-overlay')) {
      this.closeViewer();
    }
  }

  /* ===== 문의하기 모달 ===== */
  isInquiryOpen = signal(false);
  inquiryTitle = '';
  inquiryEmail = '';
  inquiryContent = '';
  inquiryConsent = signal(false);

  canSubmitInquiry = computed(() =>
    this.inquiryTitle.trim().length > 0 &&
    this.inquiryEmail.trim().length > 0 &&
    this.inquiryContent.trim().length > 0 &&
    this.inquiryConsent()
  );

  openInquiryModal(): void {
    this.inquiryTitle = '';
    this.inquiryEmail = '';
    this.inquiryContent = '';
    this.inquiryConsent.set(false);
    this.isInquiryOpen.set(true);
  }

  closeInquiryModal(): void {
    this.isInquiryOpen.set(false);
  }

  toggleInquiryConsent(): void {
    this.inquiryConsent.update(v => !v);
  }

  submitInquiry(): void {
    if (!this.canSubmitInquiry()) return;
    // TODO: API 호출
    console.log('문의 전송:', {
      title: this.inquiryTitle,
      email: this.inquiryEmail,
      content: this.inquiryContent,
    });
    this.closeInquiryModal();
  }

  onInquiryOverlayClick(event: Event): void {
    if ((event.target as HTMLElement).classList.contains('iq-overlay')) {
      this.closeInquiryModal();
    }
  }

  /* ===== 개인정보 수집 동의 모달 ===== */
  isPrivacyOpen = signal(false);

  openPrivacyModal(): void {
    if (this.inquiryConsent()) {
      this.inquiryConsent.set(false);
    } else {
      this.isPrivacyOpen.set(true);
    }
  }

  closePrivacyModal(): void {
    this.isPrivacyOpen.set(false);
  }

  agreePrivacy(): void {
    this.inquiryConsent.set(true);
    this.isPrivacyOpen.set(false);
  }

  onPrivacyOverlayClick(event: Event): void {
    if ((event.target as HTMLElement).classList.contains('prv-overlay')) {
      this.closePrivacyModal();
    }
  }
}
