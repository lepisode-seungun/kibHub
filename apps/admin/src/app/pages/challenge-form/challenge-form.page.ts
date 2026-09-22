import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastService } from '../../shared/toast/toast.service';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'adm-challenge-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './challenge-form.page.html',
  styleUrl: './challenge-form.page.css',
})
export class ChallengeFormPage implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);

  isEdit = false;
  challengeId: number | null = null;
  loading = signal(false);

  // 폼 필드
  title = '';
  description = '';
  category = '';
  difficulty = '';
  startDate = '';
  endDate = '';
  maxSubmissions = 1;
  isBootcampOnly = false;
  bootcampId: number | null = null;
  thumbnail = signal('');  
  referenceImages = signal<string[]>([]);
  prize = '';
  isVisible = true;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true;
      this.challengeId = Number(id);
      this.loadChallenge();
    }
  }

  async loadChallenge(): Promise<void> {
    if (!this.challengeId) return;
    try {
      const c = await this.api.challenges.findOne(this.challengeId);
      this.title = c.title;
      this.description = c.description || '';
      this.category = c.category;
      this.difficulty = c.difficulty || '';
      this.startDate = c.startDate ? new Date(c.startDate).toISOString().split('T')[0] : '';
      this.endDate = c.endDate ? new Date(c.endDate).toISOString().split('T')[0] : '';
      this.maxSubmissions = c.maxSubmissions || 1;
      this.isBootcampOnly = c.isBootcampOnly || false;
      this.bootcampId = c.bootcampId || null;
      this.thumbnail.set(c.thumbnail || '');
      this.referenceImages.set(c.referenceImages || []);
      this.prize = c.prize || '';
      this.isVisible = c.isVisible ?? true;


    } catch (e) {
      this.toast.error('챌린지 로드 실패');
      console.error(e);
    }
  }


  async onThumbnailUpload(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    try {
      const result = await this.api.uploadFile(file, 'challenges');
      this.thumbnail.set(result.url);
    } catch {
      this.toast.error('썸네일 업로드 실패');
    }
  }

  async onRefImageUpload(event: Event): Promise<void> {
    const files = Array.from((event.target as HTMLInputElement).files || []);
    if (!files.length) return;
    try {
      const results = await this.api.uploadFiles(files, 'challenges');
      this.referenceImages.set([...this.referenceImages(), ...results.map(r => r.url)]);
    } catch {
      this.toast.error('참고 이미지 업로드 실패');
    }
  }

  removeRefImage(index: number): void {
    this.referenceImages.update(imgs => imgs.filter((_, i) => i !== index));
  }

  async submit(): Promise<void> {
    if (!this.title.trim()) {
      this.toast.error('제목을 입력하세요.');
      return;
    }
    if (!this.category) {
      this.toast.error('카테고리를 선택하세요.');
      return;
    }
    if (!this.startDate || !this.endDate) {
      this.toast.error('기간을 설정하세요.');
      return;
    }
    if (this.startDate > this.endDate) {
      this.toast.error('시작일은 마감일보다 이후일 수 없습니다.');
      return;
    }

    this.loading.set(true);
    const data = {
      title: this.title,
      description: this.description,
      category: this.category,
      difficulty: this.difficulty || undefined,
      startDate: this.startDate,
      endDate: this.endDate,
      maxSubmissions: this.maxSubmissions,
      isBootcampOnly: this.isBootcampOnly,
      bootcampId: this.bootcampId || undefined,
      thumbnail: this.thumbnail() || undefined,
      referenceImages: this.referenceImages(),
      prize: this.prize || undefined,
      isVisible: this.isVisible,
    };

    try {
      if (this.isEdit && this.challengeId) {
        await this.api.challenges.update(this.challengeId, data);
        this.toast.success('챌린지가 수정되었습니다.');
      } else {
        await this.api.challenges.create(data);
        this.toast.success('챌린지가 등록되었습니다.');
      }
      this.router.navigate(['/content/challenges']);
    } catch (e) {
      this.toast.error('저장 실패');
      console.error(e);
    }
    this.loading.set(false);
  }

  goBack(): void {
    this.router.navigate(['/content/challenges']);
  }
}
