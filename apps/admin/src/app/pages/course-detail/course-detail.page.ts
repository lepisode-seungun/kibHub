import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { DataGridComponent, GridColumn } from '../../components/data-grid/data-grid.component';

@Component({
  selector: 'adm-course-detail',
  standalone: true,
  imports: [CommonModule, DataGridComponent],
  templateUrl: './course-detail.page.html',
  styleUrl: './course-detail.page.css',
})
export class CourseDetailPage {
  // 아코디언 상태
  basicInfoOpen = signal(true);

  toggleBasicInfo(): void {
    this.basicInfoOpen.update(v => !v);
  }

  // 더보기 드롭다운
  moreMenuOpen = signal(false);

  toggleMoreMenu(): void {
    this.moreMenuOpen.update(v => !v);
  }

  closeMoreMenu(): void {
    this.moreMenuOpen.set(false);
  }

  onMoreMenuAction(action: string): void {
    this.moreMenuOpen.set(false);
    // TODO: 숨김/수정/삭제 처리
  }

  // 기본 정보 데이터
  courseData = {
    id: 1,
    status: '노출',
    name: '웹툰의 기초',
    createdAt: '2025-01-20 13:11',
  };

  // ===== 강의/과제 아코디언 =====
  lectureOpen = signal(true);

  toggleLecture(): void {
    this.lectureOpen.update(v => !v);
  }

  lectureMenuOpen = signal(false);

  toggleLectureMenu(): void {
    this.lectureMenuOpen.update(v => !v);
  }

  private router = inject(Router);
  private route = inject(ActivatedRoute);

  onLectureMenuAction(action: string): void {
    this.lectureMenuOpen.set(false);
    if (action === 'addLecture') {
      this.router.navigate(['lecture', 'new'], { relativeTo: this.route });
    } else if (action === 'addAssignment') {
      this.router.navigate(['assignment', 'new'], { relativeTo: this.route });
    }
  }

  lectureColumns: GridColumn[] = [
    { key: 'id', label: '순번', width: '60px' },
    { key: 'type', label: '유형', width: '100px' },
    { key: 'thumbnail', label: '썸네일', width: '120px', type: 'image' },
    { key: 'name', label: '강의/과제명' },
    { key: 'createdAt', label: '등록일시', width: '160px' },
    { key: 'menu', label: '', width: '50px', type: 'drag' },
  ];

  lectureData = [
    { id: 1, type: '강의', thumbnail: '', name: '웹툰 스토리 구성 기초', createdAt: '2025-08-20 14:30' },
    { id: 2, type: '과제', thumbnail: '', name: '캐릭터 스케치 실습', createdAt: '2025-08-18 09:15' },
    { id: 3, type: '강의', thumbnail: '', name: '디지털 채색 테크닉', createdAt: '2025-08-15 11:00' },
    { id: 4, type: '과제', thumbnail: '', name: '4컷 만화 제출', createdAt: '2025-08-12 16:45' },
    { id: 5, type: '강의', thumbnail: '', name: '배경 원근법 이론', createdAt: '2025-08-10 10:30' },
  ];

  onLectureRowClick(row: any): void {
    if (row.type === '강의') {
      this.router.navigate(['lecture', row.id], { relativeTo: this.route });
    } else if (row.type === '과제') {
      this.router.navigate(['assignment', row.id], { relativeTo: this.route });
    }
  }
}

