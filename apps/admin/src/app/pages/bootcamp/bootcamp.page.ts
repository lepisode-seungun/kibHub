import { Component, inject, signal, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataGridComponent, GridColumn } from '../../components/data-grid/data-grid.component';
import { ImageUploadComponent, ImageUploadData } from '../../components/image-upload/image-upload.component';
import { BOOTCAMP_STATUS_BADGES } from '../../shared/badge-styles';
import { ToastService } from '../../shared/toast/toast.service';
import { ApiService } from '../../services/api.service';
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
    createdAt: new Date(b.createdAt).toLocaleString('ko-KR'),
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

  async onContextMenuAction(event: { action: string; row: BootcampRow }): Promise<void> {
    if (event.action === '수정') {
      this.toast.success('수정 페이지로 이동합니다.');
    } else if (event.action === '삭제') {
      try {
        await this.api.bootcamps.delete(event.row.id);
        this.toast.success('삭제가 완료 되었습니다.');
        await this.loadBootcamps();
      } catch (e: unknown) {
        this.toast.error(e instanceof Error ? e.message : '삭제 실패');
      }
    }
  }

  // ===== 부트캠프 등록 드로어 =====
  drawerOpen = signal(false);
  drawerForm = signal({
    name: '',
    bootcampName: '',
    workIntro: '',
    startDate: '',
    endDate: '',
  });

  @ViewChild('thumbnailUpload') thumbnailUploadRef!: ImageUploadComponent;
  thumbnailData = signal<ImageUploadData | null>(null);

  openDrawer(): void { this.drawerOpen.set(true); }
  closeDrawer(): void { this.drawerOpen.set(false); }

  updateDrawerField(field: string, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.drawerForm.update(f => ({ ...f, [field]: value }));
  }

  onThumbnailChange(data: ImageUploadData | null): void {
    this.thumbnailData.set(data);
  }

  async registerBootcamp(): Promise<void> {
    const form = this.drawerForm();
    try {
      // 썸네일 업로드
      let thumbnailUrl: string | undefined;
      const thumb = this.thumbnailData();
      if (thumb) {
        const result = await this.api.upload.single(thumb.file, 'bootcamps');
        thumbnailUrl = result.url;
      }

      await this.api.bootcamps.create({
        name: form.bootcampName,
        instructorName: form.name,
        description: form.workIntro,
        thumbnail: thumbnailUrl,
        startDate: form.startDate ? new Date(form.startDate) : undefined,
        endDate: form.endDate ? new Date(form.endDate) : undefined,
      });
      this.toast.success('등록 완료 되었습니다.');
      this.drawerOpen.set(false);
      this.thumbnailData.set(null);
      this.thumbnailUploadRef?.reset();
      await this.loadBootcamps();
    } catch (e: unknown) {
      this.toast.error(e instanceof Error ? e.message : '등록 실패');
    }
  }
}
