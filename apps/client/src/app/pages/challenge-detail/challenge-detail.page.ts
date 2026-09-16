import { Component, signal, inject, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-challenge-detail-page',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
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
  challenge = signal<any>(null);
  entries = signal<any[]>([]);
  winners = signal<any[]>([]);
  myEntry = signal<any>(null);
  sortMode = signal<string>('latest');
  loading = signal(true);
  winnerModalOpen = signal(false);

  // 제출 폼
  showSubmitForm = signal(false);
  submitTitle = '';
  submitDesc = '';
  submitFiles = signal<File[]>([]);
  submitPreviews = signal<string[]>([]);
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
      const w = entries.filter((e: any) => e.isWinner).sort((a: any, b: any) => (a.rank || 99) - (b.rank || 99));
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

  async toggleLike(entry: any): Promise<void> {
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
  modalEntry = signal<any>(null);
  modalImageIndex = signal(0);

  openModal(entry: any): void {
    this.modalEntry.set(entry);
    this.modalImageIndex.set(0);
    document.body.style.overflow = 'hidden';
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

  // ===== 제출 폼 =====

  openSubmitForm(): void {
    this.showSubmitForm.set(true);
  }

  closeSubmitForm(): void {
    this.showSubmitForm.set(false);
    this.submitTitle = '';
    this.submitDesc = '';
    this.submitFiles.set([]);
    this.submitPreviews.set([]);
  }

  onSubmitFileSelect(event: Event): void {
    const files = Array.from((event.target as HTMLInputElement).files || []);
    const remaining = 5 - this.submitPreviews().length;
    const toAdd = files.slice(0, remaining);

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
    this.submitFiles.update(f => f.filter((_, i) => i !== index));
    this.submitPreviews.update(p => p.filter((_, i) => i !== index));
  }

  async submitEntry(): Promise<void> {
    if (!this.submitTitle.trim()) { alert('작품 제목을 입력하세요.'); return; }
    if (this.submitFiles().length === 0) { alert('이미지를 최소 1장 업로드하세요.'); return; }

    this.submitting.set(true);
    try {
      const uploadResults = await this.api.upload.multiple(this.submitFiles(), 'challenges');
      const imageUrls = uploadResults.map((r: any) => r.url);

      await this.api.challenges.submitEntry(this.challengeId, {
        title: this.submitTitle,
        description: this.submitDesc,
        images: imageUrls,
      });

      this.closeSubmitForm();
      await this.loadData();
    } catch (e: any) {
      alert(e?.error?.message || '제출 실패');
    }
    this.submitting.set(false);
  }

  openEditForm(): void {
    const my = this.myEntry();
    if (!my) return;
    this.submitTitle = my.title;
    this.submitDesc = my.description || '';
    this.submitPreviews.set(my.images || []);
    this.submitFiles.set([]);
    this.showSubmitForm.set(true);
  }

  async deleteMyEntry(): Promise<void> {
    const my = this.myEntry();
    if (!my) return;
    if (!confirm('정말 작품을 삭제하시겠습니까?')) return;
    try {
      await this.api.challenges.deleteEntry(my.id);
      this.myEntry.set(null);
      await this.loadData();
    } catch (e: any) {
      alert(e?.error?.message || '삭제 실패');
    }
  }
}
