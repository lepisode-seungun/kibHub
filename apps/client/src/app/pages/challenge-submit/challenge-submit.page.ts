import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-challenge-submit-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './challenge-submit.page.html',
  styleUrl: './challenge-submit.page.css',
})
export class ChallengeSubmitPage implements OnInit {
  private api = inject(ApiService);
  router = inject(Router);
  private route = inject(ActivatedRoute);

  challengeId = 0;
  challenge = signal<any>(null);
  loading = signal(false);

  title = '';
  description = '';
  images: string[] = [];
  imageFiles: File[] = [];
  imagePreviews: string[] = [];

  ngOnInit(): void {
    this.challengeId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadChallenge();
  }

  async loadChallenge(): Promise<void> {
    try {
      const c = await this.api.challenges.findOne(this.challengeId);
      this.challenge.set(c);
    } catch { /* ignore */ }
  }

  onFileSelect(event: Event): void {
    const files = Array.from((event.target as HTMLInputElement).files || []);
    const remaining = 5 - this.imagePreviews.length;
    const toAdd = files.slice(0, remaining);

    for (const file of toAdd) {
      this.imageFiles.push(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreviews = [...this.imagePreviews, e.target?.result as string];
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage(index: number): void {
    this.imageFiles.splice(index, 1);
    this.imagePreviews = this.imagePreviews.filter((_, i) => i !== index);
    this.images = this.images.filter((_, i) => i !== index);
  }

  async submit(): Promise<void> {
    if (!this.title.trim()) {
      alert('작품 제목을 입력하세요.');
      return;
    }
    if (this.imageFiles.length === 0) {
      alert('이미지를 최소 1장 업로드하세요.');
      return;
    }

    this.loading.set(true);
    try {
      // 이미지 업로드
      const uploadResults = await this.api.upload.multiple(this.imageFiles, 'challenges');
      const imageUrls = uploadResults.map((r: any) => r.url);

      // 작품 제출
      await this.api.challenges.submitEntry(this.challengeId, {
        title: this.title,
        description: this.description,
        images: imageUrls,
      });

      alert('작품이 제출되었습니다! 🎉');
      this.router.navigate(['/challenges', this.challengeId]);
    } catch (e: any) {
      alert(e?.error?.message || '제출 실패');
    }
    this.loading.set(false);
  }
}
