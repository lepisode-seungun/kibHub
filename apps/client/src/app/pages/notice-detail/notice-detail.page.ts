import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';

interface AttachFile {
  name: string;
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

  noticeId = '';
  bootcampId = '';

  detailTabs = ['학습목록', '강의', '과제', '공지사항'];
  activeDetailTab = signal('공지사항');

  isPinned = true;
  noticeTitle = '공지사항 제목입니다.';
  noticeDate = '2023. 01. 01';
  noticeContent = '공지사항 내용 입력하는 비교군의 MFCC정보와 입력한 음성 데이터의 MFCC 정보를 DTW알고리즘에 적용하여 시계열 스펙트럼을 만들고 각 경로에 해당하는 값을 더하여 0에 가까울수록 유사하다고 판 공지사항 내용 입력하는 비교군의 MFCC정보와 입력한 음성 데이터의 MFCC 정보를 DTW알고리즘에 적용하여 시계열 스펙트럼을 만들고 각 경로에 해당하는 값을 더하여 0에 가까울수록 유사하다고 판';

  attachFiles: AttachFile[] = [
    { name: '학습자료.pdf' },
    { name: '학습자료.pdf' },
  ];

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
      this.noticeTitle = notice.title;
      this.noticeContent = notice.body || this.noticeContent;
      this.noticeDate = new Date(notice.createdAt).toLocaleDateString('ko-KR');
      this.isPinned = notice.pinned;
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
        this.router.navigate(['/my-bootcamp', this.bootcampId]);
      }
    }
  }
}
