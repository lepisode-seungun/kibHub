import { formatDate } from '../../shared/format-date';
import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { DataGridComponent, GridColumn, GridRow } from '../../components/data-grid/data-grid.component';
import { ToastService } from '../../shared/toast/toast.service';
import { ApiService } from '../../services/api.service';
import { BootcampContextService } from '../../services/bootcamp-context.service';
import { Course } from '../../shared/types';

interface CourseRow {
  [key: string]: unknown;
  id: number;
  status: string;
  name: string;
  lecture: number;
  assignment: number;
  createdAt: string;
}

const COURSE_STATUS_MAP: Record<string, string> = {
  VISIBLE: '노출', HIDDEN: '숨김',
  PENDING: '노출', IN_PROGRESS: '노출', COMPLETED: '노출',
};

const REVERSE_STATUS_MAP: Record<string, string> = {
  '노출': 'VISIBLE', '숨김': 'HIDDEN',
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
        '노출': 'bg-green-50 text-[#10B981] border-green-200',
        '숨김': 'bg-gray-50 text-[#6B7280] border-gray-200',
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

  contextMenuItemsFn = (gridRow: GridRow) => {
    const row = gridRow as unknown as CourseRow;
    const toggleLabel = row.status === '숨김' ? '노출' : '숨김';
    return [toggleLabel, '수정', '삭제'];
  };

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
      const status = this.courseCategory() || 'VISIBLE';
      await this.api.courses.create(this.bootcampId, { name, status } as Record<string, string>);
      this.toast.success('등록 완료 되었습니다.');
      this.drawerOpen.set(false);
      await this.loadCourses();
    } catch (e: unknown) {
      this.toast.error(e instanceof Error ? e.message : '등록 실패');
    }
  }

  onRowClick(gridRow: GridRow): void {
    const row = gridRow as unknown as CourseRow;
    this.router.navigate(['/bootcamp/home/curriculum', row.id]);
  }

  async onRowReorder(newData: GridRow[]): Promise<void> {
    const rows = newData as unknown as CourseRow[];
    this.data.set(rows);
    const orderedIds = rows.map(r => r.id);
    console.log('[onRowReorder] bootcampId:', this.bootcampId, 'orderedIds:', orderedIds);
    try {
      const result = await this.api.courses.reorder(this.bootcampId, orderedIds);
      console.log('[onRowReorder] result:', result);
    } catch (e) {
      console.error('[onRowReorder] error:', e);
      this.toast.error('순서 저장 실패');
    }
  }

  // ===== 컨텍스트 메뉴 액션 =====
  showDeleteDialog = signal(false);
  deleteTargetRow = signal<CourseRow | null>(null);

  editDrawerOpen = signal(false);
  editCourseName = signal('');
  editCourseStatus = signal('');
  private editingCourseId: number | null = null;

  async onContextMenuAction(event: { action: string; row: GridRow }): Promise<void> {
    const row = event.row as unknown as CourseRow;
    if (event.action === '숨김' || event.action === '노출') {
      const newStatus = event.action === '숨김' ? 'HIDDEN' : 'VISIBLE';
      try {
        await this.api.courses.update(row.id, { status: newStatus } as Record<string, string>);
        this.toast.success(`${event.action} 처리 되었습니다.`);
        await this.loadCourses();
      } catch (e) { this.toast.error(`${event.action} 처리 실패`); }
    } else if (event.action === '수정') {
      this.editingCourseId = row.id;
      this.editCourseName.set(row.name);
      this.editCourseStatus.set(row.status);
      this.editDrawerOpen.set(true);
    } else if (event.action === '삭제') {
      this.deleteTargetRow.set(row);
      this.showDeleteDialog.set(true);
    }
  }

  closeDeleteDialog(): void {
    this.showDeleteDialog.set(false);
    this.deleteTargetRow.set(null);
  }

  async confirmDelete(): Promise<void> {
    const row = this.deleteTargetRow();
    if (!row) return;
    try {
      await this.api.courses.delete(row.id);
      this.toast.success('삭제가 완료 되었습니다.');
      this.closeDeleteDialog();
      await this.loadCourses();
    } catch (e: unknown) {
      this.toast.error(e instanceof Error ? e.message : '삭제 실패');
    }
  }

  closeEditDrawer(): void { this.editDrawerOpen.set(false); }

  async submitEdit(): Promise<void> {
    if (!this.editingCourseId) return;
    const name = this.editCourseName().trim();
    if (!name) { this.toast.error('과정명을 입력해주세요.'); return; }
    try {
      const status = REVERSE_STATUS_MAP[this.editCourseStatus()] || 'VISIBLE';
      await this.api.courses.update(this.editingCourseId, { name, status } as Record<string, string>);
      this.toast.success('수정 완료 되었습니다.');
      this.editDrawerOpen.set(false);
      await this.loadCourses();
    } catch (e: unknown) { this.toast.error('수정에 실패했습니다.'); }
  }
}
