import { formatDate } from '../../shared/format-date';
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DataGridComponent, GridColumn, GridRow } from '../../components/data-grid/data-grid.component';
import { CONTENT_STATUS_BADGES } from '../../shared/badge-styles';
import { ToastService } from '../../shared/toast/toast.service';
import { ApiService } from '../../services/api.service';
import { Content, ContentCategory, ContentRow } from '../../shared/types';

const TYPE_MAP: Record<string, string> = {
  WEBTOON: '웹툰', ILLUSTRATION: '그림', WRITING: '글',
};
const STATUS_DISPLAY: Record<string, string> = {
  VISIBLE: '노출', HIDDEN: '숨김',
};

function toContentRow(c: Content): ContentRow {
  return {
    id: c.id,
    status: STATUS_DISPLAY[c.status] || c.status,
    type: TYPE_MAP[c.type] || c.type,
    category: c.category?.name || '',
    title: c.title,
    author: c.author?.nickname || c.author?.name || '',
    comments: c._count?.comments || 0,
    views: c.viewCount || 0,
    createdAt: formatDate(c.createdAt),
  };
}

interface CategoryItem {
  id: number;
  name: string;
  editing: boolean;
}

@Component({
  selector: 'adm-content',
  standalone: true,
  imports: [CommonModule, DataGridComponent],
  templateUrl: './content.page.html',
  styleUrl: './content.page.css',
})
export class ContentPage implements OnInit {
  private router = inject(Router);
  private toast = inject(ToastService);
  private api = inject(ApiService);

  columns: GridColumn[] = [
    { key: 'id', label: '순번', width: '60px' },
    { key: 'status', label: '상태', width: '80px', badge: 'status', badgeStyles: CONTENT_STATUS_BADGES },
    { key: 'type', label: '타입', width: '100px' },
    { key: 'category', label: '카테고리', width: '120px' },
    { key: 'title', label: '제목' },
    { key: 'author', label: '작성자', width: '100px' },
    { key: 'comments', label: '댓글', width: '80px' },
    { key: 'views', label: '조회수', width: '80px' },
    { key: 'createdAt', label: '등록일시', width: '160px', headerColor: 'text-gray-600' },
  ];

  contents = signal<ContentRow[]>([]);

  ngOnInit(): void {
    this.loadContents();
    this.loadCategories();
  }

  async loadContents(): Promise<void> {
    try {
      const data = await this.api.contents.findAll();
      this.contents.set(data.map(toContentRow));
    } catch (e) {
      console.error('콘텐츠 목록 로드 실패:', e);
    }
  }

  onRowClick(gridRow: GridRow): void {
    const row = gridRow as unknown as ContentRow;
    this.router.navigate(['/content', row.id]);
  }

  // ===== 우클릭 컨텍스트 메뉴 =====
  gridContextMenuFn = (gridRow: GridRow): string[] => {
    const row = gridRow as unknown as ContentRow;
    return [row.status === '숨김' ? '노출' : '숨김', '삭제'];
  };

  // 삭제 다이얼로그
  showDeleteDialog = signal(false);
  deleteTargetRow = signal<ContentRow | null>(null);

  async onContextMenuSelect(event: { action: string; row: GridRow }): Promise<void> {
    const { action } = event;
    const row = event.row as unknown as ContentRow;
    if (action === '숨김') {
      try {
        await this.api.contents.update(row.id, { status: 'HIDDEN' });
        this.toast.success('숨김 처리 되었습니다.');
        await this.loadContents();
      } catch (e: unknown) {
        this.toast.error(e instanceof Error ? e.message : '처리 실패');
      }
    } else if (action === '노출') {
      try {
        await this.api.contents.update(row.id, { status: 'VISIBLE' });
        this.toast.success('노출 처리 되었습니다.');
        await this.loadContents();
      } catch (e: unknown) {
        this.toast.error(e instanceof Error ? e.message : '처리 실패');
      }
    } else if (action === '삭제') {
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
      await this.api.contents.delete(row.id);
      this.toast.success('삭제가 완료 되었습니다.');
      this.showDeleteDialog.set(false);
      this.deleteTargetRow.set(null);
      await this.loadContents();
    } catch (e: unknown) {
      this.toast.error(e instanceof Error ? e.message : '삭제 실패');
    }
  }

  // ===== 카테고리 설정 드로어 =====
  showCategoryDrawer = signal(false);
  categories = signal<CategoryItem[]>([]);
  editCategoryName = signal('');
  showNewCategoryRow = signal(false);
  newCategoryName = signal('');

  categoryDropdown = signal<{ id: number | null; x: number; y: number }>({
    id: null, x: 0, y: 0
  });

  async loadCategories(): Promise<void> {
    try {
      const data = await this.api.contentCategories.findAll();
      this.categories.set(data.map((c: ContentCategory) => ({ id: c.id, name: c.name, editing: false })));
    } catch (e) {
      console.error('카테고리 로드 실패:', e);
    }
  }

  openCategoryDrawer(): void { this.showCategoryDrawer.set(true); }

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

  async saveEditCategory(id: number): Promise<void> {
    const name = this.editCategoryName().trim();
    if (!name) return;
    try {
      await this.api.contentCategories.update(id, { name });
      this.categories.update(list =>
        list.map(c => c.id === id ? { ...c, name, editing: false } : c)
      );
      this.toast.success('수정 완료 되었습니다.');
    } catch (e: unknown) {
      this.toast.error(e instanceof Error ? e.message : '수정 실패');
    }
  }

  cancelEditCategory(id: number): void {
    this.categories.update(list => {
      const cat = list.find(c => c.id === id);
      if (cat && !cat.name) {
        return list.filter(c => c.id !== id);
      }
      return list.map(c => c.id === id ? { ...c, editing: false } : c);
    });
  }

  async deleteCategory(id: number): Promise<void> {
    this.categoryDropdown.set({ id: null, x: 0, y: 0 });
    const cat = this.categories().find(c => c.id === id);
    if (cat) {
      const hasContent = this.contents().some(c => c.category === cat.name);
      if (hasContent) {
        this.toast.error('[삭제 불가] 카테고리에 등록된 콘텐츠가 있는 경우 삭제 불가합니다.');
        return;
      }
    }
    try {
      await this.api.contentCategories.delete(id);
      this.categories.update(list => list.filter(c => c.id !== id));
      this.toast.success('삭제 완료 되었습니다.');
    } catch (e: unknown) {
      this.toast.error(e instanceof Error ? e.message : '삭제 실패');
    }
  }

  addEmptyCategory(): void {
    this.showNewCategoryRow.set(true);
    this.newCategoryName.set('');
  }

  onNewCategoryInput(event: Event): void {
    this.newCategoryName.set((event.target as HTMLInputElement).value);
  }

  async saveNewCategory(): Promise<void> {
    const name = this.newCategoryName().trim();
    if (!name) return;
    try {
      const created = await this.api.contentCategories.create({ name });
      this.categories.update(list => [
        ...list,
        { id: created.id, name: created.name, editing: false },
      ]);
      this.showNewCategoryRow.set(false);
      this.newCategoryName.set('');
      this.toast.success('등록 완료 되었습니다.');
    } catch (e: unknown) {
      this.toast.error(e instanceof Error ? e.message : '등록 실패');
    }
  }

  cancelNewCategory(): void {
    this.showNewCategoryRow.set(false);
    this.newCategoryName.set('');
  }

  submitCategories(): void {
    this.showCategoryDrawer.set(false);
  }
}
