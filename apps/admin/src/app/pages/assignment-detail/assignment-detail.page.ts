import { formatDate } from '../../shared/format-date';
import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../shared/toast/toast.service';
import { DataGridComponent, GridColumn } from '../../components/data-grid/data-grid.component';
import { ROLE_BADGES } from '../../shared/badge-styles';

interface BoardRow {
  id: number;
  type: string;
  title: string;
  comments: number;
  permission: string;
  author: string;
  createdAt: string;
}

interface SubmissionDetail extends BoardRow {
  content: string;
  files: { name: string; size: string }[];
}

@Component({
  selector: 'adm-assignment-detail',
  standalone: true,
  imports: [CommonModule, DataGridComponent],
  templateUrl: './assignment-detail.page.html',
  styleUrl: './assignment-detail.page.css',
})
export class AssignmentDetailPage implements OnInit {
  private location = inject(Location);
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);
  private toast = inject(ToastService);

  // 아코디언 상태
  courseInfoOpen = signal(true);
  assignmentInfoOpen = signal(true);
  assignmentContentOpen = signal(true);
  boardOpen = signal(true);

  toggleCourseInfo(): void { this.courseInfoOpen.update(v => !v); }
  toggleAssignmentInfo(): void { this.assignmentInfoOpen.update(v => !v); }
  toggleAssignmentContent(): void { this.assignmentContentOpen.update(v => !v); }
  toggleBoard(): void { this.boardOpen.update(v => !v); }

  // 과제 기본 정보 드롭다운
  assignmentInfoMenuOpen = signal(false);
  toggleAssignmentInfoMenu(): void { this.assignmentInfoMenuOpen.update(v => !v); }
  onAssignmentInfoMenuAction(action: string): void {
    this.assignmentInfoMenuOpen.set(false);
    if (action === 'edit') {
      this.openEditDrawer();
    } else if (action === 'delete') {
      this.showDeleteModal.set(true);
    }
  }

  // 삭제 확인 모달
  showDeleteModal = signal(false);
  async confirmDelete(): Promise<void> {
    try {
      await this.api.assignments.delete(this.assignmentData().id);
      this.toast.success('삭제 완료 되었습니다.');
    } catch (err) {
      console.error('과제 삭제 실패:', err);
    }
    this.showDeleteModal.set(false);
    this.location.back();
  }
  cancelDelete(): void {
    this.showDeleteModal.set(false);
  }

  courseData = signal<any>({});
  assignmentData = signal<any>({});

  ngOnInit(): void {
    const assignmentId = this.route.snapshot.paramMap.get('assignmentId')
      || this.route.snapshot.paramMap.get('id') || '';
    if (assignmentId) {
      this.loadAssignment(Number(assignmentId));
      this.loadBoardData(Number(assignmentId));
    }
  }

  private async loadAssignment(id: number): Promise<void> {
    try {
      const assignment: any = await this.api.assignments.findOne(id);
      this.assignmentData.set({
        id: assignment.id,
        name: assignment.title || '',
        category: assignment.category || '',
        createdAt: formatDate(assignment.createdAt),
        deadlineStart: assignment.dueDate ? formatDate(assignment.dueDate) : '',
        deadlineEnd: assignment.dueDateEnd ? formatDate(assignment.dueDateEnd) : '',
        deadlineStartRaw: assignment.dueDate || '',
        deadlineEndRaw: assignment.dueDateEnd || '',
        content: assignment.content || assignment.body || '',
        videoUrl: assignment.videoUrl || '',
        materials: assignment.files || [],
      });
      if (assignment.course) {
        const SM: Record<string, string> = { VISIBLE: '노출', HIDDEN: '숨김', PENDING: '노출', IN_PROGRESS: '노출', COMPLETED: '노출' };
        this.courseData.set({
          id: assignment.course.id,
          name: assignment.course.name || assignment.course.title || '',
          status: SM[assignment.course.status] || assignment.course.status || '',
          createdAt: assignment.course.createdAt ? formatDate(assignment.course.createdAt) : '',
        });
      }
    } catch (err) {
      console.error('과제 로드 실패:', err);
    }
  }

  // 게시판 그리드
  boardColumns: GridColumn[] = [
    { key: 'id', label: '순번', width: '60px' },
    { key: 'type', label: '유형', width: '80px' },
    { key: 'title', label: '제목' },
    { key: 'comments', label: '댓글', width: '80px' },
    { key: 'permission', label: '권한', width: '100px', badge: 'permission', badgeStyles: ROLE_BADGES },
    { key: 'author', label: '작성자', width: '120px' },
    { key: 'createdAt', label: '등록일시', width: '160px' },
  ];

  boardData: BoardRow[] = [];

  private async loadBoardData(assignmentId: number): Promise<void> {
    try {
      const list: any[] = await this.api.submissions.findByAssignment(assignmentId);
      this.boardData = list.map((s: any) => {
        const roleMap: Record<string, string> = { ADMIN: '관리자', INSTRUCTOR: '강사', STUDENT: '일반' };
        return {
          id: s.id,
          type: s.type === 'FEEDBACK' ? '피드백' : '제출',
          title: s.title,
          comments: s._count?.comments || 0,
          permission: roleMap[s.author?.role] || '일반',
          author: s.author?.name || s.author?.nickname || '',
          createdAt: formatDate(s.createdAt),
        };
      });
    } catch (err) {
      console.error('제출 목록 로드 실패:', err);
    }
  }

  // 제출 과제 삭제 다이얼로그
  showBoardDeleteModal = signal(false);
  boardDeleteRow = signal<BoardRow | null>(null);

  onBoardContextMenu(event: { action: string; row: BoardRow }): void {
    if (event.action === '삭제') {
      this.boardDeleteRow.set(event.row);
      this.showBoardDeleteModal.set(true);
    }
  }

  async confirmBoardDelete(): Promise<void> {
    const row = this.boardDeleteRow();
    if (row) {
      try {
        await this.api.submissions.delete(row.id);
        this.boardData = this.boardData.filter(r => r.id !== row.id);
        this.toast.success('삭제 완료 되었습니다.');
      } catch (err) {
        console.error('제출 과제 삭제 실패:', err);
      }
    }
    this.showBoardDeleteModal.set(false);
    this.boardDeleteRow.set(null);
  }

  cancelBoardDelete(): void {
    this.showBoardDeleteModal.set(false);
    this.boardDeleteRow.set(null);
  }

  // 제출 과제 상세 사이드 드로어
  submissionDrawerOpen = signal(false);
  selectedSubmission = signal<SubmissionDetail | null>(null);

  async openSubmissionDrawer(row: BoardRow): Promise<void> {
    try {
      const detail: any = await this.api.submissions.findOne(row.id);
      const roleMap: Record<string, string> = { ADMIN: '관리자', INSTRUCTOR: '강사', STUDENT: '일반' };
      this.selectedSubmission.set({
        ...row,
        content: detail.content || '',
        files: (detail.files || []).map((f: any) => ({
          name: f.name,
          size: f.size ? `${(f.size / 1024).toFixed(1)}KB` : '',
        })),
      });
      this.submissionDrawerOpen.set(true);
    } catch (err) {
      console.error('제출 상세 로드 실패:', err);
      this.selectedSubmission.set({ ...row, content: '', files: [] });
      this.submissionDrawerOpen.set(true);
    }
  }

  closeSubmissionDrawer(): void {
    this.submissionDrawerOpen.set(false);
  }

  // ===== 수정 드로어 =====
  editDrawerOpen = signal(false);
  editTitle = signal('');
  editContent = signal('');
  editCategory = signal('');
  editDueDate = signal('');
  editDueDateEnd = signal('');

  openEditDrawer(): void {
    const d = this.assignmentData();
    this.editTitle.set(d.name || '');
    this.editCategory.set(d.category || '');
    this.editContent.set(d.content || '');
    // Raw 날짜를 date input용 YYYY-MM-DD 포맷으로 변환
    this.editDueDate.set(d.deadlineStartRaw ? new Date(d.deadlineStartRaw).toISOString().substring(0, 10) : '');
    this.editDueDateEnd.set(d.deadlineEndRaw ? new Date(d.deadlineEndRaw).toISOString().substring(0, 10) : '');
    this.editDrawerOpen.set(true);
  }

  closeEditDrawer(): void {
    this.editDrawerOpen.set(false);
  }

  async submitEdit(): Promise<void> {
    const title = this.editTitle().trim();
    if (!title) { this.toast.error('과제명을 입력해주세요.'); return; }
    try {
      const assignmentId = this.assignmentData().id;
      const payload: any = { title, category: this.editCategory(), content: this.editContent() };
      if (this.editDueDate()) payload.dueDate = this.editDueDate();
      if (this.editDueDateEnd()) payload.dueDateEnd = this.editDueDateEnd();
      await this.api.assignments.update(assignmentId, payload);
      this.toast.success('수정 완료 되었습니다.');
      this.editDrawerOpen.set(false);
      await this.loadAssignment(assignmentId);
    } catch (e) {
      this.toast.error('수정에 실패했습니다.');
    }
  }

  // ===== 상세 내용 인라인 편집 =====
  contentEditMode = signal(false);
  editContentValue = signal('');
  contentEditVideoUrl = signal('');

  startContentEdit(): void {
    const d = this.assignmentData();
    this.editContentValue.set(d.content || '');
    this.contentEditVideoUrl.set(d.videoUrl || '');
    this.contentEditMode.set(true);
  }

  cancelContentEdit(): void {
    this.contentEditMode.set(false);
  }

  getYoutubeThumbnail(url: string): string {
    if (!url) return '';
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
    return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : '';
  }

  async saveContentEdit(): Promise<void> {
    try {
      const id = this.assignmentData().id;
      await this.api.assignments.update(id, {
        content: this.editContentValue(),
        videoUrl: this.contentEditVideoUrl(),
      } as any);
      this.toast.success('수정 완료 되었습니다.');
      this.contentEditMode.set(false);
      await this.loadAssignment(id);
    } catch (e) {
      this.toast.error('수정에 실패했습니다.');
    }
  }

  // ===== 학습자료 파일 업로드/삭제 =====
  isUploading = signal(false);

  async onMaterialFileSelect(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    this.isUploading.set(true);
    try {
      const files = Array.from(input.files);
      for (const file of files) {
        const uploaded = await this.api.uploadFile(file, 'assignments');
        await this.api.assignmentFiles.add(this.assignmentData().id, {
          name: file.name,
          url: uploaded.url,
          size: file.size,
          mimeType: file.type,
        });
      }
      this.toast.success(`${files.length}개 파일 업로드 완료`);
      await this.loadAssignment(this.assignmentData().id);
    } catch (e) {
      this.toast.error('파일 업로드에 실패했습니다.');
    } finally {
      this.isUploading.set(false);
      input.value = '';
    }
  }

  async removeMaterial(fileId: number): Promise<void> {
    try {
      await this.api.assignmentFiles.delete(fileId);
      this.toast.success('파일이 삭제되었습니다.');
      await this.loadAssignment(this.assignmentData().id);
    } catch (e) {
      this.toast.error('파일 삭제에 실패했습니다.');
    }
  }

  goBack(): void { this.location.back(); }
}
