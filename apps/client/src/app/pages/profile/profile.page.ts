import { Component, signal, computed, ViewChild, ElementRef, HostListener, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

interface Album {
  id: number;
  name: string;
  contentCount: number;
  thumbnails: string[];
  contentIds: number[];
  isActive: boolean;
}

interface ContentCard {
  id: number;
  title: string;
  imageUrl: string;
  authorName: string;
  commentCount: number;
  feedbackCount: number;
  firstComment?: { body: string; authorName: string };
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.css'],
})
export class ProfilePage implements OnInit, OnDestroy {
  @ViewChild('albumSlider') albumSlider!: ElementRef<HTMLDivElement>;
  private router = inject(Router);
  private api = inject(ApiService);
  private auth = inject(AuthService);

  userName = signal('사용자');
  userNickname = signal('닉네임');
  userEmail = signal('');
  userBio = signal('');
  userProfileImage = signal<string | null>(null);
  userInitial = signal('');
  userSns = signal<{ type: string; url: string }[]>([]);
  userRole = signal('');
  userId = signal<number>(0);
  isInstructor = computed(() => this.userRole() === 'INSTRUCTOR' || this.userRole() === 'ADMIN');

  // 활동 정보 카운트
  feedbackCount = signal(0);
  generalCount = signal(0);
  receivedLikes = signal(0);

  ngOnInit(): void {
    document.body.style.backgroundColor = '#151419';
    this.loadProfile();
  }

  ngOnDestroy(): void {
    document.body.style.backgroundColor = '';
  }

  private async loadProfile(): Promise<void> {
    try {
      const user = await this.api.users.me();
      this.userId.set(user.id);
      this.userName.set(user.name);
      this.userNickname.set(user.nickname || user.name);
      this.userEmail.set(user.email);
      this.userBio.set(user.intro || '');
      this.userProfileImage.set(user.profileImage || null);
      this.userInitial.set((user.nickname || user.name || 'U').charAt(0).toUpperCase());

      // 커버 이미지 로드
      if ((user as any).coverImage) {
        this.bannerBackground.set(`url('${(user as any).coverImage}') center center / cover no-repeat`);
      }
      if (user.sns && user.sns.length > 0) {
        this.userSns.set(user.sns.map((s: any) => ({ type: s.type, url: s.url })));
      }
      this.userRole.set(user.role || '');

      // 프로필 로드 후 콘텐츠/카테고리/앨범/포트폴리오 로드
      this.loadContents();
      this.loadCategories();
      this.loadAlbums();
      this.loadCommentStats(user.id);
    } catch (e) {
      console.error('프로필 로드 실패:', e);
    }
  }

  private async loadCategories(): Promise<void> {
    try {
      // 책갈피 탭: BOOKMARK 타입 앨범만 로드
      const albums = await this.api.albums.findAll('BOOKMARK');
      this.categories.set(albums.map((a: any) => {
        const acs = a.albumContents || [];
        return {
          id: a.id,
          name: a.name,
          contentCount: a._count?.albumContents || acs.length,
          thumbnails: acs.slice(0, 4).map((ac: any) => ac.content?.thumbnail || '').filter(Boolean),
          contentIds: acs.map((ac: any) => ac.content?.id).filter(Boolean),
          isActive: false,
        };
      }));

      // 북마크된 콘텐츠 수집 (모든 앨범의 콘텐츠 합산, 중복 제거)
      const contentMap = new Map<number, any>();
      for (const a of albums) {
        for (const ac of (a.albumContents || [])) {
          const c = ac.content;
          if (c && !contentMap.has(c.id)) {
            contentMap.set(c.id, {
              id: c.id,
              title: c.title,
              imageUrl: c.thumbnail || '',
              authorName: c.author?.nickname || c.author?.name || '',
              commentCount: c._count?.comments || 0,
              feedbackCount: c._count?.comments || 0,
              firstComment: c.comments?.[0] ? {
                body: c.comments[0].body,
                authorName: c.comments[0].author?.nickname || c.comments[0].author?.name || '',
              } : undefined,
            });
          }
        }
      }
      this.bookmarkContents.set(Array.from(contentMap.values()));
      this.bookmarkCount.set(contentMap.size);
    } catch (e) {
      console.error('책갈피 로드 실패:', e);
    }
  }

  private async loadContents(): Promise<void> {
    try {
      // ALBUM 타입 앨범에 속한 콘텐츠만 수집 (중복 제거)
      const serverAlbums = await this.api.albums.findAll('ALBUM');
      const contentMap = new Map<number, any>();
      for (const a of serverAlbums) {
        for (const ac of (a.albumContents || [])) {
          const c = ac.content;
          if (c && !contentMap.has(c.id)) {
            contentMap.set(c.id, {
              id: c.id,
              title: c.title,
              imageUrl: c.thumbnail || '',
              authorName: c.author?.nickname || c.author?.name || '',
              commentCount: c._count?.comments || 0,
              feedbackCount: c._count?.comments || 0,
              firstComment: c.comments?.[0] ? {
                body: c.comments[0].body,
                authorName: c.comments[0].author?.nickname || c.comments[0].author?.name || '',
              } : undefined,
            });
          }
        }
      }
      this.contents.set(Array.from(contentMap.values()));
      this.allCount.set(contentMap.size);
    } catch (e) {
      console.error('콘텐츠 로드 실패:', e);
    }
  }

  private async loadAlbums(): Promise<void> {
    try {
      const serverAlbums = await this.api.albums.findAll('ALBUM');
      const mapped: Album[] = serverAlbums.map((a: any) => {
        const acs = a.albumContents || [];
        return {
          id: a.id,
          name: a.name,
          contentCount: a._count?.albumContents || 0,
          thumbnails: acs.slice(0, 4).map((ac: any) => ac.content?.thumbnail || '').filter(Boolean),
          contentIds: acs.map((ac: any) => ac.content?.id).filter(Boolean),
          isActive: false,
        };
      });
      this.albums.set(mapped);
    } catch (e) {
      console.error('앨범 로드 실패:', e);
    }
  }

  private async loadCommentStats(userId: number): Promise<void> {
    try {
      const stats = await this.api.users.commentStats(userId);
      this.feedbackCount.set(stats.feedbackCount);
      this.generalCount.set(stats.generalCount);
      this.receivedLikes.set(stats.receivedLikes);
    } catch (e) {
      console.error('댓글 통계 로드 실패:', e);
    }
  }

  /* ===== 배너 커버 ===== */
  @ViewChild('coverInput') coverInputRef!: ElementRef<HTMLInputElement>;
  private readonly BANNER_IMAGE = "url('/images/profile-banner.jpg') center center / cover no-repeat";
  private readonly DEFAULT_COVER = "url('/images/default-banner.svg') center center / cover no-repeat";
  bannerBackground = signal<string>("url('/images/profile-banner.jpg') center center / cover no-repeat");

  /** 파일 업로드 트리거 */
  triggerCoverUpload(): void {
    this.coverInputRef?.nativeElement?.click();
  }

  /** 파일 선택 시 업로드 + DB 저장 */
  async onCoverFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    try {
      const result = await this.api.upload.single(file, 'covers');
      this.bannerBackground.set(`url('${result.url}') center center / cover no-repeat`);
      // DB에 저장
      const uid = this.userId();
      if (uid) {
        await this.api.users.update(uid, { coverImage: result.url });
      }
    } catch (e) {
      console.error('배너 업로드 실패:', e);
    }
    input.value = '';
  }

  /** 기본 커버로 변경 + DB 저장 */
  async resetToDefaultCover(): Promise<void> {
    this.bannerBackground.set(this.DEFAULT_COVER);
    try {
      const uid = this.userId();
      if (uid) {
        await this.api.users.update(uid, { coverImage: '/images/default-banner.svg' });
      }
    } catch (e) {
      console.error('기본 배너 저장 실패:', e);
    }
  }

  /* ===== 프로필 편집 드롭다운 ===== */
  isEditDropdownOpen = signal(false);

  toggleEditDropdown(): void {
    this.isEditDropdownOpen.update(v => !v);
  }

  closeEditDropdown(): void {
    this.isEditDropdownOpen.set(false);
  }

  goToProfileEdit(): void {
    this.closeEditDropdown();
    this.router.navigate(['/profile-edit']);
  }

  goToChangeEmail(): void {
    this.closeEditDropdown();
    this.router.navigate(['/change-email']);
  }

  goToChangePassword(): void {
    this.closeEditDropdown();
    this.router.navigate(['/change-password']);
  }

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
  categories = signal<Album[]>([]);

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
  albums = signal<Album[]>([]);

  // 콘텐츠 데이터
  contents = signal<ContentCard[]>([]);

  allCount = signal(0);
  albumCount = signal(0);
  searchQuery = signal('');

  /** 앨범 선택 + 검색어에 따른 필터링된 콘텐츠 */
  filteredContents = computed(() => {
    const albumId = this.selectedAlbumId();
    const query = this.searchQuery().toLowerCase().trim();
    let result = this.contents();
    if (albumId) {
      const album = this.albums().find(a => a.id === albumId);
      if (album) result = result.filter(c => album.contentIds.includes(c.id));
    }
    if (query) {
      result = result.filter(c => c.title.toLowerCase().includes(query) || c.authorName.toLowerCase().includes(query));
    }
    return result;
  });

  // 북마크 콘텐츠
  bookmarkContents = signal<ContentCard[]>([]);
  bookmarkCount = signal(0);
  selectedCategoryId = signal<number | null>(null);

  /** 카테고리 선택 + 검색어에 따른 필터링된 북마크 콘텐츠 */
  filteredBookmarkContents = computed(() => {
    const catId = this.selectedCategoryId();
    const query = this.searchQuery().toLowerCase().trim();
    let result = this.bookmarkContents();
    if (catId) {
      const cat = this.categories().find(c => c.id === catId);
      if (cat) result = result.filter(c => cat.contentIds.includes(c.id));
    }
    if (query) {
      result = result.filter(c => c.title.toLowerCase().includes(query) || c.authorName.toLowerCase().includes(query));
    }
    return result;
  });

  setTab(tab: 'all' | 'album'): void {
    this.activeTab.set(tab);
    this.searchQuery.set('');
  }

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  goToContentDetail(contentId: number): void {
    this.router.navigate(['/content', contentId]);
  }

  selectAlbum(id: number): void {
    const current = this.selectedAlbumId();
    if (current === id) {
      // 재클릭 시 해제 (전체 콘텐츠 보기)
      this.albums.update(list => list.map(a => ({ ...a, isActive: false })));
      this.selectedAlbumId.set(null);
    } else {
      this.albums.update(list => list.map(a => ({ ...a, isActive: a.id === id })));
      this.selectedAlbumId.set(id);
    }
  }

  selectCategory(id: number): void {
    const current = this.selectedCategoryId();
    if (current === id) {
      this.categories.update(list => list.map(c => ({ ...c, isActive: false })));
      this.selectedCategoryId.set(null);
    } else {
      this.categories.update(list =>
        list.map(c => ({ ...c, isActive: c.id === id }))
      );
      this.selectedCategoryId.set(id);
    }
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

  async createAlbum(): Promise<void> {
    const name = this.newAlbumName().trim();
    if (!name) return;
    try {
      await this.api.albums.create({ name });
      await this.loadAlbums();
    } catch (e) {
      console.error('앨범 생성 실패:', e);
    }
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

  async createCategory(): Promise<void> {
    const name = this.newCategoryName().trim();
    if (!name) return;
    try {
      await this.api.albums.create({ name, type: 'BOOKMARK' });
      await this.loadCategories();
    } catch (e) {
      console.error('카테고리 생성 실패:', e);
    }
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

  async confirmEditAlbum(): Promise<void> {
    const id = this.editAlbumId();
    const name = this.editAlbumName().trim();
    if (!id || !name) return;
    try {
      await this.api.albums.update(id, { name });
      await this.loadAlbums();
    } catch (e) {
      console.error('앨범 수정 실패:', e);
    }
    this.closeEditAlbumModal();
  }

  deleteAlbum(albumId: number): void {
    this.openAlbumMenuId.set(null);
    this.deleteTargetAlbumId.set(albumId);
    this.isDeleteAlbumModalOpen.set(true);
  }

  async confirmDeleteAlbum(): Promise<void> {
    const id = this.deleteTargetAlbumId();
    if (id !== null && id !== -1) {
      try {
        await this.api.albums.delete(id);
        await this.loadAlbums();
      } catch (e) {
        console.error('앨범 삭제 실패:', e);
      }
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

  async confirmEditCategory(): Promise<void> {
    const id = this.editCategoryId();
    const name = this.editCategoryName().trim();
    if (!id || !name) return;
    try {
      await this.api.albums.update(id, { name });
      await this.loadCategories();
    } catch (e) {
      console.error('카테고리 수정 실패:', e);
    }
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

  async confirmDeleteCategory(): Promise<void> {
    const id = this.deleteCategoryTargetId();
    if (id !== null) {
      try {
        await this.api.albums.delete(id);
        await this.loadCategories();
      } catch (e) {
        console.error('카테고리 삭제 실패:', e);
      }
    }
    this.closeDeleteCategoryModal();
  }

  closeDeleteCategoryModal(): void {
    this.isDeleteCategoryModalOpen.set(false);
    this.deleteCategoryTargetId.set(null);
  }
}
