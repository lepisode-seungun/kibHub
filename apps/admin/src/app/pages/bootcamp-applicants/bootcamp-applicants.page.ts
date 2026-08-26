import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DataGridComponent, GridColumn } from '../../components/data-grid/data-grid.component';
import { MEMBER_STATUS_BADGES } from '../../shared/badge-styles';

@Component({
  selector: 'adm-bootcamp-applicants',
  standalone: true,
  imports: [CommonModule, DataGridComponent],
  templateUrl: './bootcamp-applicants.page.html',
  styleUrl: './bootcamp-applicants.page.css',
})
export class BootcampApplicantsPage {
  private router = inject(Router);
  selectedApplicants = signal<any[]>([]);
  statusDropdownOpen = signal(false);
  showPassDialog = signal(false);

  bootcampName = '케나즈 아카데미 초급반/중급반 13기';

  columns: GridColumn[] = [
    { key: 'id', label: '순번', width: '60px' },
    { key: 'status', label: '상태', width: '80px', badge: 'status', badgeStyles: MEMBER_STATUS_BADGES },
    { key: 'name', label: '이름' },
    { key: 'phone', label: '연락처' },
    { key: 'email', label: '이메일' },
    { key: 'appliedAt', label: '지원일시', width: '160px' },
  ];

  applicantData = [
    { id: 1, status: '정상', name: '고예림', phone: '010-1111-2222', email: 'yelim@lepisode.team', appliedAt: '2025-01-10 09:00' },
    { id: 2, status: '정상', name: '이수진', phone: '010-3333-4444', email: 'sujin@lepisode.team', appliedAt: '2025-01-11 14:30' },
    { id: 3, status: '차단', name: '박지호', phone: '010-5555-6666', email: 'jiho@lepisode.team', appliedAt: '2025-01-12 10:15' },
    { id: 4, status: '정상', name: '김도윤', phone: '010-7777-8888', email: 'doyun@lepisode.team', appliedAt: '2025-01-13 16:45' },
    { id: 5, status: '정상', name: '최서아', phone: '010-9999-0000', email: 'seoa@lepisode.team', appliedAt: '2025-01-14 11:20' },
  ];

  selectedLabel = computed(() => {
    const list = this.selectedApplicants();
    if (list.length === 0) return '';
    if (list.length === 1) return list[0].name;
    return `${list[0].name} 외 ${list.length - 1}명`;
  });

  onSelectionChange(selected: any[]): void {
    this.selectedApplicants.set(selected);
  }

  onRowClick(row: any): void {
    this.router.navigate(['/bootcamp/home/applicants', row.id]);
  }

  toggleStatusDropdown(): void {
    this.statusDropdownOpen.update(v => !v);
  }

  closeStatusDropdown(): void {
    this.statusDropdownOpen.set(false);
  }

  onPassClick(): void {
    this.statusDropdownOpen.set(false);
    this.showPassDialog.set(true);
  }

  confirmPass(): void {
    const selectedIds = new Set(this.selectedApplicants().map(a => a.id));
    this.applicantData = this.applicantData.map(row =>
      selectedIds.has(row.id) ? { ...row, status: '합격' } : row
    );
    this.showPassDialog.set(false);
  }

  cancelPassDialog(): void {
    this.showPassDialog.set(false);
  }

  // ===== 불합격 다이얼로그 =====
  showFailDialog = signal(false);

  onFailClick(): void {
    this.statusDropdownOpen.set(false);
    this.showFailDialog.set(true);
  }

  confirmFail(): void {
    const selectedIds = new Set(this.selectedApplicants().map(a => a.id));
    this.applicantData = this.applicantData.map(row =>
      selectedIds.has(row.id) ? { ...row, status: '불합격' } : row
    );
    this.showFailDialog.set(false);
  }

  cancelFailDialog(): void {
    this.showFailDialog.set(false);
  }

  changeStatus(status: string): void {
    const selectedIds = new Set(this.selectedApplicants().map(a => a.id));
    this.applicantData = this.applicantData.map(row =>
      selectedIds.has(row.id) ? { ...row, status } : row
    );
    this.statusDropdownOpen.set(false);
  }
}
