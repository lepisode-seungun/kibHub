import { formatDate } from '../../shared/format-date';
import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataGridComponent, GridColumn } from '../../components/data-grid/data-grid.component';
import { MEMBER_STATUS_BADGES, APPLICANT_STATUS_BADGES } from '../../shared/badge-styles';
import { ToastService } from '../../shared/toast/toast.service';
import { ApiService } from '../../services/api.service';
import { BootcampContextService } from '../../services/bootcamp-context.service';
import { Bootcamp, Applicant } from '../../shared/types';

interface PersonRow {
  id: number;
  status: string;
  name: string;
  nickname: string;
  phone: string;
  email: string;
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
      this.instructorData = users.map((u: any) => ({
        id: u.id,
        status: STATUS_MAP[u.status] || u.status,
        name: u.name || '',
        nickname: u.nickname || '',
        phone: u.phone || '',
        email: u.email || '',
      }));
    } catch (e) {
      console.error('강사 목록 로드 실패:', e);
    }
  }

  async loadApplicants(bootcampId: number): Promise<void> {
    try {
      const data = await this.api.applicants.findByBootcamp(bootcampId);
      const STATUS_MAP: Record<string, string> = {
        PENDING: '대기', ACCEPTED: '합격', REJECTED: '불합격',
      };
      const filtered = data.filter((a: any) => a.status !== 'REJECTED');
      this.studentData.set(filtered.map((a: any) => {
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
  toggleDropdown(): void { this.dropdownOpen.update(v => !v); }
  onDropdownAction(_action: string): void { this.dropdownOpen.set(false); }

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

  instructorData: PersonRow[] = [];

  toggleInstructorSection(): void { this.instructorSectionOpen.update(v => !v); }

  // ===== 강사 내보내기 다이얼로그 =====
  showInstructorRemoveDialog = signal(false);
  selectedInstructor = signal<PersonRow | null>(null);

  removeInstructor(event: { key: string; row: PersonRow }): void {
    this.selectedInstructor.set(event.row);
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

  removeStudent(event: { key: string; row: PersonRow }): void {
    this.selectedStudent.set(event.row);
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
  searchedInstructor = signal<any>(null);
  searchMessage = signal<{ text: string; type: 'success' | 'error' | 'info' }>({ text: '', type: 'info' });

  async searchInstructor(): Promise<void> {
    const email = this.instructorInviteForm().email;
    if (!email) {
      this.searchMessage.set({ text: '이메일을 입력하세요.', type: 'error' });
      return;
    }
    try {
      const users = await this.api.users.findAll({ search: email, role: 'INSTRUCTOR' }) as any;
      const list = Array.isArray(users) ? users : (users?.data || []);
      const user = list.find((u: any) => u.email === email);
      if (!user) {
        this.searchMessage.set({ text: '해당 이메일의 강사 계정을 찾을 수 없습니다.', type: 'error' });
        this.searchedInstructor.set(null);
        return;
      }
      this.searchedInstructor.set(user);
      this.instructorInviteForm.update(f => ({ ...f, name: user.name || '', phone: user.phone || '' }));
      this.searchMessage.set({ text: `강사 '${user.name}'을(를) 찾았습니다.`, type: 'success' });
    } catch (e: any) {
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
    } catch (e: any) {
      console.error('강사 초대 실패:', e);
      this.searchMessage.set({ text: e?.message || '강사 초대에 실패했습니다.', type: 'error' });
    }
  }

  // ===== 수강생 초대 드로어 =====
  studentDrawerOpen = signal(false);
  studentInviteForm = signal({ email: '', role: '', name: '', phone: '' });
  searchedStudent = signal<any>(null);
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
      const users = await this.api.users.findAll({ search: email, role: 'STUDENT' }) as any;
      const list = Array.isArray(users) ? users : (users?.data || []);
      const user = list.find((u: any) => u.email === email);
      if (!user) {
        this.studentSearchMessage.set({ text: '해당 이메일의 수강생 계정을 찾을 수 없습니다.', type: 'error' });
        this.searchedStudent.set(null);
        return;
      }
      this.searchedStudent.set(user);
      this.studentInviteForm.update(f => ({ ...f, name: user.name || '', phone: user.phone || '' }));
      this.studentSearchMessage.set({ text: `수강생 '${user.name}'을(를) 찾았습니다.`, type: 'success' });
    } catch (e: any) {
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
    } catch (e: any) {
      console.error('수강생 초대 실패:', e);
      this.studentSearchMessage.set({ text: e?.error?.message || '수강생 초대에 실패했습니다.', type: 'error' });
    }
  }
}
