import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DataGridComponent, GridColumn } from '../../components/data-grid/data-grid.component';

@Component({
  selector: 'adm-course',
  standalone: true,
  imports: [CommonModule, DataGridComponent],
  templateUrl: './course.page.html',
  styleUrl: './course.page.css',
})
export class CoursePage {
  columns: GridColumn[] = [
    { key: 'id', label: '순번', width: '60px' },
    {
      key: 'status',
      label: '상태',
      width: '100px',
      badge: 'status',
      badgeStyles: {
        '진행중': 'bg-blue-50 text-[#3C8EEE] border-blue-200',
        '완료': 'bg-green-50 text-[#10B981] border-green-200',
        '대기': 'bg-gray-50 text-[#6B7280] border-gray-200',
      },
    },
    { key: 'name', label: '과정명' },
    { key: 'lecture', label: '강의', width: '80px' },
    { key: 'assignment', label: '과제', width: '80px' },
    { key: 'createdAt', label: '등록일시', width: '160px' },
    { key: 'menu', label: '', width: '50px', type: 'drag' },
  ];

  data = [
    { id: 1, status: '진행중', name: 'BD/만화 스토리텔링 기초', lecture: 12, assignment: 5, createdAt: '2025-08-20 14:30' },
    { id: 2, status: '완료', name: '디지털 일러스트레이션 입문', lecture: 8, assignment: 3, createdAt: '2025-08-18 09:15' },
    { id: 3, status: '대기', name: '웹툰 연출 마스터 클래스', lecture: 15, assignment: 7, createdAt: '2025-08-15 11:00' },
    { id: 4, status: '진행중', name: '캐릭터 디자인 실무', lecture: 10, assignment: 4, createdAt: '2025-08-12 16:45' },
    { id: 5, status: '완료', name: '배경 원화 테크닉', lecture: 6, assignment: 2, createdAt: '2025-08-10 10:30' },
  ];

  contextMenuItems = ['숨김', '수정', '삭제'];

  // ===== 과정 등록 드로어 =====
  drawerOpen = signal(false);
  courseCategory = signal('');
  courseName = signal('');

  openDrawer(): void {
    this.drawerOpen.set(true);
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
  }

  submitCourse(): void {
    this.drawerOpen.set(false);
    // TODO: 등록 처리
  }
  private router = inject(Router);

  onRowClick(row: any): void {
    this.router.navigate(['/bootcamp/home/curriculum', row.id]);
  }
}
