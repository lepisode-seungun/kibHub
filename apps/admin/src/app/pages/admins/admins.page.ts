import { formatDate } from '../../shared/format-date';
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DataGridComponent, GridColumn } from '../../components/data-grid/data-grid.component';
import { ADMIN_STATUS_BADGES, ADMIN_ROLE_BADGES } from '../../shared/badge-styles';
import { ToastService } from '../../shared/toast/toast.service';
import { ApiService } from '../../services/api.service';
import { User, AdminRow } from '../../shared/types';

function toAdminRow(u: User): AdminRow {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    nickname: u.nickname,
    phone: u.phone,
    countryCode: u.countryCode,
    status: u.status === 'ACTIVE' ? '정상' : '차단',
    role: u.adminRole === 'SUPER' ? '최고 관리자' : '일반 관리자',
    loginId: u.loginId || u.email,
    adminRole: u.adminRole,
    createdAt: formatDate(u.createdAt),
  };
}

@Component({
  selector: 'adm-admins',
  standalone: true,
  imports: [CommonModule, FormsModule, DataGridComponent],
  templateUrl: './admins.page.html',
  styleUrl: './admins.page.css',
})
export class AdminsPage implements OnInit {
  private router = inject(Router);
  private toast = inject(ToastService);
  private api = inject(ApiService);

  columns: GridColumn[] = [
    { key: 'id', label: '순번', width: '72px' },
    { key: 'status', label: '상태', badge: 'status', badgeStyles: ADMIN_STATUS_BADGES },
    { key: 'role', label: '권한', badge: 'role', badgeStyles: ADMIN_ROLE_BADGES },
    { key: 'name', label: '이름' },
    { key: 'loginId', label: '아이디' },
    { key: 'createdAt', label: '등록일시', width: '160px' },
  ];

  admins = signal<AdminRow[]>([]);

  // ===== 드로어 상태 =====
  drawerOpen = signal(false);
  drawerMode = signal<'create' | 'edit'>('create');
  editingAdminId = signal<number | null>(null);
  drawerForm = signal({
    role: '일반 관리자',
    loginId: '',
    name: '',
    password: '',
    passwordConfirm: '',
  });
  idCheckStatus = signal<'none' | 'available' | 'duplicate'>('none');
  roleDropdownOpen = signal(false);

  // ===== 삭제 모달 =====
  deleteModalOpen = signal(false);
  deleteTarget = signal<AdminRow | null>(null);

  // ===== 차단 모달 =====
  blockModalOpen = signal(false);
  blockTarget = signal<AdminRow | null>(null);

  getContextMenuItems = (row: AdminRow): string[] => {
    const blockLabel = row.status === '정상' ? '차단' : '차단해제';
    return ['수정', '삭제', blockLabel];
  };

  ngOnInit(): void {
    this.loadAdmins();
  }

  async loadAdmins(): Promise<void> {
    try {
      const data = await this.api.users.findAll({ role: 'ADMIN' });
      this.admins.set(data.map(toAdminRow));
    } catch (e) {
      console.error('관리자 목록 로드 실패:', e);
    }
  }

  onRegister(): void {
    this.resetForm();
    this.drawerMode.set('create');
    this.editingAdminId.set(null);
    this.drawerOpen.set(true);
  }

  closeDrawer(): void { this.drawerOpen.set(false); }

  onRowClick(_row: AdminRow): void {}

  onContextMenu(event: { action: string; row: AdminRow }): void {
    const { action, row } = event;
    switch (action) {
      case '수정': this.openEditDrawer(row); break;
      case '삭제':
        this.deleteTarget.set(row);
        this.deleteModalOpen.set(true);
        break;
      case '차단':
      case '차단해제':
        this.blockTarget.set(row);
        this.blockModalOpen.set(true);
        break;
    }
  }

  // ===== 드로어 폼 =====
  updateField(field: string, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.drawerForm.update(f => ({ ...f, [field]: value }));
    if (field === 'loginId') this.idCheckStatus.set('none');
  }

  selectRole(role: string): void {
    this.drawerForm.update(f => ({ ...f, role }));
    this.roleDropdownOpen.set(false);
  }

  toggleRoleDropdown(): void { this.roleDropdownOpen.update(v => !v); }

  async checkIdDuplicate(): Promise<void> {
    const id = this.drawerForm().loginId.trim();
    if (!id) return;
    try {
      const res = await this.api.users.findAll({ email: id });
      this.idCheckStatus.set(res.length > 0 ? 'duplicate' : 'available');
    } catch {
      this.idCheckStatus.set('available');
    }
  }

  openEditDrawer(row: AdminRow): void {
    this.drawerForm.set({
      role: row.role,
      loginId: row.loginId,
      name: row.name,
      password: '',
      passwordConfirm: '',
    });
    this.drawerMode.set('edit');
    this.editingAdminId.set(row.id);
    this.idCheckStatus.set('none');
    this.roleDropdownOpen.set(false);
    this.drawerOpen.set(true);
  }

  async submitDrawer(): Promise<void> {
    const form = this.drawerForm();
    if (!form.loginId.trim() || !form.name.trim()) {
      this.toast.success('필수 항목을 입력해주세요.');
      return;
    }

    try {
      if (this.drawerMode() === 'edit') {
        const editId = this.editingAdminId()!;
        await this.api.users.update(editId, {
          name: form.name,
          adminRole: form.role === '최고 관리자' ? 'SUPER' : 'NORMAL',
          loginId: form.loginId,
        });
        this.toast.success('관리자 정보가 수정되었습니다.');
      } else {
        if (!form.password.trim()) { this.toast.success('패스워드를 입력해주세요.'); return; }
        if (form.password !== form.passwordConfirm) { this.toast.success('패스워드가 일치하지 않습니다.'); return; }
        this.toast.success('관리자가 등록되었습니다.');
      }
      this.drawerOpen.set(false);
      await this.loadAdmins();
    } catch (e: unknown) {
      this.toast.error(e instanceof Error ? e.message : '처리 중 오류가 발생했습니다.');
    }
  }

  private resetForm(): void {
    this.drawerForm.set({ role: '일반 관리자', loginId: '', name: '', password: '', passwordConfirm: '' });
    this.idCheckStatus.set('none');
    this.roleDropdownOpen.set(false);
  }

  // ===== 삭제 모달 =====
  async confirmDelete(): Promise<void> {
    const target = this.deleteTarget();
    if (target) {
      try {
        await this.api.users.delete(target.id);
        this.toast.success('삭제 완료 되었습니다.');
        await this.loadAdmins();
      } catch (e: unknown) { this.toast.error(e instanceof Error ? e.message : '삭제 실패'); }
    }
    this.deleteModalOpen.set(false);
    this.deleteTarget.set(null);
  }

  cancelDelete(): void { this.deleteModalOpen.set(false); this.deleteTarget.set(null); }

  // ===== 차단 모달 =====
  async confirmBlock(): Promise<void> {
    const target = this.blockTarget();
    if (target) {
      const isBlocking = target.status === '정상';
      try {
        await this.api.users.block(target.id, isBlocking ? 'BLOCKED' : 'ACTIVE');
        this.toast.success(isBlocking ? '차단 처리 되었습니다.' : '차단 해제 되었습니다.');
        await this.loadAdmins();
      } catch (e: unknown) { this.toast.error(e instanceof Error ? e.message : '처리 실패'); }
    }
    this.blockModalOpen.set(false);
    this.blockTarget.set(null);
  }

  cancelBlock(): void { this.blockModalOpen.set(false); this.blockTarget.set(null); }
}
