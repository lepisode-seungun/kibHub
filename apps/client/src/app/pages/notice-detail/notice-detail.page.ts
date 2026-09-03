import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ApiService } from '../../services/api.service';
import { isImageFile as _isImageFile, downloadFile as _downloadFile } from '../../utils/file.utils';

interface AttachFile {
  id: number;
  name: string;
  url: string;
  size: number;
  mimeType: string;
}

@Component({
  selector: 'app-notice-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './notice-detail.page.html',
  styleUrls: ['./notice-detail.page.css'],
})
export class NoticeDetailPage implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);
  private sanitizer = inject(DomSanitizer);

  noticeId = '';
  bootcampId = '';

  detailTabs = ['학습목록', '강의', '과제', '공지사항'];
  activeDetailTab = signal('공지사항');

  isPinned = signal(false);
  noticeTitle = signal('');
  noticeDate = signal('');
  noticeContent = signal<SafeHtml>('');
  noticeAuthor = signal('');
  attachFiles = signal<AttachFile[]>([]);

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.bootcampId = params.get('bootcampId') || '';
      this.noticeId = params.get('noticeId') || params.get('id') || '';
      if (this.noticeId) this.loadNotice(Number(this.noticeId));
    });
    this.route.queryParamMap.subscribe((qp) => {
      this.returnTab = qp.get('tab') || '';
    });
  }

  private async loadNotice(id: number): Promise<void> {
    try {
      const notice = await this.api.notices.findOne(id);
      this.noticeTitle.set(notice.title);
      this.noticeContent.set(this.sanitizer.bypassSecurityTrustHtml(notice.body || ''));
      this.noticeDate.set(new Date(notice.createdAt).toLocaleDateString('ko-KR'));
      this.isPinned.set(notice.pinned);
      this.noticeAuthor.set(
        (notice as any).author?.nickname || (notice as any).author?.name || ''
      );
      // 첨부파일
      const files = (notice as any).files || [];
      this.attachFiles.set(
        files.map((f: any) => ({
          id: f.id,
          name: f.name,
          url: f.url,
          size: f.size || 0,
          mimeType: f.mimeType || '',
        }))
      );
    } catch (e) {
      console.error('공지사항 로드 실패:', e);
    }
  }

  returnTab = '';

  goBack(): void {
    if (this.bootcampId) {
      this.router.navigate(['/my-bootcamp', this.bootcampId], {
        queryParams: this.returnTab ? { tab: this.returnTab } : {},
      });
    } else {
      this.router.navigate(['/my-bootcamp']);
    }
  }

  goToList(): void {
    if (this.bootcampId) {
      this.router.navigate(['/my-bootcamp', this.bootcampId], {
        queryParams: this.returnTab ? { tab: this.returnTab } : {},
      });
    }
  }

  selectDetailTab(tab: string): void {
    this.activeDetailTab.set(tab);
    if (this.bootcampId) {
      if (tab !== '공지사항') {
        this.router.navigate(['/my-bootcamp', this.bootcampId], {
          queryParams: { tab },
        });
      }
    }
  }

  onDownloadFile(file: AttachFile): void {
    _downloadFile(file.url, file.name);
  }

  isImageFile(file: AttachFile): boolean {
    return _isImageFile(file);
  }
}
