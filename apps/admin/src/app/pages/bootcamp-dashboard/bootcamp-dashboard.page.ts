import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataGridComponent, GridColumn } from '../../components/data-grid/data-grid.component';
import { MEMBER_STATUS_BADGES } from '../../shared/badge-styles';

@Component({
  selector: 'adm-bootcamp-dashboard',
  standalone: true,
  imports: [CommonModule, DataGridComponent],
  templateUrl: './bootcamp-dashboard.page.html',
  styleUrl: './bootcamp-dashboard.page.css',
})
export class BootcampDashboardPage {
  // ===== 기본 정보 섹션 =====
  sectionOpen = signal(true);
  dropdownOpen = signal(false);

  info = {
    id: 1,
    status: '준비',
    bootcampName: '케나즈 아카데미 초급반/중급반 13기',
    createdAt: '2025-01-16 13:18',
    recruitmentPeriod: '상시모집',
    educationPeriod: '2025-01-16 ~ 2025-01-16',
  };

  toggleSection(): void {
    this.sectionOpen.update(v => !v);
  }

  toggleDropdown(): void {
    this.dropdownOpen.update(v => !v);
  }

  onDropdownAction(action: string): void {
    this.dropdownOpen.set(false);
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

  instructorData = [
    { id: 1, status: '정상', name: '김민수', nickname: 'minsu_k', phone: '010-1234-5678', email: 'minsu@example.com' },
    { id: 2, status: '정상', name: '이지은', nickname: 'jieun_art', phone: '010-2345-6789', email: 'jieun@example.com' },
    { id: 3, status: '정상', name: '박서준', nickname: 'seojun_p', phone: '010-3456-7890', email: 'seojun@example.com' },
  ];

  toggleInstructorSection(): void {
    this.instructorSectionOpen.update(v => !v);
  }

  // ===== 강사 내보내기 다이얼로그 =====
  showInstructorRemoveDialog = signal(false);
  selectedInstructor = signal<any>(null);

  removeInstructor(event: { key: string; row: any }): void {
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

  studentData = [
    { id: 1, status: '정상', name: '최유리', nickname: 'yuri_c', phone: '010-4567-8901', email: 'yuri@example.com' },
    { id: 2, status: '정상', name: '한소희', nickname: 'sohee_h', phone: '010-5678-9012', email: 'sohee@example.com' },
    { id: 3, status: '차단', name: '정우성', nickname: 'ws_jung', phone: '010-6789-0123', email: 'woosung@example.com' },
    { id: 4, status: '정상', name: '김태리', nickname: 'taeri_k', phone: '010-7890-1234', email: 'taeri@example.com' },
  ];

  toggleStudentSection(): void {
    this.studentSectionOpen.update(v => !v);
  }

  // ===== 수강생 내보내기 다이얼로그 =====
  showRemoveDialog = signal(false);
  selectedStudent = signal<any>(null);

  removeStudent(event: { key: string; row: any }): void {
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

  closeInstructorDrawer(): void {
    this.instructorDrawerOpen.set(false);
  }

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

  closeStudentDrawer(): void {
    this.studentDrawerOpen.set(false);
  }

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
