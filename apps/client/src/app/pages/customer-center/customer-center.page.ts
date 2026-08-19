import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';

interface CcItem {
  id: number;
  category: string; // '공지사항' | '1:1문의' | 'FAQ'
  title: string;
  content: string;
  date: string;
  author: string;
  status?: '대기' | '완료'; // 1:1문의 전용
  pinned?: boolean;
  answer?: string; // FAQ 답변
  image?: string; // FAQ 이미지 URL
  attachments?: { name: string }[]; // FAQ 첨부파일
}

@Component({
  selector: 'app-customer-center',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './customer-center.page.html',
  styleUrls: ['./customer-center.page.css'],
})
export class CustomerCenterPage {
  private router = inject(Router);
  tabs = ['공지사항', '1:1문의', 'FAQ'];
  activeTab = signal('공지사항');

  searchQuery = '';
  hasSearched = false;
  currentPage = 1;
  pageSize = 5;

  // 더미 데이터
  allItems: CcItem[] = [
    { id: 1, category: '공지사항', title: 'KIPhub 서비스 정기 점검 안내', content: '안녕하세요, KIPhub입니다. 서비스 정기 점검이 예정되어 있습니다.', date: '2025.08.01', author: '관리자', pinned: true },
    { id: 2, category: '공지사항', title: '부트캠프 수료증 발급 기능 추가', content: '부트캠프 수료 후 수료증을 발급받을 수 있는 기능이 추가되었습니다.', date: '2025.07.28', author: '관리자' },
    { id: 3, category: '공지사항', title: '여름 특별 할인 이벤트 안내', content: '여름 시즌을 맞이하여 특별 할인 이벤트를 진행합니다.', date: '2025.07.15', author: '관리자' },
    { id: 4, category: '공지사항', title: '개인정보 처리방침 개정 안내', content: '개인정보 처리방침이 일부 개정되었습니다. 자세한 내용은 확인해주세요.', date: '2025.07.10', author: '관리자' },
    { id: 5, category: '공지사항', title: '신규 부트캠프 오픈 안내 - AI 개발 과정', content: 'AI 개발 과정 부트캠프가 새롭게 오픈됩니다.', date: '2025.07.05', author: '관리자' },
    { id: 21, category: '공지사항', title: '서비스 이용약관 변경 안내', content: '서비스 이용약관이 일부 변경되었습니다. 변경 사항을 확인해주세요.', date: '2025.06.28', author: '관리자' },
    { id: 22, category: '공지사항', title: '하반기 부트캠프 모집 일정 안내', content: '하반기 부트캠프 모집 일정이 확정되었습니다.', date: '2025.06.20', author: '관리자' },
    { id: 23, category: '공지사항', title: '시스템 업데이트 안내', content: '보다 나은 서비스를 위한 시스템 업데이트가 예정되어 있습니다.', date: '2025.06.15', author: '관리자' },
    { id: 24, category: '공지사항', title: '강사 모집 안내', content: '새로운 분야의 강사를 모집합니다. 많은 지원 바랍니다.', date: '2025.06.10', author: '관리자' },
    { id: 25, category: '공지사항', title: '추석 연휴 고객센터 운영 안내', content: '추석 연휴 기간 동안 고객센터 운영 일정을 안내드립니다.', date: '2025.06.01', author: '관리자' },
    { id: 6, category: '1:1문의', title: '안녕하세요, 문의드립니다.', content: '안녕하세요, 안녕하세요 문의드립니다.안녕하세요, 안녕하세요 문의드립니다.안녕하세요, 안녕하세요 문의드립니다.안녕하세요, 안녕하세요 문의드립니다.', date: '2023.01.01', author: 'user01', status: '대기' },
    { id: 7, category: '1:1문의', title: '안녕하세요, 문의드립니다.', content: '안녕하세요, 안녕하세요 문의드립니다.안녕하세요, 안녕하세요 문의드립니다.안녕하세요, 안녕하세요 문의드립니다.안녕하세요, 안녕하세요 문의드립니다.', date: '2023.01.01', author: 'user02', status: '대기' },
    { id: 8, category: '1:1문의', title: '안녕하세요, 문의드립니다.', content: '안녕하세요, 안녕하세요 문의드립니다.안녕하세요, 안녕하세요 문의드립니다.안녕하세요, 안녕하세요 문의드립니다.안녕하세요, 안녕하세요 문의드립니다.', date: '2023.01.01', author: 'user03', status: '완료' },
    { id: 9, category: '1:1문의', title: '안녕하세요, 문의드립니다.', content: '안녕하세요, 안녕하세요 문의드립니다.안녕하세요, 안녕하세요 문의드립니다.안녕하세요, 안녕하세요 문의드립니다.안녕하세요, 안녕하세요 문의드립니다.', date: '2023.01.01', author: 'user04', status: '대기' },
    { id: 10, category: '1:1문의', title: '안녕하세요, 문의드립니다.', content: '안녕하세요, 안녕하세요 문의드립니다.안녕하세요, 안녕하세요 문의드립니다.안녕하세요, 안녕하세요 문의드립니다.안녕하세요, 안녕하세요 문의드립니다.', date: '2023.01.01', author: 'user05', status: '대기' },
    { id: 26, category: '1:1문의', title: '수강 신청 관련 문의', content: '수강 신청 절차에 대해 문의드립니다.', date: '2023.02.01', author: 'user06', status: '완료' },
    { id: 27, category: '1:1문의', title: '결제 오류 문의', content: '결제 과정에서 오류가 발생했습니다.', date: '2023.02.15', author: 'user07', status: '대기' },
    { id: 28, category: '1:1문의', title: '수료증 발급 문의', content: '수료증 발급 방법을 알고 싶습니다.', date: '2023.03.01', author: 'user08', status: '완료' },
    { id: 29, category: '1:1문의', title: '강의 자료 다운로드 문의', content: '강의 자료를 다운로드할 수 없습니다.', date: '2023.03.10', author: 'user09', status: '대기' },
    { id: 30, category: '1:1문의', title: '환불 절차 문의', content: '환불 절차에 대해 안내 부탁드립니다.', date: '2023.03.20', author: 'user10', status: '대기' },
    { id: 11, category: 'FAQ', title: '견적문의는 어디서 하나요?', content: '', date: '2025.06.01', author: '관리자', answer: '견적문의는 고객센터 > 견적문의페이지에서 문의할 수 있습니다.', attachments: [{ name: 'hwp_첨부파일명...' }, { name: 'hwp_첨부파일명...' }] },
    { id: 12, category: 'FAQ', title: '견적문의는 어디서 하나요?', content: '', date: '2025.06.01', author: '관리자', answer: '수료 기준은 출석률 80% 이상, 과제 제출 등입니다.' },
    { id: 13, category: 'FAQ', title: '견적문의는 어디서 하나요?', content: '', date: '2025.06.01', author: '관리자', answer: '환불은 수강 시작 후 7일 이내에 가능합니다.' },
    { id: 14, category: 'FAQ', title: '견적문의는 어디서 하나요?', content: '', date: '2025.06.01', author: '관리자', answer: '포트폴리오는 마이페이지에서 제출할 수 있습니다.' },
    { id: 15, category: 'FAQ', title: '견적문의는 어디서 하나요?', content: '', date: '2025.06.01', author: '관리자', answer: '부트캠프 수료 후 수료증을 발급받을 수 있습니다.' },
    { id: 16, category: 'FAQ', title: '견적문의는 어디서 하나요?', content: '', date: '2025.06.01', author: '관리자', answer: '네, 이메일로 수강 신청 확인서를 발송해 드립니다.' },
    { id: 17, category: 'FAQ', title: '견적문의는 어디서 하나요?', content: '', date: '2025.06.01', author: '관리자', answer: '강의 자료는 수강 기간 동안 열람할 수 있습니다.' },
    { id: 18, category: 'FAQ', title: '견적문의는 어디서 하나요?', content: '', date: '2025.06.01', author: '관리자', answer: '수강 신청 후 마이페이지에서 스케줄을 확인할 수 있습니다.' },
    { id: 19, category: 'FAQ', title: '견적문의는 어디서 하나요?', content: '', date: '2025.06.01', author: '관리자', answer: '수업은 온라인으로 진행되며, Zoom을 사용합니다.' },
    { id: 20, category: 'FAQ', title: '견적문의는 어디서 하나요?', content: '', date: '2025.06.01', author: '관리자', answer: '수료 후 취업 지원 프로그램을 이용하실 수 있습니다.' },
  ];

  get filteredItems(): CcItem[] {
    const tabItems = this.allItems.filter(i => i.category === this.activeTab());
    if (!this.searchQuery.trim()) {
      return tabItems;
    }
    const q = this.searchQuery.trim().toLowerCase();
    return tabItems.filter(i => i.title.toLowerCase().includes(q) || i.content.toLowerCase().includes(q));
  }

  get items(): CcItem[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredItems.slice(start, start + this.pageSize);
  }

  get totalCount(): number {
    return this.filteredItems.length;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredItems.length / this.pageSize));
  }

  get pageNumbers(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= this.totalPages; i++) pages.push(i);
    return pages;
  }

  selectTab(tab: string): void {
    this.activeTab.set(tab);
    this.hasSearched = false;
    this.searchQuery = '';
    this.currentPage = 1;
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  onSearch(): void {
    this.hasSearched = true;
    this.currentPage = 1;
  }

  expandedFaqId: number | null = null;

  toggleFaq(id: number): void {
    this.expandedFaqId = this.expandedFaqId === id ? null : id;
  }

  onWrite(): void {
    // TODO: 작성 페이지 이동
  }

  openItem(item: CcItem): void {
    if (item.category === '1:1문의') {
      this.router.navigate(['/inquiry', item.id]);
    } else if (item.category === '공지사항') {
      this.router.navigate(['/notice', item.id]);
    }
  }

}
