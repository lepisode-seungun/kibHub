import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

interface InquiryDetail {
  id: number;
  status: '대기' | '완료';
  title: string;
  content: string;
  date: string;
  attachments: { name: string }[];
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
export class InquiryDetailPage {
  isMoreOpen = signal(false);
  isDeleteOpen = signal(false);

  // 더미 데이터
  inquiry: InquiryDetail = {
    id: 1,
    status: '완료',
    title: '문의 드립니다.',
    content: 'ㅁㄴㅇㅁㄴㅇㅁㄴㅇㅁㄴㅇㅁㄴㅇㅁㄴㅇ 문의드립니다. 고객센터 내용 표출 구간은 기본적으로 높이가 고정 되어있으며, 고정 높이 이상 내용이 표출될 시, 높이가 늘어나도록',
    date: '2023. 01. 01',
    attachments: [
      { name: 'hwp_첨부파일명...' },
      { name: 'hwp_첨부파일명...' },
    ],
    reply: {
      title: '답변 대기중',
      content: '답변 대기중입니다.',
      date: '-',
    },
  };

  constructor(private router: Router) {}

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
    this.router.navigate(['/inquiry', this.inquiry.id, 'edit']);
  }

  openDelete(): void {
    this.closeMore();
    this.isDeleteOpen.set(true);
  }

  closeDelete(): void {
    this.isDeleteOpen.set(false);
  }

  confirmDelete(): void {
    // TODO: API 삭제 호출
    this.isDeleteOpen.set(false);
    this.router.navigate(['/customer-center']);
  }
}
