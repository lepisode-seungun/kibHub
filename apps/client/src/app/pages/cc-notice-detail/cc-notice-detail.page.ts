import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';

interface AttachFile {
  name: string;
}

@Component({
  selector: 'app-cc-notice-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './cc-notice-detail.page.html',
  styleUrl: './cc-notice-detail.page.css',
})
export class CcNoticeDetailPage implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);

  noticeId = '';

  isPinned = signal(false);
  noticeTitle = signal('');
  noticeDate = signal('');
  noticeContent = signal('');
  noticeImages = signal<string[]>([]);

  attachFiles = signal<AttachFile[]>([]);

  ngOnInit(): void {
    this.route.paramMap.subscribe(async (params) => {
      this.noticeId = params.get('id') || '';
      if (this.noticeId) {
        try {
          const notice = await this.api.notices.findOne(Number(this.noticeId));
          this.noticeTitle.set(notice.title || '');
          this.noticeDate.set(notice.createdAt ? new Date(notice.createdAt).toLocaleDateString('ko-KR') : '');
          this.noticeContent.set(notice.body || '');
          this.isPinned.set(notice.pinned || false);
          // 이미지 로드
          const images = (notice as any).images || [];
          this.noticeImages.set(images.filter((img: string) => !!img));
          // 첨부파일 로드
          const files = (notice as any).files || [];
          this.attachFiles.set(files.map((f: any) => ({ name: f.name || f })));
        } catch {
          // 없으면 목록으로
          this.router.navigate(['/customer-center']);
        }
      }
    });
  }

  goToList(): void {
    this.router.navigate(['/customer-center']);
  }
}
