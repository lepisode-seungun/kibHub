import { formatDate } from '../../shared/format-date';
import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
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

const STATUS_MAP: Record<string, string> = { VISIBLE: '노출', HIDDEN: '숨김', PENDING: '노출', IN_PROGRESS: '노출', COMPLETED: '노출' };
const STATUS_REVERSE: Record<string, string> = { '노출': 'VISIBLE', '숨김': 'HIDDEN' };

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
  private location = inject(Location);
  private toast = inject(ToastService);
  private api = inject(ApiService);

  courseId = 0;

  // 아코디언 상태
  basicInfoOpen = signal(true);
  toggleBasicInfo(): void { this.basicInfoOpen.update(v => !v); }

  // 더보기 드롭다운
  moreMenuOpen = signal(false);
  toggleMoreMenu(): void { this.moreMenuOpen.update(v => !v); }
  closeMoreMenu(): void { this.moreMenuOpen.set(false); }

  async onMoreMenuAction(action: string): Promise<void> {
    this.moreMenuOpen.set(false);
    if (action === 'hide') {
      const current = this.courseData().status;
      const newStatus = current === '숨김' ? 'VISIBLE' : 'HIDDEN';
      try {
        await this.api.courses.update(this.courseId, { status: newStatus } as any);
        this.toast.success(current === '숨김' ? '노출 처리 되었습니다.' : '숨김 처리 되었습니다.');
        await this.loadCourse(this.courseId);
      } catch (e) { this.toast.error('상태 변경 실패'); }
    } else if (action === 'edit') {
      this.openEditDrawer();
    } else if (action === 'delete') {
      this.showDeleteModal.set(true);
    }
  }

  // 기본 정보 데이터
  courseData = signal({ id: 0, status: '', name: '', createdAt: '' });

  ngOnInit(): void {
    this.courseId = Number(this.route.snapshot.paramMap.get('courseId') || this.route.snapshot.paramMap.get('id') || 0);
    if (this.courseId) this.loadCourse(this.courseId);
  }

  async loadCourse(id: number): Promise<void> {
    try {
      const c = await this.api.courses.findOne(id);
      this.courseData.set({
        id: c.id,
        status: STATUS_MAP[c.status] || c.status,
        name: c.name,
        createdAt: formatDate(c.createdAt),
      });

      // 강의 + 과제 합산 목록
      const rows: LectureAssignmentRow[] = [];
      if (c.lectures) {
        c.lectures.forEach((l: any) => {
          rows.push({ id: l.id, type: '강의', thumbnail: this.getYoutubeThumbnail(l.videoUrl || ''), name: l.title, createdAt: formatDate(l.createdAt) });
        });
      }
      if (c.assignments) {
        c.assignments.forEach((a: Assignment) => {
          rows.push({ id: a.id, type: '과제', thumbnail: '', name: a.title, createdAt: formatDate(a.createdAt) });
        });
      }
      this.lectureData.set(rows);
    } catch (e) {
      console.error('과정 상세 로드 실패:', e);
    }
  }

  // ===== 수정 드로어 =====
  editDrawerOpen = signal(false);
  editStatus = signal('');
  editName = signal('');

  openEditDrawer(): void {
    const d = this.courseData();
    this.editStatus.set(d.status);
    this.editName.set(d.name);
    this.editDrawerOpen.set(true);
  }

  closeEditDrawer(): void {
    this.editDrawerOpen.set(false);
  }

  async submitEdit(): Promise<void> {
    const name = this.editName().trim();
    if (!name) { this.toast.error('과정명을 입력해주세요.'); return; }
    try {
      const status = STATUS_REVERSE[this.editStatus()] || 'VISIBLE';
      await this.api.courses.update(this.courseId, { name, status } as any);
      this.toast.success('수정 완료 되었습니다.');
      this.editDrawerOpen.set(false);
      await this.loadCourse(this.courseId);
    } catch (e) {
      this.toast.error('수정에 실패했습니다.');
    }
  }

  // ===== 삭제 다이얼로그 =====
  showDeleteModal = signal(false);

  async confirmDelete(): Promise<void> {
    try {
      await this.api.courses.delete(this.courseId);
      this.toast.success('삭제 완료 되었습니다.');
      this.showDeleteModal.set(false);
      this.location.back();
    } catch (e) {
      this.toast.error('삭제에 실패했습니다.');
    }
  }

  cancelDelete(): void {
    this.showDeleteModal.set(false);
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

  lectureData = signal<LectureAssignmentRow[]>([]);

  onLectureRowClick(row: LectureAssignmentRow): void {
    if (row.type === '강의') {
      this.router.navigate(['lecture', row.id], { relativeTo: this.route });
    } else if (row.type === '과제') {
      this.router.navigate(['assignment', row.id], { relativeTo: this.route });
    }
  }

  private getYoutubeThumbnail(url: string): string {
    if (!url) return '';
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
    return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : '';
  }
}
