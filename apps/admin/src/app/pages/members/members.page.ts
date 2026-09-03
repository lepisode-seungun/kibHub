import { formatDate } from '../../shared/format-date';
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DataGridComponent, GridColumn } from '../../components/data-grid/data-grid.component';
import { MEMBER_STATUS_BADGES, ROLE_BADGES } from '../../shared/badge-styles';
import { ApiService } from '../../services/api.service';
import { User, MemberRow } from '../../shared/types';

const STATUS_DISPLAY: Record<string, string> = {
  ACTIVE: '정상', BLOCKED: '차단', WITHDRAWN: '탈퇴',
};
const ROLE_DISPLAY: Record<string, string> = {
  ADMIN: '관리자', INSTRUCTOR: '강사', STUDENT: '일반',
};

function toMemberRow(u: User): MemberRow {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    nickname: u.nickname,
    phone: u.phone,
    countryCode: u.countryCode,
    status: STATUS_DISPLAY[u.status] || u.status,
    role: ROLE_DISPLAY[u.role] || u.role,
    createdAt: formatDate(u.createdAt),
  };
}

@Component({
  selector: 'adm-members',
  standalone: true,
  imports: [CommonModule, DataGridComponent],
  templateUrl: './members.page.html',
  styleUrl: './members.page.css',
})
export class MembersPage implements OnInit {
  private router = inject(Router);
  private api = inject(ApiService);

  columns: GridColumn[] = [
    { key: 'id', label: '순번', width: '80px' },
    { key: 'status', label: '상태', width: '72px', badge: 'status', badgeStyles: MEMBER_STATUS_BADGES },
    { key: 'role', label: '권한', width: '72px', badge: 'role', badgeStyles: ROLE_BADGES },
    { key: 'email', label: '이메일' },
    { key: 'name', label: '이름' },
    { key: 'countryCode', label: '국가번호' },
    { key: 'phone', label: '연락처' },
    { key: 'createdAt', label: '가입일시', width: '150px', headerColor: 'text-gray-600' },
  ];

  members = signal<MemberRow[]>([]);

  ngOnInit(): void {
    this.loadMembers();
  }

  async loadMembers(): Promise<void> {
    try {
      const data = await this.api.users.findAll();
      this.members.set(data.map(toMemberRow));
    } catch (e) {
      console.error('회원 목록 로드 실패:', e);
    }
  }

  onRowClick(row: MemberRow): void {
    this.router.navigate(['/members', row.id]);
  }
}
