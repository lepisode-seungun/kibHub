import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';

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

  noticeId = '';

  isPinned = true;
  noticeTitle = '공지사항 제목입니다.';
  noticeDate = '2023. 01. 01';
  noticeContent =
    '공지사항 내용 입력하는 비교군의 MFCC정보와 입력한 음성 데이터의 MFCC 정보를 DTW알고리즘에 적용하여 시계열 스펙트럼을 만들고 각 경로에 해당하는 값을 더하여 0에 가까울수록 유사하다고 판 공지사항 내용 입력하는 비교군의 MFCC정보와 입력한 음성 데이터의 MFCC 정보를 DTW알고리즘에 적용하여 시계열 스펙트럼을 만들고 각 경로에 해당하는 값을 더하여 0에 가까울수록 유사하다고 판';

  attachFiles: AttachFile[] = [
    { name: 'hwp_첨부파일명...' },
    { name: 'hwp_첨부파일명...' },
  ];

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.noticeId = params.get('id') || '';
    });
  }

  goToList(): void {
    this.router.navigate(['/customer-center']);
  }
}
