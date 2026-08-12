import { Component, signal, computed, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface Album {
  id: number;
  name: string;
  contentCount: number;
  thumbnails: string[];
  isActive: boolean;
}

interface ContentCard {
  id: number;
  title: string;
  imageUrl: string;
  authorName: string;
  commentCount: number;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.css'],
})
export class ProfilePage {
  @ViewChild('albumSlider') albumSlider!: ElementRef<HTMLDivElement>;

  activeTab = signal<'all' | 'album'>('all');
  selectedAlbumId = signal<number | null>(null);
  isSortOpen = signal(false);
  selectedSort = signal<'latest' | 'oldest'>('latest');
  openAlbumMenuId = signal<number | null>(null);
  isNewAlbumModalOpen = signal(false);
  newAlbumName = signal('');
  isNewCategoryModalOpen = signal(false);
  newCategoryName = signal('');
  newCategoryPrivate = signal(false);
  isDeleteAlbumModalOpen = signal(false);
  deleteTargetAlbumId = signal<number | null>(null);
  isEditAlbumModalOpen = signal(false);
  editAlbumId = signal<number | null>(null);
  editAlbumName = signal('');

  // 카테고리(책갈피) 수정/삭제
  isEditCategoryModalOpen = signal(false);
  editCategoryId = signal<number | null>(null);
  editCategoryName = signal('');
  editCategoryPrivate = signal(false);
  isDeleteCategoryModalOpen = signal(false);
  deleteCategoryTargetId = signal<number | null>(null);

  // 카테고리 데이터 (앨범과 동일 구조)
  categories = signal<Album[]>([
    { id: 101, name: '디자인 레퍼런스', contentCount: 24, thumbnails: [], isActive: true },
    { id: 102, name: 'UI 인사이트', contentCount: 18, thumbnails: [], isActive: false },
    { id: 103, name: '일러스트 참고자료 모음 카테고리명 최대 30자', contentCount: 42, thumbnails: [], isActive: false },
    { id: 104, name: '타이포그래피 영감', contentCount: 9, thumbnails: [], isActive: false },
    { id: 105, name: '모션그래픽 레퍼런스 모음', contentCount: 31, thumbnails: [], isActive: false },
  ]);

  deleteTargetCategory = computed(() => {
    const id = this.deleteCategoryTargetId();
    return id !== null ? this.categories().find(c => c.id === id) ?? null : null;
  });

  selectedAlbumName = computed(() => {
    if (this.activeTab() === 'album') {
      const activeCat = this.categories().find(c => c.isActive);
      return activeCat ? activeCat.name : '전체 책갈피';
    }
    const active = this.albums().find(a => a.isActive);
    return active ? active.name : '전체 콘텐츠';
  });

  deleteTargetAlbum = computed(() => {
    const id = this.deleteTargetAlbumId();
    return id !== null ? this.albums().find(a => a.id === id) ?? null : null;
  });

  // 앨범 데이터
  albums = signal<Album[]>([
    {
      id: 1,
      name: '전체콘텐츠',
      contentCount: 132,
      thumbnails: [],
      isActive: true,
    },
    {
      id: 2,
      name: '앨범명은 최대 30자로 제한합니다. 앨범명은 최대 30',
      contentCount: 132,
      thumbnails: [],
      isActive: false,
    },
    {
      id: 3,
      name: '앨범명은 최대 30자로 제한합니다. 앨범명은 최대 30',
      contentCount: 132,
      thumbnails: [],
      isActive: false,
    },
    {
      id: 4,
      name: '앨범명은 최대 30자로 제한합니다. 앨범명은 최대 30',
      contentCount: 132,
      thumbnails: [],
      isActive: false,
    },
    {
      id: 5,
      name: '앨범명은 최대 30자로 제한합니다. 앨범명은 최대 30',
      contentCount: 132,
      thumbnails: [],
      isActive: false,
    },
  ]);

  // 콘텐츠 데이터
  contents = signal<ContentCard[]>([
    { id: 1, title: '콘텐츠 제목 30자 이내 콘텐츠 제목 콘텐츠 제목 콘텐', imageUrl: '', authorName: '', commentCount: 2 },
    { id: 2, title: '콘텐츠 제목 30자 이내 콘텐츠 제목 콘텐츠 제목 콘텐', imageUrl: '', authorName: '', commentCount: 2 },
    { id: 3, title: '콘텐츠 제목 30자 이내 콘텐츠 제목 콘텐츠 제목 콘텐', imageUrl: '', authorName: '', commentCount: 2 },
    { id: 4, title: '콘텐츠 제목 30자 이내 콘텐츠 제목 콘텐츠 제목 콘텐', imageUrl: '', authorName: '', commentCount: 2 },
    { id: 5, title: '콘텐츠 제목 30자 이내 콘텐츠 제목 콘텐츠 제목 콘텐', imageUrl: '', authorName: '', commentCount: 2 },
    { id: 6, title: '콘텐츠 제목 30자 이내 콘텐츠 제목 콘텐츠 제목 콘텐', imageUrl: '', authorName: '', commentCount: 2 },
    { id: 7, title: '콘텐츠 제목 30자 이내 콘텐츠 제목 콘텐츠 제목 콘텐', imageUrl: '', authorName: '', commentCount: 2 },
    { id: 8, title: '콘텐츠 제목 30자 이내 콘텐츠 제목 콘텐츠 제목 콘텐', imageUrl: '', authorName: '', commentCount: 2 },
    { id: 9, title: '콘텐츠 제목 30자 이내 콘텐츠 제목 콘텐츠 제목 콘텐', imageUrl: '', authorName: '', commentCount: 2 },
    { id: 10, title: '콘텐츠 제목 30자 이내 콘텐츠 제목 콘텐츠 제목 콘텐', imageUrl: '', authorName: '', commentCount: 2 },
  ]);

  allCount = signal(0);
  albumCount = signal(0);

  setTab(tab: 'all' | 'album'): void {
    this.activeTab.set(tab);
  }

  selectAlbum(id: number): void {
    this.albums.update(list =>
      list.map(a => ({ ...a, isActive: a.id === id }))
    );
    this.selectedAlbumId.set(id);
  }

  selectCategory(id: number): void {
    this.categories.update(list =>
      list.map(c => ({ ...c, isActive: c.id === id }))
    );
  }

  toggleSort(): void {
    this.isSortOpen.update(v => !v);
  }

  selectSort(sort: 'latest' | 'oldest'): void {
    this.selectedSort.set(sort);
    this.isSortOpen.set(false);
  }

  get sortLabel(): string {
    if (this.activeTab() === 'album') {
      return this.selectedSort() === 'latest' ? '최근 담기 순' : '오래된 담기 순';
    }
    return this.selectedSort() === 'latest' ? '최신순' : '오래된순';
  }

  get sortOptionLabels(): { latest: string; oldest: string } {
    if (this.activeTab() === 'album') {
      return { latest: '최근 담기 순', oldest: '오래된 담기 순' };
    }
    return { latest: '최신순', oldest: '오래된순' };
  }

  scrollSlider(direction: 'left' | 'right'): void {
    const el = this.albumSlider?.nativeElement;
    if (!el) return;
    const scrollAmount = 270; // card width + gap
    el.scrollBy({
      left: direction === 'right' ? scrollAmount : -scrollAmount,
      behavior: 'smooth',
    });
  }

  openNewAlbumModal(): void {
    this.newAlbumName.set('');
    this.isNewAlbumModalOpen.set(true);
  }

  closeNewAlbumModal(): void {
    this.isNewAlbumModalOpen.set(false);
    this.newAlbumName.set('');
  }

  onNewAlbumNameInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.newAlbumName.set(input.value);
  }

  createAlbum(): void {
    const name = this.newAlbumName().trim();
    if (!name) return;
    const currentAlbums = this.albums();
    const newId = Math.max(...currentAlbums.map(a => a.id), 0) + 1;
    this.albums.update(list => [
      ...list,
      {
        id: newId,
        name,
        contentCount: 0,
        thumbnails: [],
        isActive: false,
      },
    ]);
    this.closeNewAlbumModal();
  }

  /** 탭에 따라 앨범/카테고리 모달 분기 */
  openAddModal(): void {
    if (this.activeTab() === 'album') {
      this.openNewCategoryModal();
    } else {
      this.openNewAlbumModal();
    }
  }

  openNewCategoryModal(): void {
    this.newCategoryName.set('');
    this.newCategoryPrivate.set(false);
    this.isNewCategoryModalOpen.set(true);
  }

  closeNewCategoryModal(): void {
    this.isNewCategoryModalOpen.set(false);
    this.newCategoryName.set('');
    this.newCategoryPrivate.set(false);
  }

  toggleCategoryPrivate(): void {
    this.newCategoryPrivate.update(v => !v);
  }

  onNewCategoryNameInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.newCategoryName.set(input.value);
  }

  createCategory(): void {
    const name = this.newCategoryName().trim();
    if (!name) return;
    // TODO: 실제 API 연동 시 서비스 호출로 교체
    this.closeNewCategoryModal();
  }

  /* ===== 앨범 카드 더보기 메뉴 ===== */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (target.closest('.pf-album-more-wrap')) return;
    this.openAlbumMenuId.set(null);
  }

  toggleAlbumMenu(albumId: number): void {
    this.openAlbumMenuId.update(id => id === albumId ? null : albumId);
  }

  editAlbum(albumId: number): void {
    const album = this.albums().find(a => a.id === albumId);
    if (!album) return;
    this.openAlbumMenuId.set(null);
    const name = album.name;
    setTimeout(() => {
      this.editAlbumId.set(albumId);
      this.editAlbumName.set(name);
      this.isEditAlbumModalOpen.set(true);
    });
  }

  closeEditAlbumModal(): void {
    this.isEditAlbumModalOpen.set(false);
    this.editAlbumId.set(null);
    this.editAlbumName.set('');
  }

  onEditAlbumNameInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.editAlbumName.set(input.value);
  }

  confirmEditAlbum(): void {
    const id = this.editAlbumId();
    const name = this.editAlbumName().trim();
    if (!id || !name) return;
    this.albums.update(list =>
      list.map(a => a.id === id ? { ...a, name } : a)
    );
    this.closeEditAlbumModal();
  }

  deleteAlbum(albumId: number): void {
    this.openAlbumMenuId.set(null);
    this.deleteTargetAlbumId.set(albumId);
    this.isDeleteAlbumModalOpen.set(true);
  }

  confirmDeleteAlbum(): void {
    const id = this.deleteTargetAlbumId();
    if (id !== null) {
      this.albums.update(list => list.filter(a => a.id !== id));
    }
    this.closeDeleteAlbumModal();
  }

  closeDeleteAlbumModal(): void {
    this.isDeleteAlbumModalOpen.set(false);
    this.deleteTargetAlbumId.set(null);
  }

  splitAlbumName(name: string): string[] {
    return name.split(/(?<=\.)\s+/);
  }

  /* ===== 카테고리 수정 ===== */
  editCategory(categoryId: number): void {
    const cat = this.categories().find(c => c.id === categoryId);
    if (!cat) return;
    this.openAlbumMenuId.set(null);
    setTimeout(() => {
      this.editCategoryId.set(categoryId);
      this.editCategoryName.set(cat.name);
      this.editCategoryPrivate.set(false);
      this.isEditCategoryModalOpen.set(true);
    });
  }

  closeEditCategoryModal(): void {
    this.isEditCategoryModalOpen.set(false);
    this.editCategoryId.set(null);
    this.editCategoryName.set('');
  }

  onEditCategoryNameInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.editCategoryName.set(input.value);
  }

  toggleEditCategoryPrivate(): void {
    this.editCategoryPrivate.update(v => !v);
  }

  confirmEditCategory(): void {
    const id = this.editCategoryId();
    const name = this.editCategoryName().trim();
    if (!id || !name) return;
    this.categories.update(list =>
      list.map(c => c.id === id ? { ...c, name } : c)
    );
    this.closeEditCategoryModal();
  }

  /* ===== 카테고리 삭제 ===== */
  deleteCategory(categoryId: number): void {
    this.openAlbumMenuId.set(null);
    setTimeout(() => {
      this.deleteCategoryTargetId.set(categoryId);
      this.isDeleteCategoryModalOpen.set(true);
    });
  }

  confirmDeleteCategory(): void {
    const id = this.deleteCategoryTargetId();
    if (id !== null) {
      this.categories.update(list => list.filter(c => c.id !== id));
    }
    this.closeDeleteCategoryModal();
  }

  closeDeleteCategoryModal(): void {
    this.isDeleteCategoryModalOpen.set(false);
    this.deleteCategoryTargetId.set(null);
  }
}
