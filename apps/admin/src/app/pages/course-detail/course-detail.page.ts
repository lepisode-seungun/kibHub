import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { DataGridComponent, GridColumn } from '../../components/data-grid/data-grid.component';
import { ToastService } from '../../shared/toast/toast.service';
import { ApiService } from '../../services/api.service';
import { Course, Lecture, Assignment } from '../../shared/types';

interface LectureAssignmentRow {
  id: number;
  type: string;
  thumbnail: string;
  name: string;
  createdAt: string;
}

@Component({
  selector: 'adm-course-detail',
  standalone: true,
  imports: [CommonModule, DataGridComponent],
  templateUrl: './course-detail.page.html',
  styleUrl: './course-detail.page.css',
})
export class CourseDetailPage implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);
  private api = inject(ApiService);

  // 아코디언 상태
  basicInfoOpen = signal(true);
  toggleBasicInfo(): void { this.basicInfoOpen.update(v => !v); }

  // 더보기 드롭다운
  moreMenuOpen = signal(false);
  toggleMoreMenu(): void { this.moreMenuOpen.update(v => !v); }
  closeMoreMenu(): void { this.moreMenuOpen.set(false); }

  onMoreMenuAction(_action: string): void {
    this.moreMenuOpen.set(false);
  }

  // 기본 정보 데이터
  courseData = { id: 0, status: '', name: '', createdAt: '' };

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('courseId') || this.route.snapshot.paramMap.get('id') || 0);
    if (id) this.loadCourse(id);
  }

  async loadCourse(id: number): Promise<void> {
    try {
      const c = await this.api.courses.findOne(id);
      const STATUS_MAP: Record<string, string> = { PENDING: '대기', IN_PROGRESS: '진행중', COMPLETED: '완료' };
      this.courseData = {
        id: c.id,
        status: STATUS_MAP[c.status] || c.status,
        name: c.name,
        createdAt: new Date(c.createdAt).toLocaleString('ko-KR'),
      };

      // 강의 + 과제 합산 목록
      const rows: LectureAssignmentRow[] = [];
      if (c.lectures) {
        c.lectures.forEach((l: Lecture) => {
          rows.push({ id: l.id, type: '강의', thumbnail: '', name: l.title, createdAt: new Date(l.createdAt).toLocaleString('ko-KR') });
        });
      }
      if (c.assignments) {
        c.assignments.forEach((a: Assignment) => {
          rows.push({ id: a.id, type: '과제', thumbnail: '', name: a.title, createdAt: new Date(a.createdAt).toLocaleString('ko-KR') });
        });
      }
      this.lectureData = rows;
    } catch (e) {
      console.error('과정 상세 로드 실패:', e);
    }
  }

  // ===== 강의/과제 아코디언 =====
  lectureOpen = signal(true);
  toggleLecture(): void { this.lectureOpen.update(v => !v); }

  lectureMenuOpen = signal(false);
  toggleLectureMenu(): void { this.lectureMenuOpen.update(v => !v); }

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

  lectureData: LectureAssignmentRow[] = [];

  onLectureRowClick(row: LectureAssignmentRow): void {
    if (row.type === '강의') {
      this.router.navigate(['lecture', row.id], { relativeTo: this.route });
    } else if (row.type === '과제') {
      this.router.navigate(['assignment', row.id], { relativeTo: this.route });
    }
  }
}
