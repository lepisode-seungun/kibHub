import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { DataGridComponent, GridColumn } from '../../components/data-grid/data-grid.component';
import {
  APPLICANT_STATUS_BADGES,
  BOOTCAMP_STATUS_BADGES,
  CONTENT_STATUS_BADGES,
  MEMBER_STATUS_BADGES,
  ROLE_BADGES,
} from '../../shared/badge-styles';
import { ToastService } from '../../shared/toast/toast.service';
import { ApiService } from '../../services/api.service';
import { User, UserSns, UpdateUserDto, ContentRow, CommentRow } from '../../shared/types';

/** 회원 상세 페이지용 표시 데이터 */
interface MemberDetail {
  id: number;
  status: string;
  role: string;
  email: string;
  name: string;
  nickname: string;
  countryCode: string;
  phone: string;
  birthday: string;
  createdAt: string;
  intro: string;
  profileImage: string;
  sns: UserSns[];
}

function toMemberDetail(u: User): MemberDetail {
  return {
    id: u.id,
    status: u.status === 'ACTIVE' ? '정상' : u.status === 'BLOCKED' ? '차단' : '탈퇴',
    role: u.role === 'ADMIN' ? '관리자' : u.role === 'INSTRUCTOR' ? '강사' : '일반',
    email: u.email,
    name: u.name,
    nickname: u.nickname,
    countryCode: u.countryCode,
    phone: u.phone,
    birthday: u.birthday || '',
    createdAt: new Date(u.createdAt).toLocaleString('ko-KR'),
    intro: u.intro || '',
    profileImage: u.profileImage || '',
    sns: u.sns || [],
  };
}

interface BootcampHistoryRow {
  id: number;
  status: string;
  name: string;
  appliedAt: string;
}

@Component({
  selector: 'adm-member-detail',
  standalone: true,
  imports: [CommonModule, DataGridComponent],
  templateUrl: './member-detail.page.html',
  styleUrl: './member-detail.page.css',
  host: { '(document:click)': 'onDocumentClick()' },
})
export class MemberDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);
  private api = inject(ApiService);

  sections = signal<Record<string, boolean>>({
    basic: true, extra: true, bootcamp: true,
    content: false, portfolio: false, comment: false,
  });

  member: MemberDetail = {
    id: 0, status: '', role: '', email: '', name: '', nickname: '',
    countryCode: '82', phone: '', birthday: '', createdAt: '',
    intro: '', profileImage: '', sns: [],
  };

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) this.loadMember(id);
  }

  async loadMember(id: number): Promise<void> {
    try {
      const u = await this.api.users.findOne(id);
      this.member = toMemberDetail(u);
    } catch (e) {
      console.error('회원 상세 로드 실패:', e);
    }
  }

  // ===== 부트캠프 그리드 =====
  bootcampColumns: GridColumn[] = [
    { key: 'id', label: '순번', width: '60px' },
    { key: 'status', label: '지원 상태', width: '100px', badge: 'status', badgeStyles: APPLICANT_STATUS_BADGES },
    { key: 'name', label: '부트캠프명' },
    { key: 'appliedAt', label: '지원일', width: '140px' },
  ];

  bootcampHistory: BootcampHistoryRow[] = [];

  // ===== 참여 부트캠프 그리드 =====
  contentColumns: GridColumn[] = [
    { key: 'id', label: '순번', width: '60px' },
    { key: 'status', label: '상태', width: '100px', badge: 'status', badgeStyles: BOOTCAMP_STATUS_BADGES },
    { key: 'title', label: '부트캠프명' },
    { key: 'createdAt', label: '등록일시', width: '160px' },
  ];

  contentHistory: ContentRow[] = [];

  // ===== 콘텐츠 그리드 =====
  portfolioColumns: GridColumn[] = [
    { key: 'id', label: '순번', width: '60px' },
    { key: 'status', label: '상태', width: '80px', badge: 'status', badgeStyles: CONTENT_STATUS_BADGES },
    { key: 'type', label: '타입', width: '100px' },
    { key: 'category', label: '카테고리', width: '120px' },
    { key: 'title', label: '제목' },
    { key: 'author', label: '작성자', width: '100px' },
    { key: 'comments', label: '댓글', width: '80px' },
    { key: 'views', label: '조회수', width: '80px' },
  ];

  portfolioHistory: ContentRow[] = [];

  // ===== 댓글 그리드 =====
  commentColumns: GridColumn[] = [
    { key: 'id', label: '순번', width: '60px' },
    { key: 'status', label: '상태', width: '80px', badge: 'status', badgeStyles: CONTENT_STATUS_BADGES },
    { key: 'type', label: '유형', width: '100px' },
    { key: 'contentTitle', label: '콘텐츠 제목' },
    { key: 'content', label: '내용' },
    { key: 'author', label: '작성자', width: '100px' },
    { key: 'reports', label: '신고', width: '70px' },
    { key: 'likes', label: '좋아요', width: '70px' },
    { key: 'createdAt', label: '등록일시', width: '160px' },
  ];

  commentHistory: CommentRow[] = [];

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

  onChangeRole(): void { this.showKebabMenu.set(false); this.openRoleDrawer(); }
  onEdit(): void { this.showKebabMenu.set(false); this.openEditDrawer(); }

  onBlock(): void {
    this.showKebabMenu.set(false);
    if (this.member.status === '차단') this.showUnblockPopup.set(true);
    else this.showBlockPopup.set(true);
  }

  // ===== 차단 팝업 =====
  showBlockPopup = signal(false);
  closeBlockPopup(): void { this.showBlockPopup.set(false); }

  async confirmBlock(): Promise<void> {
    try {
      await this.api.users.block(this.member.id, 'BLOCKED');
      this.member.status = '차단';
      this.toast.success('차단 되었습니다.');
    } catch (e: unknown) { this.toast.error(e instanceof Error ? e.message : '차단 실패'); }
    this.showBlockPopup.set(false);
  }

  // ===== 차단 해제 팝업 =====
  showUnblockPopup = signal(false);
  closeUnblockPopup(): void { this.showUnblockPopup.set(false); }

  async confirmUnblock(): Promise<void> {
    try {
      await this.api.users.block(this.member.id, 'ACTIVE');
      this.member.status = '정상';
      this.toast.success('차단 해제 되었습니다.');
    } catch (e: unknown) { this.toast.error(e instanceof Error ? e.message : '해제 실패'); }
    this.showUnblockPopup.set(false);
  }

  onDocumentClick(): void { this.showKebabMenu.set(false); }

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

  closeRoleDrawer(): void { this.showRoleDrawer.set(false); }
  toggleRoleDropdown(): void { this.showRoleDropdown.update(v => !v); }
  selectRole(role: string): void { this.selectedRole.set(role); this.showRoleDropdown.set(false); }

  async submitRoleChange(): Promise<void> {
    if (!this.selectedRole()) return;
    try {
      const roleMap: Record<string, string> = { '일반': 'STUDENT', '강사': 'INSTRUCTOR', '관리자': 'ADMIN' };
      await this.api.users.updateRole(this.member.id, roleMap[this.selectedRole()] || 'STUDENT');
      this.member.role = this.selectedRole();
      this.toast.success('권한이 변경되었습니다.');
    } catch (e: unknown) { this.toast.error(e instanceof Error ? e.message : '권한 변경 실패'); }
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

  closeEditDrawer(): void { this.showEditDrawer.set(false); }

  onEmailInput(event: Event): void {
    this.editEmail.set((event.target as HTMLInputElement).value);
    this.emailValidation.set({ checked: false, valid: false });
  }

  onPasswordInput(event: Event): void { this.editPassword.set((event.target as HTMLInputElement).value); }
  onPasswordConfirmInput(event: Event): void { this.editPasswordConfirm.set((event.target as HTMLInputElement).value); }
  checkEmailDuplicate(): void { this.emailValidation.set({ checked: true, valid: true }); }

  async submitEdit(): Promise<void> {
    try {
      const body: UpdateUserDto = {};
      if (this.editEmail()) body.email = this.editEmail();
      if (this.editPassword()) body.password = this.editPassword();
      await this.api.users.update(this.member.id, body);
      if (body.email) this.member.email = body.email;
      this.toast.success('수정 완료 되었습니다.');
    } catch (e: unknown) { this.toast.error(e instanceof Error ? e.message : '수정 실패'); }
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
