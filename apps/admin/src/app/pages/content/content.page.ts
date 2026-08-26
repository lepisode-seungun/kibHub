import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DataGridComponent, GridColumn } from '../../components/data-grid/data-grid.component';
import { CONTENT_STATUS_BADGES } from '../../shared/badge-styles';
import { ToastService } from '../../shared/toast/toast.service';

@Component({
  selector: 'adm-content',
  standalone: true,
  imports: [CommonModule, DataGridComponent],
  templateUrl: './content.page.html',
  styleUrl: './content.page.css',
})
export class ContentPage {
  private router = inject(Router);
  private toast = inject(ToastService);

  columns: GridColumn[] = [
    { key: 'id', label: '순번', width: '60px' },
    {
      key: 'status', label: '상태', width: '80px',
      badge: 'status',
      badgeStyles: CONTENT_STATUS_BADGES,
    },
    { key: 'type', label: '타입', width: '100px' },
    { key: 'category', label: '카테고리', width: '120px' },
    { key: 'title', label: '제목' },
    { key: 'author', label: '작성자', width: '100px' },
    { key: 'comments', label: '댓글', width: '80px' },
    { key: 'views', label: '조회수', width: '80px' },
    { key: 'createdAt', label: '등록일시', width: '160px', headerColor: 'text-gray-600' },
  ];

  contents = [
    { id: 1, status: '노출', type: '포트폴리오', category: 'UX/UI', title: '모바일 앱 UI 리디자인', author: '고예림', comments: 12, views: 234, createdAt: '2024-06-15 10:00' },
    { id: 2, status: '숨김', type: '후기', category: '부트캠프', title: '부트캠프 수료 후기', author: '홍길동', comments: 5, views: 156, createdAt: '2024-07-10 14:30' },
    { id: 3, status: '노출', type: '포트폴리오', category: 'Web', title: '이커머스 웹사이트 디자인', author: '김영희', comments: 8, views: 312, createdAt: '2024-03-01 09:00' },
    { id: 4, status: '노출', type: '포트폴리오', category: 'Graphic', title: '브랜드 아이덴티티 디자인', author: '박지민', comments: 15, views: 420, createdAt: '2024-04-22 11:15' },
    { id: 5, status: '숨김', type: '후기', category: '부트캠프', title: 'UX/UI 부트캠프 1기 후기', author: '이수진', comments: 3, views: 89, createdAt: '2024-05-18 16:40' },
    { id: 6, status: '노출', type: '포트폴리오', category: 'App', title: '피트니스 앱 UX 케이스 스터디', author: '최민호', comments: 22, views: 567, createdAt: '2024-08-05 09:30' },
    { id: 7, status: '노출', type: '포트폴리오', category: 'UX/UI', title: '대시보드 리디자인 프로젝트', author: '정하은', comments: 10, views: 198, createdAt: '2024-09-12 13:20' },
    { id: 8, status: '숨김', type: '후기', category: '부트캠프', title: '프론트엔드 부트캠프 3기 후기', author: '한승우', comments: 7, views: 145, createdAt: '2024-10-01 08:50' },
  ];

  onRowClick(row: any): void {
    this.router.navigate(['/content', row.id]);
  }

  // ===== 카테고리 설정 드로어 =====
  showCategoryDrawer = signal(false);
  categories = signal<{ id: number; name: string; editing: boolean }[]>([
    { id: 1, name: '작화', editing: false },
    { id: 2, name: '채색', editing: false },
    { id: 3, name: '드로잉', editing: false },
    { id: 4, name: '선따기', editing: false },
  ]);
  editCategoryName = signal('');
  showNewCategoryRow = signal(false);
  newCategoryName = signal('');

  // 연필 아이콘 / 우클릭 드롭다운
  categoryDropdown = signal<{ id: number | null; x: number; y: number }>({
    id: null, x: 0, y: 0
  });

  openCategoryDrawer(): void {
    this.showCategoryDrawer.set(true);
  }

  closeCategoryDrawer(): void {
    this.showCategoryDrawer.set(false);
    this.categoryDropdown.set({ id: null, x: 0, y: 0 });
  }

  closeCategoryDropdown(): void {
    this.categoryDropdown.set({ id: null, x: 0, y: 0 });
  }

  toggleCategoryDropdown(id: number, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    const mouseEvent = event as MouseEvent;
    if (this.categoryDropdown().id === id) {
      this.closeCategoryDropdown();
    } else {
      this.categoryDropdown.set({ id, x: mouseEvent.clientX, y: mouseEvent.clientY });
    }
  }

  // 수정 모드
  startEditCategory(id: number): void {
    this.categoryDropdown.set({ id: null, x: 0, y: 0 });
    this.categories.update(list =>
      list.map(c => {
        if (c.id === id) {
          this.editCategoryName.set(c.name);
          return { ...c, editing: true };
        }
        return { ...c, editing: false };
      })
    );
  }

  onEditCategoryInput(event: Event): void {
    this.editCategoryName.set((event.target as HTMLInputElement).value);
  }

  saveEditCategory(id: number): void {
    const name = this.editCategoryName().trim();
    if (!name) return;
    this.categories.update(list =>
      list.map(c => c.id === id ? { ...c, name, editing: false } : c)
    );
    this.toast.success('수정 완료 되었습니다.');
  }

  cancelEditCategory(id: number): void {
    this.categories.update(list => {
      const cat = list.find(c => c.id === id);
      // 이름이 비어있으면 새 항목이므로 삭제
      if (cat && !cat.name) {
        return list.filter(c => c.id !== id);
      }
      return list.map(c => c.id === id ? { ...c, editing: false } : c);
    });
  }

  deleteCategory(id: number): void {
    this.categoryDropdown.set({ id: null, x: 0, y: 0 });
    const cat = this.categories().find(c => c.id === id);
    if (cat) {
      const hasContent = this.contents.some(c => c.category === cat.name);
      if (hasContent) {
        this.toast.error('[삭제 불가] 카테고리에 등록된 콘텐츠가 있는 경우 삭제 불가합니다.');
        return;
      }
    }
    this.categories.update(list => list.filter(c => c.id !== id));
    this.toast.success('삭제 완료 되었습니다.');
  }

  // 새 카테고리 추가
  addEmptyCategory(): void {
    this.showNewCategoryRow.set(true);
    this.newCategoryName.set('');
  }

  onNewCategoryInput(event: Event): void {
    this.newCategoryName.set((event.target as HTMLInputElement).value);
  }

  saveNewCategory(): void {
    const name = this.newCategoryName().trim();
    if (!name) return;
    this.categories.update(list => [
      ...list,
      { id: Date.now(), name, editing: false },
    ]);
    this.showNewCategoryRow.set(false);
    this.newCategoryName.set('');
    this.toast.success('등록 완료 되었습니다.');
  }

  cancelNewCategory(): void {
    this.showNewCategoryRow.set(false);
    this.newCategoryName.set('');
  }

  submitCategories(): void {
    // TODO: API 호출
    this.showCategoryDrawer.set(false);
  }
}
