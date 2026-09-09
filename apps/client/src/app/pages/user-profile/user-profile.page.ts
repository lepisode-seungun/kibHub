import { Component, signal, computed, ViewChild, ElementRef, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { User, UserSns } from '@kibhub/shared';

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
  createdAt: string;
  firstComment?: { body: string; authorName: string };
}

interface ServerComment {
  body: string;
  author?: { nickname?: string; name?: string };
}

interface ServerContent {
  id: number;
  title: string;
  thumbnail?: string;
  author?: { nickname?: string; name?: string };
  _count?: { comments?: number };
  comments?: ServerComment[];
  createdAt?: string;
}

interface ServerAlbumContent {
  content?: ServerContent;
}

interface ServerAlbum {
  id: number;
  name: string;
  _count?: { albumContents?: number };
  albumContents?: ServerAlbumContent[];
}

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './user-profile.page.html',
  styleUrls: ['../profile/profile.page.css'],
})
export class UserProfilePage implements OnInit, OnDestroy {
  @ViewChild('albumSlider') albumSlider!: ElementRef<HTMLDivElement>;
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);

  targetUserId = 0;
  userName = signal('');
  userNickname = signal('');
  userBio = signal('');
  userProfileImage = signal<string | null>(null);
  userInitial = signal('');
  userRole = signal('');
  userSns = signal<{ type: string; url: string }[]>([]);
  isInstructor = computed(() => this.userRole() === 'INSTRUCTOR' || this.userRole() === 'ADMIN');
  bannerBackground = signal<string>("url('/images/profile-banner.jpg') center center / cover no-repeat");

  // 팔로우
  isFollowing = signal(false);
  followerCount = signal(0);
  followingCount = signal(0);
  isOwnProfile = signal(false);
  isLoggedIn = signal(false);
  currentUserId = 0;

  // 활동 정보
  feedbackCount = signal(0);
  generalCount = signal(0);
  receivedLikes = signal(0);

  // 탭
  activeTab = signal<'all' | 'album'>('all');
  selectedAlbumId = signal<number | null>(null);
  selectedCategoryId = signal<number | null>(null);
  isSortOpen = signal(false);
  selectedSort = signal<'latest' | 'oldest'>('latest');

  // 앨범 데이터
  albums = signal<Album[]>([]);
  categories = signal<Album[]>([]);

  // 콘텐츠 데이터
  contents = signal<ContentCard[]>([]);
  bookmarkContents = signal<ContentCard[]>([]);
  allCount = signal(0);
  bookmarkCount = signal(0);
  searchQuery = signal('');

  selectedAlbumName = computed(() => {
    if (this.activeTab() === 'album') {
      const activeCat = this.categories().find(c => c.isActive);
      return activeCat ? activeCat.name : '전체 책갈피';
    }
    const active = this.albums().find(a => a.isActive);
    return active ? active.name : '전체 콘텐츠';
  });

  filteredContents = computed(() => {
    const albumId = this.selectedAlbumId();
    const query = this.searchQuery().toLowerCase().trim();
    const sort = this.selectedSort();
    let result = this.contents();
    if (albumId) {
      const album = this.albums().find(a => a.id === albumId);
      if (album) result = result.filter(c => album.contentIds.includes(c.id));
    }
    if (query) {
      result = result.filter(c => c.title.toLowerCase().includes(query) || c.authorName.toLowerCase().includes(query));
    }
    result = [...result].sort((a, b) => {
      const da = new Date(a.createdAt).getTime();
      const db = new Date(b.createdAt).getTime();
      return sort === 'latest' ? db - da : da - db;
    });
    return result;
  });

  filteredBookmarkContents = computed(() => {
    const catId = this.selectedCategoryId();
    const query = this.searchQuery().toLowerCase().trim();
    const sort = this.selectedSort();
    let result = this.bookmarkContents();
    if (catId) {
      const cat = this.categories().find(c => c.id === catId);
      if (cat) result = result.filter(c => cat.contentIds.includes(c.id));
    }
    if (query) {
      result = result.filter(c => c.title.toLowerCase().includes(query) || c.authorName.toLowerCase().includes(query));
    }
    result = [...result].sort((a, b) => {
      const da = new Date(a.createdAt).getTime();
      const db = new Date(b.createdAt).getTime();
      return sort === 'latest' ? db - da : da - db;
    });
    return result;
  });

  ngOnInit(): void {
    document.body.style.backgroundColor = '#151419';
    this.route.params.subscribe(params => {
      const id = Number(params['id']);
      if (id) {
        this.targetUserId = id;
        this.loadUserProfile(id);
      }
    });
  }

  ngOnDestroy(): void {
    document.body.style.backgroundColor = '';
  }

  private async loadUserProfile(id: number): Promise<void> {
    try {
      const [user, stats, followCounts] = await Promise.all([
        this.api.users.findOne(id) as Promise<User>,
        this.api.users.commentStats(id),
        this.api.users.followCounts(id),
      ]);

      this.userName.set(user.name || '');
      this.userNickname.set(user.nickname || user.name || '사용자');
      this.userBio.set(user.intro || '');
      this.userProfileImage.set(user.profileImage || null);
      this.userInitial.set((user.nickname || user.name || 'U').charAt(0).toUpperCase());
      this.userRole.set(user.role || '');
      if (user.coverImage) {
        this.bannerBackground.set(`url('${user.coverImage}') center center / cover no-repeat`);
      }
      if (user.sns && user.sns.length > 0) {
        this.userSns.set(user.sns.map((s: UserSns) => ({ type: s.type, url: s.url })));
      }

      this.followerCount.set(followCounts.followerCount);
      this.followingCount.set(followCounts.followingCount);
      this.feedbackCount.set(stats.feedbackCount);
      this.generalCount.set(stats.generalCount);
      this.receivedLikes.set(stats.receivedLikes);

      // 앨범, 책갈피, 콘텐츠 로드
      this.loadAlbumsAndContents(id);
      this.loadBookmarks(id);

      // 자기 자신인지 확인
      try {
        const me = await this.api.users.me();
        this.isLoggedIn.set(true);
        this.currentUserId = me.id;
        if (me.id === id) {
          this.isOwnProfile.set(true);
          this.router.navigate(['/profile'], { replaceUrl: true });
          return;
        }
        const status = await this.api.users.followStatus(id, me.id);
        this.isFollowing.set(status.isFollowing);
      } catch {
        this.isLoggedIn.set(false);
      }
    } catch (e) {
      console.error('프로필 로드 실패:', e);
    }
  }

  private async loadAlbumsAndContents(userId: number): Promise<void> {
    try {
      const serverAlbums = await this.api.users.albums(userId, 'ALBUM') as ServerAlbum[];
      const mapped: Album[] = serverAlbums.map((a: ServerAlbum) => {
        const acs: ServerAlbumContent[] = a.albumContents || [];
        return {
          id: a.id,
          name: a.name,
          contentCount: a._count?.albumContents || acs.length,
          thumbnails: acs.slice(0, 4).map((ac: ServerAlbumContent) => ac.content?.thumbnail || '').filter(Boolean),
          contentIds: acs.map((ac: ServerAlbumContent) => ac.content?.id).filter((id): id is number => !!id),
          isActive: false,
        };
      });
      this.albums.set(mapped);

      // 앨범에 속한 콘텐츠 수집
      const contentMap = new Map<number, ContentCard>();
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
              createdAt: c.createdAt || '',
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
      console.error('앨범 로드 실패:', e);
    }
  }

  private async loadBookmarks(userId: number): Promise<void> {
    try {
      const serverAlbums = await this.api.users.albums(userId, 'BOOKMARK') as ServerAlbum[];
      const mapped: Album[] = serverAlbums.map((a: ServerAlbum) => {
        const acs: ServerAlbumContent[] = a.albumContents || [];
        return {
          id: a.id,
          name: a.name,
          contentCount: a._count?.albumContents || acs.length,
          thumbnails: acs.slice(0, 4).map((ac: ServerAlbumContent) => ac.content?.thumbnail || '').filter(Boolean),
          contentIds: acs.map((ac: ServerAlbumContent) => ac.content?.id).filter((id): id is number => !!id),
          isActive: false,
        };
      });
      this.categories.set(mapped);

      const contentMap = new Map<number, ContentCard>();
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
              createdAt: c.createdAt || '',
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

  async toggleFollow(): Promise<void> {
    if (!this.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    try {
      const result = await this.api.users.toggleFollow(this.targetUserId, this.currentUserId);
      this.isFollowing.set(result.followed);
      if (result.followed) {
        this.followerCount.update(c => c + 1);
      } else {
        this.followerCount.update(c => Math.max(0, c - 1));
      }
    } catch { /* ignore */ }
  }

  setTab(tab: 'all' | 'album'): void {
    this.activeTab.set(tab);
    this.searchQuery.set('');
  }

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  selectAlbum(id: number): void {
    const current = this.selectedAlbumId();
    if (current === id) {
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
      this.categories.update(list => list.map(c => ({ ...c, isActive: c.id === id })));
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
    el.scrollBy({ left: direction === 'right' ? 270 : -270, behavior: 'smooth' });
  }

  splitAlbumName(name: string): string[] {
    return name.split(/(?<=\.)\s+/);
  }

  goToContentDetail(contentId: number): void {
    this.router.navigate(['/content', contentId]);
  }

  // ===== 팔로잉/팔로워 모달 =====
  isFollowModalOpen = signal(false);
  followModalTab = signal<'following' | 'followers'>('following');
  followModalList = signal<{ id: number; nickname: string; profileImage: string | null; isFollowing: boolean }[]>([]);

  async openFollowModal(tab: 'following' | 'followers'): Promise<void> {
    this.followModalTab.set(tab);
    this.isFollowModalOpen.set(true);
    await this.loadFollowList(tab);
  }

  closeFollowModal(): void {
    this.isFollowModalOpen.set(false);
    this.followModalList.set([]);
  }

  private async loadFollowList(tab: 'following' | 'followers'): Promise<void> {
    const uid = this.targetUserId;
    if (!uid) return;
    try {
      const list = tab === 'following'
        ? await this.api.users.following(uid)
        : await this.api.users.followers(uid);

      const enriched = await Promise.all(
        list.map(async (u) => {
          let isFollowingUser = false;
          if (this.currentUserId) {
            if (tab === 'followers') {
              try {
                const status = await this.api.users.followStatus(u.id, this.currentUserId);
                isFollowingUser = status.isFollowing;
              } catch { /* ignore */ }
            } else {
              // 팔로잉 탭: 해당 유저가 나인지 아닌지에 따라 달리 처리
              if (u.id === this.currentUserId) {
                isFollowingUser = true;
              } else {
                try {
                  const status = await this.api.users.followStatus(u.id, this.currentUserId);
                  isFollowingUser = status.isFollowing;
                } catch { /* ignore */ }
              }
            }
          }
          return { ...u, isFollowing: isFollowingUser };
        }),
      );
      this.followModalList.set(enriched);
    } catch {
      this.followModalList.set([]);
    }
  }

  async toggleFollowInModal(targetId: number): Promise<void> {
    if (!this.currentUserId) {
      this.router.navigate(['/login']);
      return;
    }
    try {
      const result = await this.api.users.toggleFollow(targetId, this.currentUserId);

      // 타인 프로필이므로 목록에서 제거하지 않고 상태만 업데이트 (인스타 방식)
      this.followModalList.set(
        this.followModalList().map(u =>
          u.id === targetId ? { ...u, isFollowing: result.followed } : u
        )
      );

      // 카운트 갱신
      const counts = await this.api.users.followCounts(this.targetUserId);
      this.followerCount.set(counts.followerCount);
      this.followingCount.set(counts.followingCount);
    } catch {
      console.error('팔로우 토글 실패');
    }
  }

  getInitial(nickname: string): string {
    return nickname ? nickname.charAt(0).toUpperCase() : '?';
  }

  // ===== 모바일 팔로우 취소 바텀시트 =====
  unfollowSheetOpen = signal(false);
  unfollowSheetTargetId = signal<number | null>(null);

  openUnfollowSheet(userId: number): void {
    this.unfollowSheetTargetId.set(userId);
    this.unfollowSheetOpen.set(true);
  }

  closeUnfollowSheet(): void {
    this.unfollowSheetOpen.set(false);
    this.unfollowSheetTargetId.set(null);
  }

  async confirmUnfollow(): Promise<void> {
    const targetId = this.unfollowSheetTargetId();
    if (!targetId) return;
    this.closeUnfollowSheet();
    await this.toggleFollowInModal(targetId);
  }
}
