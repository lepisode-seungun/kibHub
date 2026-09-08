import { formatDate } from '../../shared/format-date';
import { Component, signal, computed, inject, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataGridComponent, GridColumn, GridRow } from '../../components/data-grid/data-grid.component';
import { MEMBER_STATUS_BADGES, APPLICANT_STATUS_BADGES, BOOTCAMP_STATUS_BADGES } from '../../shared/badge-styles';
import { ToastService } from '../../shared/toast/toast.service';
import { ApiService } from '../../services/api.service';
import { BootcampContextService } from '../../services/bootcamp-context.service';


interface PersonRow {
  [key: string]: unknown;
  id: number;
  status: string;
  name: string;
  nickname: string;
  phone: string;
  email: string;
}

interface UserResponse {
  id: number;
  status: string;
  name: string;
  nickname: string;
  phone: string;
  email: string;
  role?: string;
}

interface ApplicantResponse {
  id: number;
  status: string;
  interviewQuestions: Record<string, string> | null;
  user?: { name: string; phone: string; email: string };
}

interface BootcampEditPayload {
  name: string;
  startDate?: string;
  endDate?: string;
}

interface BootcampDetailResponse {
  startDate?: string;
  endDate?: string;
}

const BOOTCAMP_STATUS_MAP: Record<string, string> = {
  PREPARING: '준비', RECRUITING: '모집', CLOSED: '마감',
  OPERATING: '운영', ENDED: '종료',
};

@Component({
  selector: 'adm-bootcamp-dashboard',
  standalone: true,
  imports: [CommonModule, DataGridComponent],
  templateUrl: './bootcamp-dashboard.page.html',
  styleUrl: './bootcamp-dashboard.page.css',
})
export class BootcampDashboardPage implements OnInit {
  private toast = inject(ToastService);
  private api = inject(ApiService);
  private bootcampCtx = inject(BootcampContextService);

  // ===== 기본 정보 섹션 =====
  sectionOpen = signal(true);
  dropdownOpen = signal(false);

  info = signal({
    id: 0,
    status: '',
    bootcampName: '',
    createdAt: '',
    recruitmentPeriod: '',
    educationPeriod: '',
  });

  statusBadgeClass = computed(() => {
    const status = this.info().status;
    return BOOTCAMP_STATUS_BADGES[status] || 'bg-zinc-50 border-zinc-200 text-zinc-500';
  });

  ngOnInit(): void {
    const id = this.bootcampCtx.currentBootcampId();
    if (id) {
      this.bootcampId = id;
      this.loadBootcamp(id);
      this.loadApplicants(id);
      this.loadInstructors(id);
    }
  }

  bootcampId = 0;

  async loadBootcamp(id: number): Promise<void> {
    try {
      const b = await this.api.bootcamps.findOne(id);
      this.info.set({
        id: b.id,
        status: BOOTCAMP_STATUS_MAP[b.status] || b.status,
        bootcampName: b.name,
        createdAt: formatDate(b.createdAt),
        recruitmentPeriod: '상시모집',
        educationPeriod: b.startDate && b.endDate
          ? `${new Date(b.startDate).toLocaleDateString('ko-KR')} ~ ${new Date(b.endDate).toLocaleDateString('ko-KR')}`
          : '-',
      });
    } catch (e) {
      console.error('부트캠프 로드 실패:', e);
    }
  }

  async loadInstructors(bootcampId: number): Promise<void> {
    try {
      const users = await this.api.bootcamps.findInstructors(bootcampId);
      const STATUS_MAP: Record<string, string> = {
        ACTIVE: '정상', BLOCKED: '차단', WITHDRAWN: '탈퇴',
      };
      this.instructorData.set(users.map(u => ({
        id: u.id,
        status: STATUS_MAP[u.status || ''] || u.status || '',
        name: u.name || '',
        nickname: u.nickname || '',
        phone: u.phone || '',
        email: u.email || '',
      })));
    } catch (e) {
      console.error('강사 목록 로드 실패:', e);
    }
  }

  async loadApplicants(bootcampId: number): Promise<void> {
    try {
      const data = await this.api.applicants.findByBootcamp(bootcampId);
      const STATUS_MAP: Record<string, string> = {
        PENDING: '대기', ACCEPTED: '합격', WAITING: '수강대기', COMPLETED: '수료', REJECTED: '불합격',
      };
      const applicants = data as unknown as ApplicantResponse[];
      const filtered = applicants.filter(a => a.status !== 'REJECTED');
      this.studentData.set(filtered.map(a => {
        const iq = a.interviewQuestions as Record<string, string> | null;
        return {
          id: a.id,
          status: STATUS_MAP[a.status] || a.status,
          name: iq?.['applicantName'] || a.user?.name || '',
          nickname: '',
          phone: iq?.['phone'] || a.user?.phone || '',
          email: iq?.['email'] || a.user?.email || '',
        };
      }));
    } catch (e) {
      console.error('지원자 목록 로드 실패:', e);
    }
  }

  toggleSection(): void { this.sectionOpen.update(v => !v); }
  toggleDropdown(event?: Event): void { event?.stopPropagation(); this.dropdownOpen.update(v => !v); }

  @HostListener('document:click')
  onDocumentClick(): void { this.dropdownOpen.set(false); this.statusSubMenuOpen.set(false); }

  // 상태 변경 서브메뉴
  statusSubMenuOpen = signal(false);
  readonly STATUS_OPTIONS = [
    { value: 'PREPARING', label: '준비' },
    { value: 'RECRUITING', label: '모집' },
    { value: 'OPERATING', label: '운영' },
    { value: 'CLOSED', label: '마감' },
    { value: 'ENDED', label: '종료' },
  ];

  onDropdownAction(action: string): void {
    if (action === '상태 변경') {
      this.statusSubMenuOpen.update(v => !v);
      return;
    }
    this.dropdownOpen.set(false);
    this.statusSubMenuOpen.set(false);
    if (action === '수정') {
      this.openBootcampEditDrawer();
    } else if (action === '삭제') {
      this.showBootcampDeleteModal.set(true);
    }
  }

  async changeBootcampStatus(status: string): Promise<void> {
    this.dropdownOpen.set(false);
    this.statusSubMenuOpen.set(false);
    try {
      await this.api.bootcamps.update(this.bootcampId, { status } as Record<string, string>);
      this.toast.success('상태가 변경되었습니다.');
      await this.loadBootcamp(this.bootcampId);
      await this.loadApplicants(this.bootcampId);
      await this.loadInstructors(this.bootcampId);
    } catch {
      this.toast.error('상태 변경에 실패했습니다.');
    }
  }

  // ===== 부트캠프 수정 드로어 =====
  bootcampEditOpen = signal(false);
  editBootcampName = signal('');
  editBootcampStartDate = signal('');
  editBootcampEndDate = signal('');

  openBootcampEditDrawer(): void {
    const b = this.info();
    this.editBootcampName.set(b.bootcampName || '');
    // educationPeriod에서 날짜 추출 시도
    this.editBootcampStartDate.set('');
    this.editBootcampEndDate.set('');
    this.bootcampEditOpen.set(true);
    // 원본 데이터에서 날짜 로드
    this.api.bootcamps.findOne(this.bootcampId).then((bk: unknown) => {
      const bc = bk as BootcampDetailResponse;
      if (bc.startDate) this.editBootcampStartDate.set(new Date(bc.startDate).toISOString().substring(0, 10));
      if (bc.endDate) this.editBootcampEndDate.set(new Date(bc.endDate).toISOString().substring(0, 10));
    });
  }

  closeBootcampEditDrawer(): void { this.bootcampEditOpen.set(false); }

  async submitBootcampEdit(): Promise<void> {
    const name = this.editBootcampName().trim();
    if (!name) { this.toast.error('부트캠프명을 입력해주세요.'); return; }
    try {
      const payload: BootcampEditPayload = { name };
      if (this.editBootcampStartDate()) payload.startDate = this.editBootcampStartDate();
      if (this.editBootcampEndDate()) payload.endDate = this.editBootcampEndDate();
      await this.api.bootcamps.update(this.bootcampId, payload);
      this.toast.success('수정 완료 되었습니다.');
      this.bootcampEditOpen.set(false);
      await this.loadBootcamp(this.bootcampId);
    } catch {
      this.toast.error('수정에 실패했습니다.');
    }
  }

  // ===== 부트캠프 삭제 모달 =====
  showBootcampDeleteModal = signal(false);

  cancelBootcampDelete(): void { this.showBootcampDeleteModal.set(false); }

  async confirmBootcampDelete(): Promise<void> {
    try {
      await this.api.bootcamps.delete(this.bootcampId);
      this.toast.success('삭제 완료 되었습니다.');
      this.showBootcampDeleteModal.set(false);
      // 메인 목록으로 이동
      window.history.back();
    } catch {
      this.toast.error('삭제에 실패했습니다.');
    }
  }

  // ===== 강사 목록 섹션 =====
  instructorSectionOpen = signal(true);

  instructorColumns: GridColumn[] = [
    { key: 'id', label: '순번', width: '60px' },
    { key: 'status', label: '상태', width: '80px', badge: 'status', badgeStyles: MEMBER_STATUS_BADGES },
    { key: 'name', label: '이름' },
    { key: 'nickname', label: '닉네임' },
    { key: 'phone', label: '연락처' },
    { key: 'email', label: '이메일' },
    { key: 'delete', label: '', width: '40px', type: 'action' },
  ];

  instructorData = signal<PersonRow[]>([]);

  toggleInstructorSection(): void { this.instructorSectionOpen.update(v => !v); }

  // ===== 강사 내보내기 다이얼로그 =====
  showInstructorRemoveDialog = signal(false);
  selectedInstructor = signal<PersonRow | null>(null);

  removeInstructor(event: { key: string; row: GridRow }): void {
    this.selectedInstructor.set(event.row as unknown as PersonRow);
    this.showInstructorRemoveDialog.set(true);
  }

  async confirmRemoveInstructor(): Promise<void> {
    const instructor = this.selectedInstructor();
    if (instructor) {
      try {
        await this.api.bootcamps.removeInstructor(this.bootcampId, instructor.id);
        await this.loadInstructors(this.bootcampId);
        this.toast.show('강사가 제거되었습니다.', 'success');
      } catch (e) {
        console.error('강사 제거 실패:', e);
        this.toast.show('강사 제거에 실패했습니다.', 'error');
      }
    }
    this.showInstructorRemoveDialog.set(false);
    this.selectedInstructor.set(null);
  }

  cancelRemoveInstructor(): void {
    this.showInstructorRemoveDialog.set(false);
    this.selectedInstructor.set(null);
  }

  // ===== 수강생 목록 섹션 =====
  studentSectionOpen = signal(true);
  studentColumns: GridColumn[] = [
    { key: 'id', label: '순번', width: '60px' },
    { key: 'status', label: '상태', width: '80px', badge: 'status', badgeStyles: APPLICANT_STATUS_BADGES },
    { key: 'name', label: '이름' },
    { key: 'phone', label: '연락처' },
    { key: 'email', label: '이메일' },
    { key: 'delete', label: '', width: '40px', type: 'action' },
  ];
  studentData = signal<PersonRow[]>([]);

  toggleStudentSection(): void { this.studentSectionOpen.update(v => !v); }

  // ===== 수강생 내보내기 다이얼로그 =====
  showRemoveDialog = signal(false);
  selectedStudent = signal<PersonRow | null>(null);

  removeStudent(event: { key: string; row: GridRow }): void {
    this.selectedStudent.set(event.row as unknown as PersonRow);
    this.showRemoveDialog.set(true);
  }

  async confirmRemoveStudent(): Promise<void> {
    const student = this.selectedStudent();
    if (student) {
      try {
        await this.api.applicants.updateStatus(student.id, 'REJECTED');
        await this.loadApplicants(this.bootcampId);
      } catch (e) {
        console.error('수강생 내보내기 실패:', e);
      }
    }
    this.showRemoveDialog.set(false);
    this.selectedStudent.set(null);
  }

  cancelRemoveStudent(): void {
    this.showRemoveDialog.set(false);
    this.selectedStudent.set(null);
  }

  // ===== 강사 초대 드로어 =====
  instructorDrawerOpen = signal(false);
  instructorInviteForm = signal({ email: '', role: '', name: '', phone: '' });

  openInstructorDrawer(): void {
    this.instructorDrawerOpen.set(true);
    this.instructorInviteForm.set({ email: '', role: '', name: '', phone: '' });
    this.searchedInstructor.set(null);
    this.searchMessage.set({ text: '', type: 'info' });
  }

  closeInstructorDrawer(): void { this.instructorDrawerOpen.set(false); }

  updateInstructorField(field: string, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.instructorInviteForm.update(f => ({ ...f, [field]: value }));
  }

  // 검색 결과 메시지
  searchedInstructor = signal<UserResponse | null>(null);
  searchMessage = signal<{ text: string; type: 'success' | 'error' | 'info' }>({ text: '', type: 'info' });

  async searchInstructor(): Promise<void> {
    const email = this.instructorInviteForm().email;
    if (!email) {
      this.searchMessage.set({ text: '이메일을 입력하세요.', type: 'error' });
      return;
    }
    try {
      const users = await this.api.users.findAll({ search: email, role: 'INSTRUCTOR' }) as unknown as UserResponse[] | { data: UserResponse[] };
      const list: UserResponse[] = Array.isArray(users) ? users : (users?.data || []);
      const user = list.find((u: UserResponse) => u.email === email);
      if (!user) {
        this.searchMessage.set({ text: '해당 이메일의 강사 계정을 찾을 수 없습니다.', type: 'error' });
        this.searchedInstructor.set(null);
        return;
      }
      this.searchedInstructor.set(user);
      // 중복 체크
      const alreadyExists = this.instructorData().some(i => i.id === user.id);
      if (alreadyExists) {
        this.searchMessage.set({ text: `'${user.name}'은(는) 이미 등록된 강사입니다.`, type: 'error' });
        this.searchedInstructor.set(null);
        return;
      }
      this.instructorInviteForm.update(f => ({ ...f, name: user.name || '', phone: user.phone || '' }));
      this.searchMessage.set({ text: `강사 '${user.name}'을(를) 찾았습니다.`, type: 'success' });
    } catch (e: unknown) {
      console.error('강사 검색 실패:', e);
      this.searchMessage.set({ text: '강사 검색에 실패했습니다.', type: 'error' });
    }
  }

  async submitInstructorInvite(): Promise<void> {
    const user = this.searchedInstructor();
    if (!user) {
      this.searchMessage.set({ text: '먼저 이메일로 강사를 검색하세요.', type: 'error' });
      return;
    }
    try {
      await this.api.bootcamps.addInstructor(this.bootcampId, user.id);
      await this.loadInstructors(this.bootcampId);
      this.closeInstructorDrawer();
    } catch (e: unknown) {
      console.error('강사 초대 실패:', e);
      const msg = e instanceof Error ? e.message : '강사 초대에 실패했습니다.';
      this.searchMessage.set({ text: msg, type: 'error' });
    }
  }

  // ===== 수강생 초대 드로어 =====
  studentDrawerOpen = signal(false);
  studentInviteForm = signal({ email: '', role: '', name: '', phone: '' });
  searchedStudent = signal<UserResponse | null>(null);
  studentSearchMessage = signal<{ text: string; type: 'success' | 'error' | 'info' }>({ text: '', type: 'info' });

  openStudentDrawer(): void {
    this.studentDrawerOpen.set(true);
    this.studentInviteForm.set({ email: '', role: '', name: '', phone: '' });
    this.searchedStudent.set(null);
    this.studentSearchMessage.set({ text: '', type: 'info' });
  }

  closeStudentDrawer(): void { this.studentDrawerOpen.set(false); }

  updateStudentField(field: string, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.studentInviteForm.update(f => ({ ...f, [field]: value }));
  }

  async searchStudent(): Promise<void> {
    const email = this.studentInviteForm().email;
    if (!email) {
      this.studentSearchMessage.set({ text: '이메일을 입력하세요.', type: 'error' });
      return;
    }
    try {
      const users = await this.api.users.findAll({ search: email, role: 'STUDENT' }) as unknown as UserResponse[] | { data: UserResponse[] };
      const list: UserResponse[] = Array.isArray(users) ? users : (users?.data || []);
      const user = list.find((u: UserResponse) => u.email === email);
      if (!user) {
        this.studentSearchMessage.set({ text: '해당 이메일의 수강생 계정을 찾을 수 없습니다.', type: 'error' });
        this.searchedStudent.set(null);
        return;
      }
      this.searchedStudent.set(user);
      // 중복 체크: userId 기반 (applicant가 아닌 user.id로 비교)
      const alreadyExists = this.studentData().some(s => s.email === user.email);
      if (alreadyExists) {
        this.studentSearchMessage.set({ text: `'${user.name}'은(는) 이미 등록된 수강생입니다.`, type: 'error' });
        this.searchedStudent.set(null);
        return;
      }
      this.studentInviteForm.update(f => ({ ...f, name: user.name || '', phone: user.phone || '' }));
      this.studentSearchMessage.set({ text: `수강생 '${user.name}'을(를) 찾았습니다.`, type: 'success' });
    } catch (e: unknown) {
      console.error('수강생 검색 실패:', e);
      this.studentSearchMessage.set({ text: '수강생 검색에 실패했습니다.', type: 'error' });
    }
  }

  async submitStudentInvite(): Promise<void> {
    const user = this.searchedStudent();
    if (!user) {
      this.studentSearchMessage.set({ text: '먼저 이메일로 수강생을 검색하세요.', type: 'error' });
      return;
    }
    try {
      await this.api.applicants.invite(this.bootcampId, user.email);
      await this.loadApplicants(this.bootcampId);
      this.closeStudentDrawer();
    } catch (e: unknown) {
      console.error('수강생 초대 실패:', e);
      const err = e as { error?: { message?: string } };
      this.studentSearchMessage.set({ text: err?.error?.message || '수강생 초대에 실패했습니다.', type: 'error' });
    }
  }
}
