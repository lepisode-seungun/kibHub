import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { DataGridComponent, GridColumn } from '../../components/data-grid/data-grid.component';
import { MEMBER_STATUS_BADGES } from '../../shared/badge-styles';
import { ToastService } from '../../shared/toast/toast.service';
import { ApiService } from '../../services/api.service';
import { Bootcamp } from '../../shared/types';

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
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);
  private api = inject(ApiService);

  // ===== 기본 정보 섹션 =====
  sectionOpen = signal(true);
  dropdownOpen = signal(false);

  info = {
    id: 0,
    status: '',
    bootcampName: '',
    createdAt: '',
    recruitmentPeriod: '',
    educationPeriod: '',
  };

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id') || 1);
    this.loadBootcamp(id);
  }

  async loadBootcamp(id: number): Promise<void> {
    try {
      const b = await this.api.bootcamps.findOne(id);
      this.info = {
        id: b.id,
        status: BOOTCAMP_STATUS_MAP[b.status] || b.status,
        bootcampName: b.name,
        createdAt: new Date(b.createdAt).toLocaleString('ko-KR'),
        recruitmentPeriod: '상시모집',
        educationPeriod: b.startDate && b.endDate
          ? `${new Date(b.startDate).toLocaleDateString('ko-KR')} ~ ${new Date(b.endDate).toLocaleDateString('ko-KR')}`
          : '-',
      };
    } catch (e) {
      console.error('부트캠프 로드 실패:', e);
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

  confirmRemoveInstructor(): void {
    const instructor = this.selectedInstructor();
    if (instructor) {
      this.instructorData = this.instructorData.filter(d => d.id !== instructor.id);
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
  studentColumns = this.instructorColumns;
  studentData: PersonRow[] = [];

  toggleStudentSection(): void { this.studentSectionOpen.update(v => !v); }

  // ===== 수강생 내보내기 다이얼로그 =====
  showRemoveDialog = signal(false);
  selectedStudent = signal<PersonRow | null>(null);

  removeStudent(event: { key: string; row: PersonRow }): void {
    this.selectedStudent.set(event.row);
    this.showRemoveDialog.set(true);
  }

  confirmRemoveStudent(): void {
    const student = this.selectedStudent();
    if (student) {
      this.studentData = this.studentData.filter(d => d.id !== student.id);
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
  }

  closeInstructorDrawer(): void { this.instructorDrawerOpen.set(false); }

  updateInstructorField(field: string, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.instructorInviteForm.update(f => ({ ...f, [field]: value }));
  }

  submitInstructorInvite(): void {
    const form = this.instructorInviteForm();
    if (form.email && form.name) {
      const nextId = this.instructorData.length + 1;
      this.instructorData = [...this.instructorData, {
        id: nextId, status: '정상', name: form.name,
        nickname: '', phone: form.phone, email: form.email,
      }];
      this.closeInstructorDrawer();
    }
  }

  // ===== 수강생 초대 드로어 =====
  studentDrawerOpen = signal(false);
  studentInviteForm = signal({ email: '', role: '', name: '', phone: '' });

  openStudentDrawer(): void {
    this.studentDrawerOpen.set(true);
    this.studentInviteForm.set({ email: '', role: '', name: '', phone: '' });
  }

  closeStudentDrawer(): void { this.studentDrawerOpen.set(false); }

  updateStudentField(field: string, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.studentInviteForm.update(f => ({ ...f, [field]: value }));
  }

  submitStudentInvite(): void {
    const form = this.studentInviteForm();
    if (form.email && form.name) {
      const nextId = this.studentData.length + 1;
      this.studentData = [...this.studentData, {
        id: nextId, status: '정상', name: form.name,
        nickname: '', phone: form.phone, email: form.email,
      }];
      this.closeStudentDrawer();
    }
  }
}
