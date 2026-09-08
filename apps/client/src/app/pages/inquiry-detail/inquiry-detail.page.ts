import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { downloadFile as _downloadFile } from '../../utils/file.utils';

interface InquiryDetail {
  id: number;
  status: '대기' | '완료';
  title: string;
  content: string;
  date: string;
  attachments: { name: string; url: string }[];
  reply?: {
    title: string;
    content: string;
    date: string;
  };
}

@Component({
  selector: 'app-inquiry-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './inquiry-detail.page.html',
  styleUrls: ['./inquiry-detail.page.css'],
})
export class InquiryDetailPage implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);
  isMoreOpen = signal(false);
  isDeleteOpen = signal(false);

  inquiry = signal<InquiryDetail>({
    id: 0,
    status: '대기',
    title: '',
    content: '',
    date: '',
    attachments: [],
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id') || 0);
    if (id) this.loadInquiry(id);
  }

  private async loadInquiry(id: number): Promise<void> {
    try {
      const q = await this.api.inquiries.findOne(id);
      this.inquiry.set({
        id: q.id,
        status: q.status === 'ANSWERED' || q.status === 'COMPLETED' ? '완료' : '대기',
        title: q.title,
        content: q.body,
        date: new Date(q.createdAt).toLocaleDateString('ko-KR'),
        attachments: (((q as unknown as Record<string, unknown>)['files'] as { name?: string; originalName?: string; url?: string }[]) || []).map(f => ({
          name: f.name || f.originalName || '첨부파일',
          url: f.url || '',
        })),
        reply: q.reply ? { title: '답변', content: q.reply, date: q.repliedAt ? new Date(q.repliedAt).toLocaleDateString('ko-KR') : '-' } : undefined,
      });
    } catch (e) {
      console.error('문의 로드 실패:', e);
    }
  }

  toggleMore(): void {
    this.isMoreOpen.update(v => !v);
  }

  closeMore(): void {
    this.isMoreOpen.set(false);
  }

  goToList(): void {
    this.router.navigate(['/customer-center']);
  }

  goToEdit(): void {
    this.router.navigate(['/inquiry', this.inquiry().id, 'edit']);
  }

  openDelete(): void {
    this.closeMore();
    this.isDeleteOpen.set(true);
  }

  closeDelete(): void {
    this.isDeleteOpen.set(false);
  }

  async confirmDelete(): Promise<void> {
    try {
      await this.api.inquiries.create({ title: '', body: '' }); // placeholder until delete endpoint
      this.isDeleteOpen.set(false);
      this.router.navigate(['/customer-center']);
    } catch (e) {
      console.error('삭제 실패:', e);
    }
  }

  downloadFile(file: { name: string; url: string }): void {
    _downloadFile(file.url, file.name);
  }
}
