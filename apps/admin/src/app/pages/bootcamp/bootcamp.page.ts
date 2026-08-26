import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataGridComponent, GridColumn } from '../../components/data-grid/data-grid.component';
import { BOOTCAMP_STATUS_BADGES } from '../../shared/badge-styles';
import { ToastService } from '../../shared/toast/toast.service';

@Component({
  selector: 'adm-bootcamp',
  standalone: true,
  imports: [CommonModule, DataGridComponent],
  templateUrl: './bootcamp.page.html',
  styleUrl: './bootcamp.page.css',
})
export class BootcampPage {
  private toast = inject(ToastService);

  contextMenuItems = ['수정', '삭제'];

  gridColumns: GridColumn[] = [
    { key: 'id', label: '순번', width: '80px' },
    { key: 'status', label: '상태', width: '100px', badge: 'status', badgeStyles: BOOTCAMP_STATUS_BADGES },
    { key: 'bootcampName', label: '부트캠프명' },
    { key: 'createdAt', label: '등록일시', width: '160px' },
  ];

  bootcampData = [
    { id: 1, status: '모집', bootcampName: '웹툰 아카데미 1기', createdAt: '2024-01-10 09:00' },
    { id: 2, status: '운영', bootcampName: '웹툰 아카데미 2기', createdAt: '2024-03-15 10:00' },
    { id: 3, status: '종료', bootcampName: '글로벌 웹툰 마스터 1기', createdAt: '2024-05-20 14:30' },
    { id: 4, status: '준비', bootcampName: '웹소설 부트캠프 1기', createdAt: '2024-06-01 09:00' },
    { id: 5, status: '마감', bootcampName: '만화 창작 캠프 3기', createdAt: '2024-07-10 11:00' },
  ];

  onContextMenuAction(event: { action: string; row: any }): void {
    if (event.action === '수정') {
      this.toast.success('수정 페이지로 이동합니다.');
    } else if (event.action === '삭제') {
      this.toast.success('삭제가 완료 되었습니다.');
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
  drawerThumbnail = signal<{ name: string; size: string; preview: string } | null>(null);

  openDrawer(): void {
    this.drawerOpen.set(true);
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
  }

  updateDrawerField(field: string, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.drawerForm.update(f => ({ ...f, [field]: value }));
  }

  onDrawerThumbnailSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      this.drawerThumbnail.set({
        name: file.name,
        size: `${Math.round(file.size / 1024)}KB`,
        preview: reader.result as string,
      });
    };
    reader.readAsDataURL(file);
  }

  removeDrawerThumbnail(): void {
    this.drawerThumbnail.set(null);
  }

  triggerFileInput(id: string): void {
    document.getElementById(id)?.click();
  }

  registerBootcamp(): void {
    this.toast.success('등록 완료 되었습니다.');
    this.drawerOpen.set(false);
  }
}
