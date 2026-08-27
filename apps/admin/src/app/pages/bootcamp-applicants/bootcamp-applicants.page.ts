import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { DataGridComponent, GridColumn } from '../../components/data-grid/data-grid.component';
import { MEMBER_STATUS_BADGES } from '../../shared/badge-styles';
import { ToastService } from '../../shared/toast/toast.service';
import { ApiService } from '../../services/api.service';
import { Applicant } from '../../shared/types';

interface ApplicantRow {
  id: number;
  status: string;
  name: string;
  phone: string;
  email: string;
  appliedAt: string;
}

const STATUS_MAP: Record<string, string> = {
  PENDING: '대기', APPROVED: '합격', REJECTED: '불합격', CANCELLED: '취소',
};

function toApplicantRow(a: Applicant): ApplicantRow {
  return {
    id: a.id,
    status: STATUS_MAP[a.status] || a.status,
    name: a.user?.name || '',
    phone: a.user?.phone || '',
    email: a.user?.email || '',
    appliedAt: new Date(a.createdAt).toLocaleString('ko-KR'),
  };
}

@Component({
  selector: 'adm-bootcamp-applicants',
  standalone: true,
  imports: [CommonModule, DataGridComponent],
  templateUrl: './bootcamp-applicants.page.html',
  styleUrl: './bootcamp-applicants.page.css',
})
export class BootcampApplicantsPage implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);
  private api = inject(ApiService);

  selectedApplicants = signal<ApplicantRow[]>([]);
  statusDropdownOpen = signal(false);
  showPassDialog = signal(false);

  bootcampName = '';
  bootcampId = 0;

  columns: GridColumn[] = [
    { key: 'id', label: '순번', width: '60px' },
    { key: 'status', label: '상태', width: '80px', badge: 'status', badgeStyles: MEMBER_STATUS_BADGES },
    { key: 'name', label: '이름' },
    { key: 'phone', label: '연락처' },
    { key: 'email', label: '이메일' },
    { key: 'appliedAt', label: '지원일시', width: '160px' },
  ];

  applicantData = signal<ApplicantRow[]>([]);

  ngOnInit(): void {
    this.bootcampId = Number(this.route.snapshot.paramMap.get('bootcampId') || this.route.parent?.snapshot.paramMap.get('id') || 1);
    this.loadApplicants();
  }

  async loadApplicants(): Promise<void> {
    try {
      const data = await this.api.applicants.findByBootcamp(this.bootcampId);
      this.applicantData.set(data.map(toApplicantRow));
      if (data.length > 0 && data[0].bootcamp) {
        this.bootcampName = data[0].bootcamp.name;
      }
    } catch (e) {
      console.error('지원자 목록 로드 실패:', e);
    }
  }

  selectedLabel = computed(() => {
    const list = this.selectedApplicants();
    if (list.length === 0) return '';
    if (list.length === 1) return list[0].name;
    return `${list[0].name} 외 ${list.length - 1}명`;
  });

  onSelectionChange(selected: ApplicantRow[]): void {
    this.selectedApplicants.set(selected);
  }

  onRowClick(row: ApplicantRow): void {
    this.router.navigate(['/bootcamp/home/applicants', row.id]);
  }

  toggleStatusDropdown(): void { this.statusDropdownOpen.update(v => !v); }
  closeStatusDropdown(): void { this.statusDropdownOpen.set(false); }

  onPassClick(): void {
    this.statusDropdownOpen.set(false);
    this.showPassDialog.set(true);
  }

  async confirmPass(): Promise<void> {
    const ids = this.selectedApplicants().map(a => a.id);
    try {
      await this.api.applicants.bulkUpdateStatus(ids, 'APPROVED');
      this.toast.success('합격 처리 되었습니다.');
      await this.loadApplicants();
    } catch (e: unknown) { this.toast.error(e instanceof Error ? e.message : '처리 실패'); }
    this.showPassDialog.set(false);
  }

  cancelPassDialog(): void { this.showPassDialog.set(false); }

  // ===== 불합격 다이얼로그 =====
  showFailDialog = signal(false);

  onFailClick(): void {
    this.statusDropdownOpen.set(false);
    this.showFailDialog.set(true);
  }

  async confirmFail(): Promise<void> {
    const ids = this.selectedApplicants().map(a => a.id);
    try {
      await this.api.applicants.bulkUpdateStatus(ids, 'REJECTED');
      this.toast.success('불합격 처리 되었습니다.');
      await this.loadApplicants();
    } catch (e: unknown) { this.toast.error(e instanceof Error ? e.message : '처리 실패'); }
    this.showFailDialog.set(false);
  }

  cancelFailDialog(): void { this.showFailDialog.set(false); }

  async changeStatus(status: string): Promise<void> {
    const ids = this.selectedApplicants().map(a => a.id);
    const statusMap: Record<string, string> = { '합격': 'APPROVED', '불합격': 'REJECTED', '대기': 'PENDING' };
    try {
      await this.api.applicants.bulkUpdateStatus(ids, statusMap[status] || status);
      this.toast.success('상태 변경 완료');
      await this.loadApplicants();
    } catch (e: unknown) { this.toast.error(e instanceof Error ? e.message : '처리 실패'); }
    this.statusDropdownOpen.set(false);
  }
}
