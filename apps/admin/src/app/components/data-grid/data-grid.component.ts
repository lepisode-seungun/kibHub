import {
  Component,
  input,
  output,
  signal,
  computed,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export interface GridColumn {
  key: string;
  label: string;
  width?: string;        // 고정폭 (ex: '80px'), 없으면 flex-1
  badge?: string;        // 뱃지 스타일 그룹 이름
  badgeStyles?: Record<string, string>; // 값별 Tailwind 클래스
  headerColor?: string;  // 헤더 텍스트 색상 오버라이드
  type?: 'text' | 'image' | 'action' | 'drag'; // 셀 렌더링 타입 (기본: text)
}

export type GridRow = Record<string, unknown>;
export type RowIdFn = (row: GridRow) => unknown;

@Component({
  selector: 'adm-data-grid',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './data-grid.component.html',
  styleUrl: './data-grid.component.css',
})
export class DataGridComponent {
  /** 컬럼 정의 */
  columns = input.required<GridColumn[]>();

  /** 전체 데이터 */
  data = input.required<GridRow[]>();

  /** 검색 플레이스홀더 */
  searchPlaceholder = input<string>('검색어를 입력하세요');

  /** 검색 표시 여부 */
  showSearch = input<boolean>(true);

  /** 페이지 사이즈 옵션 */
  pageSizeOptions = input<number[]>([10, 20, 30, 50]);

  /** 컨텍스트 메뉴 항목 (정적) */
  contextMenuItems = input<string[]>([]);

  /** 컨텍스트 메뉴 항목 (동적 — 행 데이터 기반) */
  contextMenuItemsFn = input<((row: GridRow) => string[]) | null>(null);

  /** 체크박스 표시 여부 */
  showCheckbox = input<boolean>(false);

  /** 행 고유 ID 함수 (기본: row.id) */
  rowIdFn = input<RowIdFn>((row: GridRow) => row['id']);

  /** 행 클릭 이벤트 */
  rowClick = output<GridRow>();

  /** 행 우클릭 이벤트 */
  rowContextMenu = output<{ row: GridRow; x: number; y: number }>();

  /** 컨텍스트 메뉴 선택 이벤트 */
  contextMenuSelect = output<{ action: string; row: GridRow }>();

  /** 액션 컬럼 클릭 이벤트 */
  actionClick = output<{ key: string; row: GridRow }>();

  /** 검색어 변경 이벤트 */
  searchChange = output<string>();

  /** 체크박스 선택 변경 이벤트 */
  selectionChange = output<GridRow[]>();

  /** 행 순서 변경 이벤트 (드래그앤드롭) */
  rowReorder = output<GridRow[]>();

  // 드래그 상태
  private dragIndex = -1;
  dragOverIndex = signal(-1);
  isDragging = signal(false);
  private justDragged = false;

  // 내부 상태
  searchQuery = signal('');
  currentPage = signal(1);
  pageSize = signal(10);
  showPageSizeDropdown = signal(false);
  selectedIds = signal<Set<unknown>>(new Set());

  // 체크박스 계산
  isAllSelected = computed(() => {
    const data = this.paginatedData();
    if (data.length === 0) return false;
    const ids = this.selectedIds();
    return data.every(row => ids.has(this.rowIdFn()(row)));
  });

  isRowSelected(row: GridRow): boolean {
    return this.selectedIds().has(this.rowIdFn()(row));
  }

  toggleAll(): void {
    const data = this.paginatedData();
    const ids = new Set(this.selectedIds());
    if (this.isAllSelected()) {
      data.forEach(row => ids.delete(this.rowIdFn()(row)));
    } else {
      data.forEach(row => ids.add(this.rowIdFn()(row)));
    }
    this.selectedIds.set(ids);
    this.emitSelection();
  }

  toggleRow(row: GridRow): void {
    const ids = new Set(this.selectedIds());
    const id = this.rowIdFn()(row);
    if (ids.has(id)) {
      ids.delete(id);
    } else {
      ids.add(id);
    }
    this.selectedIds.set(ids);
    this.emitSelection();
  }

  private emitSelection(): void {
    const ids = this.selectedIds();
    const selected = this.data().filter(row => ids.has(this.rowIdFn()(row)));
    this.selectionChange.emit(selected);
  }

  // 컨텍스트 메뉴 상태
  ctxMenuVisible = signal(false);
  ctxMenuX = signal(0);
  ctxMenuY = signal(0);
  ctxMenuRow = signal<GridRow | null>(null);
  ctxMenuHover = signal(-1);
  ctxMenuDynamicItems = signal<string[]>([]);

  // 계산된 값
  filteredData = computed(() => {
    const query = this.searchQuery().toLowerCase();
    if (!query) return this.data();
    return this.data().filter(row =>
      this.columns().some(col => {
        const val = row[col.key];
        return val != null && String(val).toLowerCase().includes(query);
      })
    );
  });

  totalPages = computed(() => Math.max(1, Math.ceil(this.filteredData().length / this.pageSize())));

  paginatedData = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.filteredData().slice(start, start + this.pageSize());
  });

  pageNumbers = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const maxVisible = 5;

    let start = Math.max(1, current - Math.floor(maxVisible / 2));
    const end = Math.min(total, start + maxVisible - 1);
    start = Math.max(1, end - maxVisible + 1);

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  });

  totalCount = computed(() => this.filteredData().length);

  // 메서드
  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
    this.currentPage.set(1);
    this.searchChange.emit(value);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  changePageSize(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(1);
    this.showPageSizeDropdown.set(false);
  }

  togglePageSizeDropdown(): void {
    this.showPageSizeDropdown.update(v => !v);
  }

  onRowClick(row: GridRow): void {
    if (this.justDragged) {
      this.justDragged = false;
      return;
    }
    this.rowClick.emit(row);
  }

  onRowContextMenu(event: MouseEvent, row: GridRow): void {
    event.preventDefault();
    this.rowContextMenu.emit({ row, x: event.clientX, y: event.clientY });

    // 동적 메뉴 함수가 있으면 행 데이터 기반으로 메뉴 아이템 생성
    const fn = this.contextMenuItemsFn();
    const items = fn ? fn(row) : this.contextMenuItems();

    if (items.length > 0) {
      this.ctxMenuDynamicItems.set(items);
      this.ctxMenuVisible.set(true);
      this.ctxMenuX.set(event.clientX);
      this.ctxMenuY.set(event.clientY);
      this.ctxMenuRow.set(row);
      this.ctxMenuHover.set(-1);
    }
  }

  closeContextMenu(): void {
    this.ctxMenuVisible.set(false);
  }

  onCtxMenuSelect(action: string): void {
    const row = this.ctxMenuRow();
    if (row) {
      this.contextMenuSelect.emit({ action, row });
    }
    this.closeContextMenu();
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.closeContextMenu();
  }

  // ===== 드래그앤드롭 =====
  hasDragColumn = computed(() => this.columns().some(col => col.type === 'drag'));

  onDragStart(event: DragEvent, index: number): void {
    this.dragIndex = index;
    this.isDragging.set(true);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', String(index));
    }
  }

  onDragOver(event: DragEvent, index: number): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
    this.dragOverIndex.set(index);
  }

  onDragLeave(): void {
    this.dragOverIndex.set(-1);
  }

  onDrop(event: DragEvent, dropIndex: number): void {
    event.preventDefault();
    this.dragOverIndex.set(-1);

    if (this.dragIndex === dropIndex || this.dragIndex < 0) {
      this.isDragging.set(false);
      this.dragIndex = -1;
      return;
    }

    // 전체 데이터 기준으로 정렬 변경
    const allData = [...this.data()];
    const pageStart = (this.currentPage() - 1) * this.pageSize();
    const fromGlobal = pageStart + this.dragIndex;
    const toGlobal = pageStart + dropIndex;

    const [moved] = allData.splice(fromGlobal, 1);
    allData.splice(toGlobal, 0, moved);

    this.justDragged = true;
    setTimeout(() => this.justDragged = false, 200);

    this.rowReorder.emit(allData);
    this.isDragging.set(false);
    this.dragIndex = -1;
  }

  onDragEnd(): void {
    this.isDragging.set(false);
    this.dragOverIndex.set(-1);
    this.dragIndex = -1;
  }

  getCellClass(col: GridColumn, value: unknown): string {
    const strValue = String(value);
    if (col.badge && col.badgeStyles && col.badgeStyles[strValue]) {
      return col.badgeStyles[strValue];
    }
    return '';
  }

  getColStyle(col: GridColumn): Record<string, string> {
    if (col.width) {
      return { width: col.width, 'flex-shrink': '0' };
    }
    return { flex: '1' };
  }

  truncateCell(value: unknown, maxLen = 50): string {
    const str = String(value ?? '');
    return str.length > maxLen ? str.slice(0, maxLen) + '...' : str;
  }
}
