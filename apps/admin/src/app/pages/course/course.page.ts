import { formatDate } from '../../shared/format-date';
import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { DataGridComponent, GridColumn } from '../../components/data-grid/data-grid.component';
import { ToastService } from '../../shared/toast/toast.service';
import { ApiService } from '../../services/api.service';
import { BootcampContextService } from '../../services/bootcamp-context.service';
import { Course } from '../../shared/types';

interface CourseRow {
  id: number;
  status: string;
  name: string;
  lecture: number;
  assignment: number;
  createdAt: string;
}

const COURSE_STATUS_MAP: Record<string, string> = {
  PENDING: '대기', IN_PROGRESS: '진행중', COMPLETED: '완료',
};

function toCourseRow(c: Course): CourseRow {
  return {
    id: c.id,
    status: COURSE_STATUS_MAP[c.status] || c.status,
    name: c.name,
    lecture: c.lectures?.length || 0,
    assignment: c.assignments?.length || 0,
    createdAt: formatDate(c.createdAt),
  };
}

@Component({
  selector: 'adm-course',
  standalone: true,
  imports: [CommonModule, DataGridComponent],
  templateUrl: './course.page.html',
  styleUrl: './course.page.css',
})
export class CoursePage implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);
  private api = inject(ApiService);
  private bootcampCtx = inject(BootcampContextService);

  columns: GridColumn[] = [
    { key: 'id', label: '순번', width: '60px' },
    {
      key: 'status', label: '상태', width: '100px',
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

  data = signal<CourseRow[]>([]);
  bootcampId = 0;

  contextMenuItems = ['숨김', '수정', '삭제'];

  ngOnInit(): void {
    this.bootcampId = Number(this.route.snapshot.paramMap.get('id') || this.route.parent?.snapshot.paramMap.get('id') || this.bootcampCtx.currentBootcampId() || 0);
    this.loadCourses();
  }

  async loadCourses(): Promise<void> {
    try {
      const courses = await this.api.courses.findByBootcamp(this.bootcampId);
      this.data.set(courses.map(toCourseRow));
    } catch (e) {
      console.error('과정 로드 실패:', e);
    }
  }

  // ===== 과정 등록 드로어 =====
  drawerOpen = signal(false);
  courseCategory = signal('');
  courseName = signal('');

  openDrawer(): void { this.drawerOpen.set(true); }
  closeDrawer(): void { this.drawerOpen.set(false); }

  async submitCourse(): Promise<void> {
    const name = this.courseName().trim();
    if (!name) { this.toast.error('과정명을 입력해주세요.'); return; }
    try {
      await this.api.courses.create(this.bootcampId, { name } as Partial<Course>);
      this.toast.success('등록 완료 되었습니다.');
      this.drawerOpen.set(false);
      await this.loadCourses();
    } catch (e: unknown) {
      this.toast.error(e instanceof Error ? e.message : '등록 실패');
    }
  }

  onRowClick(row: CourseRow): void {
    this.router.navigate(['/bootcamp/home/curriculum', row.id]);
  }
}
