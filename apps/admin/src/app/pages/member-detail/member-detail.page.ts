import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataGridComponent, GridColumn } from '../../components/data-grid/data-grid.component';
import {
  APPLICANT_STATUS_BADGES,
  BOOTCAMP_STATUS_BADGES,
  CONTENT_STATUS_BADGES,
  MEMBER_STATUS_BADGES,
  ROLE_BADGES,
} from '../../shared/badge-styles';

@Component({
  selector: 'adm-member-detail',
  standalone: true,
  imports: [CommonModule, DataGridComponent],
  templateUrl: './member-detail.page.html',
  styleUrl: './member-detail.page.css',
  host: { '(document:click)': 'onDocumentClick()' },
})
export class MemberDetailPage {
  sections = signal<Record<string, boolean>>({
    basic: true,
    extra: true,
    bootcamp: true,
    content: false,
    portfolio: false,
    comment: false,
  });

  member = {
    status: '정상',
    role: '일반',
    email: 'yelim@lepisode.team',
    name: '고예림',
    countryCode: '82',
    phone: '010-1234-5678',
    birthday: '2000.00.00',
    createdAt: '2025-01-24 13:12',
    nickname: '고시케',
    intro: '안녕하세요. 안녕하세요. 안녕하세요. 안녕하세요. 안녕하세요. 안녕하세요. 안녕하세요.',
    profileImage: '',
    sns: [
      { type: 'link', label: 'Newon_12', url: '#' },
      { type: 'instagram', label: 'Newon_newon.com', url: '#' },
      { type: 'email', label: 'Newon@newon.com', url: '#' },
      { type: 'email', label: 'Newon@newon.com', url: '#' },
    ],
  };

  // ===== 부트캠프 그리드 =====
  bootcampColumns: GridColumn[] = [
    { key: 'id', label: '순번', width: '60px' },
    {
      key: 'status', label: '지원 상태', width: '100px',
      badge: 'status',
      badgeStyles: APPLICANT_STATUS_BADGES,
    },
    { key: 'name', label: '부트캠프명' },
    { key: 'appliedAt', label: '지원일', width: '140px' },
  ];

  bootcampHistory = [
    { id: 1, name: 'UX/UI 디자인 부트캠프 1기', status: '합격', appliedAt: '2024-01-15', completedAt: '2024-06-30' },
    { id: 2, name: '프론트엔드 개발 부트캠프 3기', status: '대기', appliedAt: '2024-07-01', completedAt: '-' },
    { id: 3, name: '백엔드 개발 부트캠프 2기', status: '불합격', appliedAt: '2025-01-20', completedAt: '-' },
  ];

  // ===== 참여 부트캠프 그리드 =====
  contentColumns: GridColumn[] = [
    { key: 'id', label: '순번', width: '60px' },
    {
      key: 'status', label: '상태', width: '100px',
      badge: 'status',
      badgeStyles: BOOTCAMP_STATUS_BADGES,
    },
    { key: 'title', label: '부트캠프명' },
    { key: 'createdAt', label: '등록일시', width: '160px' },
  ];

  contentHistory = [
    { id: 1, status: '운영', title: 'UX/UI 디자인 부트캠프 2기', createdAt: '2024-06-15 10:00' },
    { id: 2, status: '모집', title: '프론트엔드 개발 부트캠프 4기', createdAt: '2024-07-10 14:30' },
    { id: 3, status: '마감', title: '백엔드 개발 부트캠프 1기', createdAt: '2024-03-01 09:00' },
  ];

  // ===== 콘텐츠 그리드 =====
  portfolioColumns: GridColumn[] = [
    { key: 'id', label: '순번', width: '60px' },
    {
      key: 'status', label: '상태', width: '80px',
      badge: 'status',
      badgeStyles: CONTENT_STATUS_BADGES,
    },
    { key: 'type', label: '타입', width: '100px' },
    { key: 'category', label: '카테고리', width: '120px' },
    { key: 'title', label: '제목' },
    { key: 'author', label: '작성자', width: '100px' },
    { key: 'comments', label: '댓글', width: '80px' },
    { key: 'views', label: '조회수', width: '80px' },
  ];

  portfolioHistory = [
    { id: 1, status: '노출', type: '포트폴리오', category: 'UX/UI', title: '모바일 앱 UI 리디자인', author: '고예림', comments: 12, views: 234 },
    { id: 2, status: '숨김', type: '후기', category: '부트캠프', title: '부트캠프 수료 후기', author: '고예림', comments: 5, views: 156 },
    { id: 3, status: '노출', type: '포트폴리오', category: 'Web', title: '이커머스 웹사이트 디자인', author: '고예림', comments: 8, views: 312 },
  ];

  // ===== 댓글 그리드 =====
  commentColumns: GridColumn[] = [
    { key: 'id', label: '순번', width: '60px' },
    {
      key: 'status', label: '상태', width: '80px',
      badge: 'status',
      badgeStyles: CONTENT_STATUS_BADGES,
    },
    { key: 'type', label: '유형', width: '100px' },
    { key: 'contentTitle', label: '콘텐츠 제목' },
    { key: 'content', label: '내용' },
    { key: 'author', label: '작성자', width: '100px' },
    { key: 'reports', label: '신고', width: '70px' },
    { key: 'likes', label: '좋아요', width: '70px' },
    { key: 'createdAt', label: '등록일시', width: '160px' },
  ];

  commentHistory = [
    { id: 1, status: '노출', type: '포트폴리오', contentTitle: '모바일 앱 UI 리디자인', content: '정말 잘 만들었네요!', author: '홍길동', reports: 0, likes: 5, createdAt: '2024-06-21 10:30' },
    { id: 2, status: '숨김', type: '후기', contentTitle: '부트캠프 수료 후기', content: '좋은 후기 감사합니다.', author: '김영희', reports: 2, likes: 3, createdAt: '2024-07-11 14:20' },
    { id: 3, status: '노출', type: '포트폴리오', contentTitle: '이커머스 웹사이트 디자인', content: '디자인이 깔끔하네요.', author: '박지민', reports: 0, likes: 8, createdAt: '2024-05-15 09:45' },
  ];

  // ===== 아코디언 =====
  toggleSection(key: string): void {
    this.sections.update(s => ({ ...s, [key]: !s[key] }));
  }

  isOpen(key: string): boolean {
    return this.sections()[key] ?? false;
  }

  // ===== 케밥 메뉴 =====
  showKebabMenu = signal(false);

  toggleKebabMenu(event: Event): void {
    event.stopPropagation();
    this.showKebabMenu.update(v => !v);
  }

  onChangeRole(): void {
    this.showKebabMenu.set(false);
    this.openRoleDrawer();
  }

  onEdit(): void {
    this.showKebabMenu.set(false);
    this.openEditDrawer();
  }

  onBlock(): void {
    this.showKebabMenu.set(false);
    if (this.member.status === '차단') {
      this.showUnblockPopup.set(true);
    } else {
      this.showBlockPopup.set(true);
    }
  }

  // ===== 차단 팝업 =====
  showBlockPopup = signal(false);

  closeBlockPopup(): void {
    this.showBlockPopup.set(false);
  }

  confirmBlock(): void {
    // TODO: API 호출
    this.member.status = '차단';
    this.showBlockPopup.set(false);
  }

  // ===== 차단 해제 팝업 =====
  showUnblockPopup = signal(false);

  closeUnblockPopup(): void {
    this.showUnblockPopup.set(false);
  }

  confirmUnblock(): void {
    // TODO: API 호출
    this.member.status = '정상';
    this.showUnblockPopup.set(false);
  }

  onDocumentClick(): void {
    this.showKebabMenu.set(false);
  }

  // ===== 권한 변경 드로어 =====
  showRoleDrawer = signal(false);
  selectedRole = signal('');
  showRoleDropdown = signal(false);
  roleOptions = ['일반', '강사'];

  openRoleDrawer(): void {
    this.selectedRole.set('');
    this.showRoleDropdown.set(false);
    this.showRoleDrawer.set(true);
  }

  closeRoleDrawer(): void {
    this.showRoleDrawer.set(false);
  }

  toggleRoleDropdown(): void {
    this.showRoleDropdown.update(v => !v);
  }

  selectRole(role: string): void {
    this.selectedRole.set(role);
    this.showRoleDropdown.set(false);
  }

  submitRoleChange(): void {
    if (!this.selectedRole()) return;
    // TODO: API 호출
    this.member.role = this.selectedRole();
    this.showRoleDrawer.set(false);
  }

  // ===== 회원 수정 드로어 =====
  showEditDrawer = signal(false);
  editEmail = signal('');
  editPassword = signal('');
  editPasswordConfirm = signal('');
  emailValidation = signal<{ checked: boolean; valid: boolean }>({ checked: false, valid: false });

  passwordHasNumber = computed(() => /\d/.test(this.editPassword()));
  passwordHasSpecial = computed(() => /[!@#$%^&*(),.?":{}|<>]/.test(this.editPassword()));
  passwordsMatch = computed(() =>
    this.editPassword().length > 0 &&
    this.editPasswordConfirm().length > 0 &&
    this.editPassword() === this.editPasswordConfirm()
  );
  passwordMismatch = computed(() =>
    this.editPasswordConfirm().length > 0 &&
    this.editPassword() !== this.editPasswordConfirm()
  );

  openEditDrawer(): void {
    this.editEmail.set('');
    this.editPassword.set('');
    this.editPasswordConfirm.set('');
    this.emailValidation.set({ checked: false, valid: false });
    this.showEditDrawer.set(true);
  }

  closeEditDrawer(): void {
    this.showEditDrawer.set(false);
  }

  onEmailInput(event: Event): void {
    this.editEmail.set((event.target as HTMLInputElement).value);
    this.emailValidation.set({ checked: false, valid: false });
  }

  onPasswordInput(event: Event): void {
    this.editPassword.set((event.target as HTMLInputElement).value);
  }

  onPasswordConfirmInput(event: Event): void {
    this.editPasswordConfirm.set((event.target as HTMLInputElement).value);
  }

  checkEmailDuplicate(): void {
    // TODO: API 호출
    this.emailValidation.set({ checked: true, valid: true });
  }

  submitEdit(): void {
    // TODO: API 호출
    this.member.email = this.editEmail();
    this.showEditDrawer.set(false);
  }

  // ===== 기본정보 뱃지 =====
  getStatusClass(status: string): string {
    return MEMBER_STATUS_BADGES[status] || 'bg-zinc-50 border-zinc-200 text-zinc-500';
  }

  getRoleClass(role: string): string {
    return ROLE_BADGES[role] || 'bg-zinc-50 border-zinc-200 text-zinc-500';
  }
}
