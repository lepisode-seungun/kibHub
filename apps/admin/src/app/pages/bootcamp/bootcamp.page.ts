import { formatDate } from '../../shared/format-date';
import { Component, inject, signal, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DataGridComponent, GridColumn } from '../../components/data-grid/data-grid.component';
import { ImageUploadComponent, ImageUploadData } from '../../components/image-upload/image-upload.component';
import { BOOTCAMP_STATUS_BADGES } from '../../shared/badge-styles';
import { ToastService } from '../../shared/toast/toast.service';
import { ApiService } from '../../services/api.service';
import { BootcampContextService } from '../../services/bootcamp-context.service';
import { Bootcamp, BootcampRow } from '../../shared/types';

const STATUS_MAP: Record<string, string> = {
  RECRUITING: '모집', OPERATING: '운영', ENDED: '종료',
  PREPARING: '준비', CLOSED: '마감',
};

function toBootcampRow(b: Bootcamp): BootcampRow {
  return {
    id: b.id,
    status: STATUS_MAP[b.status] || b.status,
    bootcampName: b.name,
    createdAt: formatDate(b.createdAt),
  };
}

@Component({
  selector: 'adm-bootcamp',
  standalone: true,
  imports: [CommonModule, DataGridComponent, ImageUploadComponent],
  templateUrl: './bootcamp.page.html',
  styleUrl: './bootcamp.page.css',
})
export class BootcampPage implements OnInit {
  private toast = inject(ToastService);
  private api = inject(ApiService);
  private router = inject(Router);
  private bootcampCtx = inject(BootcampContextService);

  contextMenuItems = ['수정', '삭제'];

  gridColumns: GridColumn[] = [
    { key: 'id', label: '순번', width: '80px' },
    { key: 'status', label: '상태', width: '100px', badge: 'status', badgeStyles: BOOTCAMP_STATUS_BADGES },
    { key: 'bootcampName', label: '부트캠프명' },
    { key: 'createdAt', label: '등록일시', width: '160px' },
  ];

  bootcampData = signal<BootcampRow[]>([]);

  ngOnInit(): void {
    this.loadBootcamps();
  }

  async loadBootcamps(): Promise<void> {
    try {
      const data = await this.api.bootcamps.findAll();
      this.bootcampData.set(data.map(toBootcampRow));
    } catch (e) {
      console.error('부트캠프 목록 로드 실패:', e);
    }
  }

  /** 부트캠프명 클릭 → 홈 관리 진입 */
  onBootcampRowClick(row: BootcampRow): void {
    this.bootcampCtx.setBootcamp(row.id, row.bootcampName);
    this.router.navigate(['/bootcamp/home/dashboard']);
  }

  // ===== 삭제 다이얼로그 =====
  showDeleteDialog = signal(false);
  deleteTargetRow = signal<BootcampRow | null>(null);
  deleteChildCounts = signal<{ courses: number; lectures: number; assignments: number; applicants: number; notices: number } | null>(null);

  async onContextMenuAction(event: { action: string; row: BootcampRow }): Promise<void> {
    if (event.action === '수정') {
      await this.openEditDrawer(event.row.id);
    } else if (event.action === '삭제') {
      this.deleteTargetRow.set(event.row);
      this.deleteChildCounts.set(null);
      this.showDeleteDialog.set(true);
      // 하위 데이터 건수 비동기 로드
      try {
        const counts = await this.api.bootcamps.getChildCounts(event.row.id);
        this.deleteChildCounts.set(counts);
      } catch (e) { console.error('하위 데이터 카운트 실패:', e); }
    }
  }

  closeDeleteDialog(): void {
    this.showDeleteDialog.set(false);
    this.deleteTargetRow.set(null);
    this.deleteChildCounts.set(null);
  }

  async confirmDelete(): Promise<void> {
    const row = this.deleteTargetRow();
    if (!row) return;
    try {
      await this.api.bootcamps.delete(row.id);
      this.toast.success('삭제가 완료 되었습니다.');
      this.showDeleteDialog.set(false);
      this.deleteTargetRow.set(null);
      await this.loadBootcamps();
    } catch (e: unknown) {
      this.toast.error(e instanceof Error ? e.message : '삭제 실패');
    }
  }

  // ===== 부트캠프 등록/수정 드로어 =====
  drawerOpen = signal(false);
  drawerMode = signal<'add' | 'edit'>('add');
  private editingBootcampId: number | null = null;

  drawerForm = signal({
    name: '',
    bootcampName: '',
    workIntro: '',
    startDate: '',
    endDate: '',
  });

  @ViewChild('thumbnailUpload') thumbnailUploadRef!: ImageUploadComponent;
  thumbnailData = signal<ImageUploadData | null>(null);
  existingThumbnail = signal<string | null>(null);

  openDrawer(): void {
    this.drawerMode.set('add');
    this.editingBootcampId = null;
    this.drawerForm.set({ name: '', bootcampName: '', workIntro: '', startDate: '', endDate: '' });
    this.thumbnailData.set(null);
    this.existingThumbnail.set(null);
    this.thumbnailUploadRef?.reset();
    this.drawerOpen.set(true);
  }

  async openEditDrawer(id: number): Promise<void> {
    try {
      const bc = await this.api.bootcamps.findOne(id);
      this.drawerMode.set('edit');
      this.editingBootcampId = bc.id;
      this.drawerForm.set({
        name: bc.instructorName || '',
        bootcampName: bc.name || '',
        workIntro: bc.description || '',
        startDate: bc.startDate ? bc.startDate.substring(0, 10) : '',
        endDate: bc.endDate ? bc.endDate.substring(0, 10) : '',
      });
      this.thumbnailData.set(null);
      this.existingThumbnail.set(bc.thumbnail || null);
      this.thumbnailUploadRef?.reset();
      this.drawerOpen.set(true);
    } catch (e) {
      this.toast.error('부트캠프 데이터 로드에 실패했습니다.');
    }
  }

  closeDrawer(): void { this.drawerOpen.set(false); }

  updateDrawerField(field: string, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.drawerForm.update(f => ({ ...f, [field]: value }));
  }

  onThumbnailChange(data: ImageUploadData | null): void {
    this.thumbnailData.set(data);
  }

  async submitDrawer(): Promise<void> {
    const form = this.drawerForm();
    try {
      // 썸네일 업로드
      let thumbnailUrl: string | undefined;
      const thumb = this.thumbnailData();
      if (thumb) {
        const result = await this.api.upload.single(thumb.file, 'bootcamps');
        thumbnailUrl = result.url;
      }

      const payload: any = {
        name: form.bootcampName,
        instructorName: form.name,
        description: form.workIntro,
        startDate: form.startDate ? new Date(form.startDate) : undefined,
        endDate: form.endDate ? new Date(form.endDate) : undefined,
      };
      if (thumbnailUrl) payload.thumbnail = thumbnailUrl;

      if (this.drawerMode() === 'edit' && this.editingBootcampId) {
        await this.api.bootcamps.update(this.editingBootcampId, payload);
        this.toast.success('수정이 완료 되었습니다.');
      } else {
        payload.thumbnail = thumbnailUrl;
        await this.api.bootcamps.create(payload);
        this.toast.success('등록 완료 되었습니다.');
      }

      this.drawerOpen.set(false);
      this.drawerForm.set({ name: '', bootcampName: '', workIntro: '', startDate: '', endDate: '' });
      this.thumbnailData.set(null);
      this.existingThumbnail.set(null);
      this.thumbnailUploadRef?.reset();
      await this.loadBootcamps();
    } catch (e: unknown) {
      this.toast.error(e instanceof Error ? e.message : '저장 실패');
    }
  }
}
