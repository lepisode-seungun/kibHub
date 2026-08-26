import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DataGridComponent, GridColumn } from '../../components/data-grid/data-grid.component';
import { MEMBER_STATUS_BADGES, ROLE_BADGES } from '../../shared/badge-styles';

@Component({
  selector: 'adm-members',
  standalone: true,
  imports: [CommonModule, DataGridComponent],
  templateUrl: './members.page.html',
  styleUrl: './members.page.css',
})
export class MembersPage {
  private router = inject(Router);

  columns: GridColumn[] = [
    { key: 'id', label: '순번', width: '80px' },
    {
      key: 'status', label: '상태', width: '72px',
      badge: 'status',
      badgeStyles: MEMBER_STATUS_BADGES,
    },
    {
      key: 'role', label: '권한', width: '72px',
      badge: 'role',
      badgeStyles: ROLE_BADGES,
    },
    { key: 'email', label: '이메일' },
    { key: 'name', label: '이름' },
    { key: 'countryCode', label: '국가번호' },
    { key: 'phone', label: '연락처' },
    { key: 'createdAt', label: '가입일시', width: '150px', headerColor: 'text-gray-600' },
  ];

  members = [
    { id: 1, status: '정상', role: '일반', email: 'yelim@lepisode.team', name: '고식혜', countryCode: '82', phone: '010-1234-5678', createdAt: '2023-01-01 16:10' },
    { id: 2, status: '정상', role: '일반', email: 'hong@gmail.com', name: '홍길동', countryCode: '82', phone: '010-9876-5432', createdAt: '2023-02-15 09:30' },
    { id: 3, status: '정상', role: '강사', email: 'kim@naver.com', name: '김영희', countryCode: '82', phone: '010-5555-1234', createdAt: '2023-03-20 14:22' },
  ];

  onRowClick(row: any): void {
    this.router.navigate(['/members', row.id]);
  }
}
