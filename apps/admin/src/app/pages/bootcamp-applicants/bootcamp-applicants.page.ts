import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DataGridComponent, GridColumn } from '../../components/data-grid/data-grid.component';
import { MEMBER_STATUS_BADGES } from '../../shared/badge-styles';
import { ToastService } from '../../shared/toast/toast.service';
import { ApiService } from '../../services/api.service';
import { BootcampContextService } from '../../services/bootcamp-context.service';
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
  PENDING: '대기', ACCEPTED: '합격', REJECTED: '불합격', CANCELLED: '취소',
};

function toApplicantRow(a: Applicant): ApplicantRow {
  const iq = (a as any).interviewQuestions as Record<string, string> | null;
  return {
    id: a.id,
    status: STATUS_MAP[a.status] || a.status,
    name: iq?.['applicantName'] || a.user?.name || '',
    phone: iq?.['phone'] || a.user?.phone || '',
    email: iq?.['email'] || a.user?.email || '',
    appliedAt: new Date((a as any).appliedAt || a.createdAt).toLocaleString('ko-KR'),
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
  private toast = inject(ToastService);
  private api = inject(ApiService);
  private bootcampCtx = inject(BootcampContextService);

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
    this.bootcampId = this.bootcampCtx.currentBootcampId() || 0;
    this.bootcampName = this.bootcampCtx.currentBootcampName() || '';
    if (this.bootcampId) this.loadApplicants();
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
      await this.api.applicants.bulkUpdateStatus(ids, 'ACCEPTED');
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
    const statusMap: Record<string, string> = { '합격': 'ACCEPTED', '불합격': 'REJECTED', '대기': 'PENDING' };
    try {
      await this.api.applicants.bulkUpdateStatus(ids, statusMap[status] || status);
      this.toast.success('상태 변경 완료');
      await this.loadApplicants();
    } catch (e: unknown) { this.toast.error(e instanceof Error ? e.message : '처리 실패'); }
    this.statusDropdownOpen.set(false);
  }

  // ===== 사전인터뷰 설정 드로어 =====
  interviewDrawerOpen = signal(false);
  drawerQuestions = signal<{ text: string; editing: boolean }[]>([]);

  async openInterviewDrawer(): Promise<void> {
    // DB에서 기존 질문 로드
    try {
      const existing = await this.api.bootcamps.getInterviewSettings(this.bootcampId);
      this.drawerQuestions.set(
        existing.map((q: any) => ({ text: q.text || '', editing: false }))
      );
    } catch {
      this.drawerQuestions.set([]);
    }
    this.interviewDrawerOpen.set(true);
  }

  closeInterviewDrawer(): void {
    this.interviewDrawerOpen.set(false);
  }

  addDrawerQuestion(): void {
    this.drawerQuestions.update(qs => [...qs, { text: '', editing: true }]);
  }

  async removeDrawerQuestion(index: number): Promise<void> {
    this.drawerQuestions.update(qs => qs.filter((_, i) => i !== index));
    // 삭제 즉시 DB 저장
    const questions = this.drawerQuestions()
      .filter(q => q.text.trim())
      .map(q => ({ text: q.text.trim() }));
    try {
      await this.api.bootcamps.updateInterviewSettings(this.bootcampId, questions);
      this.toast.success('질문이 삭제되었습니다.');
    } catch {
      this.toast.error('삭제 저장에 실패했습니다.');
    }
  }

  updateDrawerQuestion(index: number, value: string): void {
    this.drawerQuestions.update(qs =>
      qs.map((q, i) => i === index ? { ...q, text: value } : q)
    );
  }

  editDrawerQuestion(index: number): void {
    this.drawerQuestions.update(qs =>
      qs.map((q, i) => i === index ? { ...q, editing: true } : q)
    );
  }

  saveDrawerQuestion(index: number): void {
    this.drawerQuestions.update(qs =>
      qs.map((q, i) => i === index ? { ...q, editing: false } : q)
    );
  }

  async submitInterviewDrawer(): Promise<void> {
    const questions = this.drawerQuestions()
      .filter(q => q.text.trim())
      .map(q => ({ text: q.text.trim() }));
    console.log('[인터뷰설정] 저장 bootcampId:', this.bootcampId, '질문수:', questions.length, questions);
    try {
      const result = await this.api.bootcamps.updateInterviewSettings(this.bootcampId, questions);
      console.log('[인터뷰설정] 저장 성공:', result);
      this.toast.success('사전인터뷰 설정이 저장되었습니다.');
    } catch (e: any) {
      console.error('[인터뷰설정] 저장 실패:', e);
      this.toast.error('저장 실패: ' + (e?.error?.message || e?.message || '알 수 없는 오류'));
    }
    this.interviewDrawerOpen.set(false);
  }
}
