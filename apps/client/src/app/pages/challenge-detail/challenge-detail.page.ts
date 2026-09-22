import { Component, signal, computed, inject, OnInit, AfterViewChecked, ElementRef, ViewChild } from '@angular/core';
import { Location } from '@angular/common';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { ImageViewerComponent, ViewerImage } from '../../components/image-viewer/image-viewer.component';

interface Challenge {
  id: number;
  title: string;
  description?: string;
  status: string;
  startDate: string;
  endDate: string;
  thumbnail?: string;
  bannerImage?: string;
  referenceImages?: string[];
  rules?: string;
  category?: string;
  difficulty?: string;
  prize?: string;
  entryCount?: number;
  _count?: { entries: number };
}

interface ChallengeEntry {
  id: number;
  title: string;
  description?: string;
  images: string[];
  likeCount: number;
  isLiked?: boolean;
  isWinner?: boolean;
  rank?: number;
  user?: { id: number; nickname: string; profileImage?: string };
  createdAt: string;
}

interface UploadResult {
  url: string;
}

@Component({
  selector: 'app-challenge-detail-page',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ImageViewerComponent],
  templateUrl: './challenge-detail.page.html',
  styleUrl: './challenge-detail.page.css',
})
export class ChallengeDetailPage implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  readonly authService = inject(AuthService);
  private location = inject(Location);

  challengeId = 0;
  challenge = signal<Challenge | null>(null);
  entries = signal<ChallengeEntry[]>([]);
  winners = signal<ChallengeEntry[]>([]);
  myEntry = signal<ChallengeEntry | null>(null);
  sortMode = signal<string>('latest');
  loading = signal(true);
  winnerModalOpen = signal(false);
  isLoginRequiredModalOpen = signal(false);

  // 제출 폼
  showSubmitForm = signal(false);
  isEditMode = signal(false);
  submitTitle = '';
  submitDesc = '';
  submitFiles = signal<File[]>([]);
  submitPreviews = signal<string[]>([]);
  existingImages = signal<string[]>([]);
  submitting = signal(false);

  ngOnInit(): void {
    this.challengeId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadData();
  }

  async loadData(): Promise<void> {
    this.loading.set(true);
    try {
      const [challenge, entries] = await Promise.all([
        this.api.challenges.findOne(this.challengeId),
        this.api.challenges.findEntries(this.challengeId, this.sortMode()),
      ]);
      this.challenge.set(challenge);
      this.entries.set(entries);
      const w = entries.filter((e: ChallengeEntry) => e.isWinner).sort((a: ChallengeEntry, b: ChallengeEntry) => (a.rank || 99) - (b.rank || 99));
      this.winners.set(w);
      if (challenge.status === 'ENDED' && w.length > 0) {
        this.openWinnerModal();
      }

      try {
        const my = await this.api.challenges.findMyEntry(this.challengeId);
        console.log('myEntry result:', my);
        this.myEntry.set(my);
      } catch (e) { console.log('myEntry error (not logged in?):', e); }
    } catch (e) {
      console.error(e);
    }
    this.loading.set(false);
  }

  async toggleLike(entry: ChallengeEntry): Promise<void> {
    const c = this.challenge();
    if (c?.status === 'ENDED') return;
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    try {
      const result = await this.api.challenges.toggleLike(entry.id);
      entry.isLiked = result.liked;
      entry.likeCount = entry.likeCount + (result.liked ? 1 : -1);
      this.entries.update(list =>
        list.map(e => e.id === entry.id ? { ...e, isLiked: result.liked, likeCount: entry.likeCount } : e)
      );
    } catch (err) {
      console.error('toggleLike error:', err);
    }
  }

  async setSort(mode: string): Promise<void> {
    this.sortMode.set(mode);
    const entries = await this.api.challenges.findEntries(this.challengeId, mode);
    this.entries.set(entries);
  }

  getDaysLeft(): number | null {
    const c = this.challenge();
    if (!c || c.status !== 'ACTIVE') return null;
    const diff = Math.ceil((new Date(c.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
  }

  getRankEmoji(rank: number): string {
    return rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
  }

  goBack(): void {
    this.location.back();
  }

  // ===== 수상작 모달 =====
  openWinnerModal(): void {
    this.winnerModalOpen.set(true);
    document.body.style.overflow = 'hidden';
  }

  closeWinnerModal(): void {
    this.winnerModalOpen.set(false);
    document.body.style.overflow = '';
  }

  // ===== 이미지 모달 =====
  modalEntry = signal<ChallengeEntry | null>(null);
  modalImageIndex = signal(0);
  descExpanded = signal(false);
  descOverflows = signal(false);
  @ViewChild('descEl') descEl?: ElementRef<HTMLParagraphElement>;
  entryViewerImages = computed<ViewerImage[]>(() => {
    const entry = this.modalEntry();
    if (!entry?.images) return [];
    return entry.images.map((url: string) => ({ gradient: '', url }));
  });

  openModal(entry: ChallengeEntry): void {
    this.modalEntry.set(entry);
    this.modalImageIndex.set(0);
    this.descExpanded.set(false);
    this.descOverflows.set(false);
    document.body.style.overflow = 'hidden';
    setTimeout(() => this.checkDescOverflow(), 50);
  }

  private checkDescOverflow(): void {
    const el = this.descEl?.nativeElement;
    if (el) {
      this.descOverflows.set(el.scrollHeight > el.clientHeight);
    }
  }

  closeModal(): void {
    this.modalEntry.set(null);
    document.body.style.overflow = '';
  }

  prevImage(): void {
    this.modalImageIndex.update(i => Math.max(0, i - 1));
  }

  nextImage(): void {
    const entry = this.modalEntry();
    if (!entry) return;
    this.modalImageIndex.update(i => Math.min(entry.images.length - 1, i + 1));
  }

  // ===== 참고 이미지 뷰어 =====
  refViewerOpen = signal(false);
  refViewerIndex = signal(0);
  refViewerImages = computed<ViewerImage[]>(() => {
    const c = this.challenge();
    if (!c?.referenceImages) return [];
    return c.referenceImages.map((url: string) => ({ gradient: '', url }));
  });

  openRefViewer(index: number): void {
    this.refViewerIndex.set(index);
    this.refViewerOpen.set(true);
    document.body.style.overflow = 'hidden';
  }

  closeRefViewer(): void {
    this.refViewerOpen.set(false);
    document.body.style.overflow = '';
  }

  prevRefImage(): void {
    this.refViewerIndex.update(i => Math.max(0, i - 1));
  }

  nextRefImage(): void {
    const c = this.challenge();
    if (!c?.referenceImages) return;
    const imgs = c.referenceImages;
    this.refViewerIndex.update(i => Math.min(imgs.length - 1, i + 1));
  }

  // ===== 제출 폼 =====

  openSubmitForm(): void {
    if (!this.authService.isLoggedIn()) {
      this.isLoginRequiredModalOpen.set(true);
      return;
    }
    this.isEditMode.set(false);
    this.existingImages.set([]);
    this.showSubmitForm.set(true);
  }

  closeSubmitForm(): void {
    this.showSubmitForm.set(false);
    this.isEditMode.set(false);
    this.submitTitle = '';
    this.submitDesc = '';
    this.submitFiles.set([]);
    this.submitPreviews.set([]);
    this.existingImages.set([]);
  }

  onSubmitFileSelect(event: Event): void {
    const files = Array.from((event.target as HTMLInputElement).files || []);
    const remaining = 5 - this.submitPreviews().length;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    const valid: File[] = [];
    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        alert(`'${file.name}'은(는) 지원하지 않는 형식입니다.\nJPG, PNG, WEBP만 업로드 가능합니다.`);
        continue;
      }
      if (file.size > maxSize) {
        alert(`'${file.name}'의 용량이 10MB를 초과합니다.\n(${(file.size / 1024 / 1024).toFixed(1)}MB)`);
        continue;
      }
      valid.push(file);
    }

    const toAdd = valid.slice(0, remaining);
    for (const file of toAdd) {
      this.submitFiles.update(f => [...f, file]);
      const reader = new FileReader();
      reader.onload = (e) => {
        this.submitPreviews.update(p => [...p, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    }
    (event.target as HTMLInputElement).value = '';
  }

  removeSubmitImage(index: number): void {
    const existingCount = this.existingImages().length;
    if (index < existingCount) {
      // 기존 이미지 삭제
      this.existingImages.update(imgs => imgs.filter((_, i) => i !== index));
    } else {
      // 새로 추가한 파일 삭제
      const fileIndex = index - existingCount;
      this.submitFiles.update(f => f.filter((_, i) => i !== fileIndex));
    }
    this.submitPreviews.update(p => p.filter((_, i) => i !== index));
  }

  async submitEntry(): Promise<void> {
    if (!this.submitTitle.trim()) { alert('작품 제목을 입력하세요.'); return; }

    const hasNewFiles = this.submitFiles().length > 0;
    const hasExisting = this.existingImages().length > 0;
    if (!hasNewFiles && !hasExisting) { alert('이미지를 최소 1장 업로드하세요.'); return; }

    this.submitting.set(true);
    try {
      let imageUrls = [...this.existingImages()];

      if (hasNewFiles) {
        const uploadResults = await this.api.upload.multiple(this.submitFiles(), 'challenges');
        imageUrls = [...imageUrls, ...uploadResults.map((r: UploadResult) => r.url)];
      }

      if (this.isEditMode()) {
        const my = this.myEntry();
        if (my) {
          await this.api.challenges.updateEntry(my.id, {
            title: this.submitTitle,
            description: this.submitDesc,
            images: imageUrls,
          });
        }
      } else {
        await this.api.challenges.submitEntry(this.challengeId, {
          title: this.submitTitle,
          description: this.submitDesc,
          images: imageUrls,
        });
      }

      this.closeSubmitForm();
      await this.loadData();
    } catch (e: unknown) {
      const err = e as { error?: { message?: string } };
      alert(err?.error?.message || (this.isEditMode() ? '수정 실패' : '제출 실패'));
    }
    this.submitting.set(false);
  }

  openEditForm(): void {
    const my = this.myEntry();
    if (!my) return;
    this.isEditMode.set(true);
    this.submitTitle = my.title;
    this.submitDesc = my.description || '';
    this.existingImages.set(my.images || []);
    this.submitPreviews.set(my.images || []);
    this.submitFiles.set([]);
    this.showSubmitForm.set(true);
  }
  // 삭제 모달
  showDeleteModal = signal(false);

  openDeleteModal(): void {
    this.showDeleteModal.set(true);
  }

  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
  }

  async confirmDeleteEntry(): Promise<void> {
    const my = this.myEntry();
    if (!my) return;
    try {
      await this.api.challenges.deleteEntry(my.id);
      this.myEntry.set(null);
      this.closeDeleteModal();
      await this.loadData();
    } catch (e: unknown) {
      const err = e as { error?: { message?: string } };
      alert(err?.error?.message || '삭제 실패');
    }
  }
}
