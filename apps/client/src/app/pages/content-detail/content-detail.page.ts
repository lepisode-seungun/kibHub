import { Component, OnInit, OnDestroy, inject, signal, computed, effect, ChangeDetectorRef, PLATFORM_ID, ViewChild, ElementRef } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ImageViewerComponent } from '../../components/image-viewer/image-viewer.component';
import { ApiService } from '../../services/api.service';
import { Comment } from '@kibhub/shared';

interface ReplyEntry {
  id: number;
  authorId: number;
  userName: string;
  avatar: string;
  profileImage: string;
  markerNum: number | null;
  markerTop: number | null;
  markerLeft: number | null;
  markerImageIndex?: number;
  isMe: boolean;
  type: 'feedback' | 'general';
  content: string;
  time: string;
  likes: number;
  liked: boolean;
  imageUrls: string[];
}

interface CommentEntry extends ReplyEntry {
  isActive: boolean;
  replyCount: number;
  replies: ReplyEntry[];
}

interface AlbumContent {
  contentId?: number;
  content?: { id?: number; thumbnail?: string };
}

@Component({
  selector: 'app-content-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, ImageViewerComponent],
  templateUrl: './content-detail.page.html',
  styleUrl: './content-detail.page.css',
})
export class ContentDetailPage implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  @ViewChild('renameCategoryInput') renameCategoryInputRef?: ElementRef<HTMLInputElement>;
  @ViewChild('newCategoryInput') newCategoryInputRef?: ElementRef<HTMLInputElement>;
  private api = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);

  private platformId = inject(PLATFORM_ID);


  /* 동적 데이터 — API에서 로드 */
  contentId = '';
  authorName = '';
  authorRole = '';
  authorProfileImage = '';
  authorInitial = '';
  authorId = 0;
  title = '';
  description = '';
  category = '';
  bookmarkCount = 0;
  commentCount = 0;
  dateStr = '';
  isBookmarked = signal(false);
  isDescOpen = signal(true);
  activeCommentTab = signal<'feedback' | 'general' | 'all'>('all');
  isSidebarOpen = signal(true);
  isMobileCommentOpen = signal(false);
  isMobileFabVisible = signal(true);
  private composeObserver: IntersectionObserver | null = null;
  private sidebarScrollHandler: (() => void) | null = null;

  private mobileCommentEffect = effect(() => {
    const isOpen = this.isMobileCommentOpen();
    if (typeof document !== 'undefined') {
      // 피드백 모드에서 바텀시트 닫을 때는 스크롤 허용 (이미지 탭 가능하도록)
      document.body.style.overflow = isOpen ? 'hidden' : '';
    }
    if (isOpen) {
      // 바텀시트 열리면 스크롤 가능 여부 체크 후 FAB 표시 결정
      setTimeout(() => {
        this.checkCommentScrollable();
        this.setupComposeObserver();
      }, 150);
    } else {
      this.isMobileFabVisible.set(false);
      this.teardownComposeObserver();
    }
  });
  commentMode = signal<'general' | 'feedback'>('general');
  markersVisible = signal(true);
  isFloatingMenuOpen = signal(true);
  hoveredCommentId = signal<number | null>(null);
  isLoggedIn = this.authService.isLoggedIn;
  currentUserName = signal('');  
  currentUserAvatar = signal('');  
  currentUserProfileImage = signal('');
  currentUserId = signal(0);
  isFollowing = signal(false);
  isOwnContent = signal(false);
  pendingMarker = signal<{top: number; left: number; imageIndex: number} | null>(null);
  commentText = '';
  attachedImages = signal<{ file: File; preview: string }[]>([]);
  private readonly MAX_IMAGES = 5;
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  replyingTo = signal<{ id: number; userName: string } | null>(null);

  /* 콘텐츠 번역 드롭다운 */
  isTranslateOpen = signal(false);
  selectedLang = signal<'ko' | 'en'>('ko');

  /* 모바일 번역 하단 시트 */
  isTranslateSheetOpen = signal(false);

  toggleTranslateDropdown(): void {
    if (!this.isLoggedIn()) {
      return;
    }
    this.isTranslateOpen.update(v => !v);
  }

  openTranslateSheet(): void {
    if (!this.isLoggedIn()) {
      this.isLoginRequiredModalOpen.set(true);
      return;
    }
    this.isTranslateSheetOpen.set(true);
  }

  closeTranslateSheet(): void {
    this.isTranslateSheetOpen.set(false);
  }

  selectLang(lang: 'ko' | 'en'): void {
    this.selectedLang.set(lang);
    this.isTranslateOpen.set(false);
    this.isTranslateSheetOpen.set(false);
  }

  /* 사이드바 헤더 번역 */
  isSidebarTranslateOpen = signal(false);
  selectedSidebarLang = signal<'ko' | 'en'>('ko');

  toggleSidebarTranslate(): void {
    this.isFilterTranslateOpen.set(false);
    this.isSidebarTranslateOpen.update(v => !v);
  }

  selectSidebarLang(lang: 'ko' | 'en'): void {
    this.selectedSidebarLang.set(lang);
    this.isSidebarTranslateOpen.set(false);
  }

  /* 필터 바 번역 */
  isFilterTranslateOpen = signal(false);

  toggleFilterTranslate(): void {
    this.isSidebarTranslateOpen.set(false);
    this.isFilterTranslateOpen.update(v => !v);
  }

  selectFilterLang(lang: 'ko' | 'en'): void {
    this.selectedSidebarLang.set(lang);
    this.isFilterTranslateOpen.set(false);
  }

  /* 공유 모달 */
  isShareModalOpen = signal(false);
  shareUrl = 'https://kiphub.lepisode.team/home';
  isLinkCopied = signal(false);

  openShareModal(): void {
    this.isShareModalOpen.set(true);
    this.isLinkCopied.set(false);
  }

  copyLink(): void {
    navigator.clipboard.writeText(this.shareUrl);
    this.isLinkCopied.set(true);
    setTimeout(() => this.isLinkCopied.set(false), 2000);
  }

  images: { gradient: string; markers: { rank: number; top: number; left: number; commentId?: number }[] }[] = [];

  comments: CommentEntry[] = [];

  get filteredComments() {
    const tab = this.activeCommentTab();
    let list = tab === 'all' ? this.comments : this.comments.filter(c => c.type === tab);
    if (!this.isLoggedIn()) {
      list = list.slice(0, 2);
    }
    return list;
  }

  get feedbackCount() { return this.comments.filter(c => c.type === 'feedback').length; }
  get generalCount() { return this.comments.filter(c => c.type === 'general').length; }
  get allCount() { return this.comments.length; }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.route.params.subscribe(params => {
        this.contentId = params['id'] || '1';
        this.loadContent(Number(this.contentId));
      });
      document.body.classList.add('page-content-detail');
    }
  }

  private async loadContent(id: number): Promise<void> {
    try {
      // 로그인 상태면 유저 정보도 병렬 호출, 비로그인이면 스킵
      const isLoggedIn = this.isLoggedIn();
      const [meResult, contentResult, commentsResult] = await Promise.allSettled([
        isLoggedIn ? this.api.users.me() : Promise.reject('not logged in'),
        this.api.contents.findOne(id),
        this.api.comments.findByContent(id),
      ]);

      // 유저 정보
      if (meResult.status === 'fulfilled') {
        const me = meResult.value;
        const name = me.nickname || me.name || '';
        this.currentUserName.set(name);
        this.currentUserAvatar.set(name.charAt(0));
        this.currentUserProfileImage.set(me.profileImage || '');
        this.currentUserId.set(me.id);
      }

      // 콘텐츠 정보
      if (contentResult.status === 'fulfilled') {
        const content = contentResult.value;
        this.title = content.title;
        this.description = content.body || '';
        this.authorName = content.author?.nickname || content.author?.name || '작성자';
        this.authorRole = content.author?.role || '';
        this.authorProfileImage = content.author?.profileImage || '';
        this.authorInitial = (content.author?.nickname || content.author?.name || 'U').charAt(0).toUpperCase();
        this.authorId = content.author?.id || 0;
        if (this.currentUserId() && this.authorId) {
          this.isOwnContent.set(this.currentUserId() === this.authorId);
          if (!this.isOwnContent()) {
            this.api.users.followStatus(this.authorId, this.currentUserId()).then(res => {
              this.isFollowing.set(res.isFollowing);
            }).catch(() => { /* 팔로우 상태 확인 실패 무시 */ });
          }
        }
        this.category = content.category?.name || '미분류';
        this.dateStr = new Date(content.createdAt).toLocaleString('ko-KR');
        this.commentCount = content._count?.comments || 0;

        const imageList: typeof this.images = [];
        if (content.thumbnail) {
          imageList.push({ gradient: `url(${content.thumbnail}) center/cover no-repeat`, markers: [] });
        }
        if (content.images && content.images.length > 0) {
          for (const imgUrl of content.images) {
            imageList.push({ gradient: `url(${imgUrl}) center/cover no-repeat`, markers: [] });
          }
        }
        if (imageList.length === 0) {
          imageList.push({ gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', markers: [] });
        }
        this.images = imageList;
      }

      // 콘텐츠+이미지 데이터가 도착하면 즉시 렌더링
      this.cdr.detectChanges();

      // 댓글
      if (commentsResult.status === 'fulfilled') {
        const serverComments = commentsResult.value;
        this.comments = serverComments.map((c: Comment & { replies?: Comment[]; likes?: unknown[]; type?: string; markerNum?: number; markerTop?: number; markerLeft?: number; markerImageIndex?: number }) => {
          return {
            id: c.id,
            authorId: c.author?.id || 0,
            userName: c.author?.nickname || c.author?.name || '익명',
            avatar: (c.author?.nickname || c.author?.name || 'U').charAt(0),
            profileImage: c.author?.profileImage || '',
            markerNum: c.markerNum ?? null,
            markerTop: c.markerTop ?? null,
            markerLeft: c.markerLeft ?? null,
            markerImageIndex: c.markerImageIndex ?? 0,
            isMe: c.author?.id === this.currentUserId(),
            isActive: false,
            type: (c.type || 'general') as 'feedback' | 'general',
            content: c.body,
            time: this.timeAgo(new Date(c.createdAt)),
            likes: c.likeCount || 0, liked: (c.likes?.length || 0) > 0,
            replyCount: c.replies?.length || 0,
            replies: (c.replies || []).map((r: Comment & { likes?: unknown[]; type?: string; markerNum?: number; markerTop?: number; markerLeft?: number; markerImageIndex?: number }) => ({
              id: r.id,
              authorId: r.author?.id || 0,
              userName: r.author?.nickname || r.author?.name || '익명',
              avatar: (r.author?.nickname || r.author?.name || 'U').charAt(0),
              profileImage: r.author?.profileImage || '',
              markerNum: r.markerNum ?? null,
              markerTop: r.markerTop ?? null,
              markerLeft: r.markerLeft ?? null,
              markerImageIndex: r.markerImageIndex ?? 0,
              isMe: r.author?.id === this.currentUserId(),
              type: (r.type || 'general') as 'feedback' | 'general',
              content: r.body,
              time: this.timeAgo(new Date(r.createdAt)),
              likes: r.likeCount || 0, liked: (r.likes?.length || 0) > 0,
              imageUrls: r.images || [],
            })),
            imageUrls: c.images || [],
          };
        });
        this.commentCount = this.comments.length;

        // 이미지에 영구 마커 복원 (댓글 + 대댓글 모두, 이미지별 분배)
        if (this.images.length > 0) {
          // 각 이미지의 마커 배열 초기화
          for (const img of this.images) {
            img.markers = [];
          }
          const addMarker = (c: CommentEntry | ReplyEntry) => {
            if (c.markerNum && c.markerTop != null) {
              const idx = c.markerImageIndex ?? 0;
              if (idx < this.images.length) {
                this.images[idx].markers.push({ rank: c.markerNum, top: c.markerTop ?? 0, left: c.markerLeft ?? 0, commentId: c.id });
              }
            }
          };
          for (const c of this.comments) {
            addMarker(c);
            for (const r of (c.replies || [])) {
              addMarker(r);
            }
          }
        }
      }

      // 댓글까지 렌더링
      this.cdr.detectChanges();

      // 책갈피 상태 확인 (로그인 시에만, 별도 실행)
      if (this.isLoggedIn()) {
        try {
          const albums = await this.api.albums.findAll('BOOKMARK');
          const contentId = id;
          const ids: number[] = [];
          for (const a of albums) {
            const contents = a.albumContents || [];
            if (contents.some((ac: AlbumContent) => ac.contentId === contentId || ac.content?.id === contentId)) {
              ids.push(a.id);
            }
          }
          this.bookmarkedAlbumIds = ids;
          this.isBookmarked.set(ids.length > 0);
        } catch { /* ignore */ }
      }
    } catch (e) {
      console.error('콘텐츠 로드 실패:', e);
    } finally {
      this.cdr.detectChanges();
    }
  }

  private timeAgo(date: Date): string {
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}분 전`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}시간 전`;
    const days = Math.floor(hours / 24);
    return `${days}일 전`;
  }

  ngOnDestroy(): void {
    document.body.classList.remove('page-content-detail');
    document.body.style.overflow = '';
    this.teardownComposeObserver();
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  /** CSS 브레이크포인트(768px)와 동일하게 모바일 여부 판단 */
  private isMobileView(): boolean {
    return typeof window !== 'undefined' && window.innerWidth <= 768;
  }

  async toggleBookmark(): Promise<void> {
    if (!this.isLoggedIn()) {
      this.isLoginRequiredModalOpen.set(true);
      return;
    }
    if (this.isBookmarked()) {
      // 이미 추가된 상태면 모든 앨범에서 제거
      const contentId = Number(this.contentId);
      for (const albumId of this.bookmarkedAlbumIds) {
        try {
          await this.api.albums.removeContent(albumId, contentId);
        } catch { /* ignore */ }
      }
      this.bookmarkedAlbumIds = [];
      this.isBookmarked.set(false);
    } else {
      // 미추가 상태면 모달 열기
      this.openBookmarkModal();
    }
  }

  toggleDesc(): void {
    this.isDescOpen.update(v => !v);
  }

  setCommentTab(tab: 'feedback' | 'general' | 'all'): void {
    this.activeCommentTab.set(tab);
  }

  onCommentInput(event: Event): void {
    this.commentText = (event.target as HTMLTextAreaElement).value;
  }

  startReply(comment: { id: number; userName: string }): void {
    if (this.replyingTo()?.id === comment.id) {
      // 같은 댓글 다시 클릭 → 닫기 + 초기화
      this.cancelReply();
      return;
    }
    this.replyingTo.set(comment);
    this.commentText = '';
    this.attachedImages().forEach(img => URL.revokeObjectURL(img.preview));
    this.attachedImages.set([]);
    this.commentMode.set('general');
  }

  cancelReply(): void {
    this.replyingTo.set(null);
    this.commentText = '';
    this.attachedImages().forEach(img => URL.revokeObjectURL(img.preview));
    this.attachedImages.set([]);
  }

  async toggleLike(target: CommentEntry | ReplyEntry): Promise<void> {
    if (!this.isLoggedIn()) return;
    // 낙관적 업데이트: 즉시 UI 반영
    const prevLiked = target.liked;
    const prevLikes = target.likes;
    target.liked = !prevLiked;
    target.likes = prevLiked ? Math.max(0, prevLikes - 1) : prevLikes + 1;
    try {
      const result = await this.api.comments.toggleLike(target.id);
      // 서버 실제 값으로 보정
      target.liked = result.liked;
      target.likes = result.likeCount;
    } catch (e) {
      // 실패 시 롤백
      target.liked = prevLiked;
      target.likes = prevLikes;
      console.error('좋아요 실패:', e);
    }
  }

  /** 숨겨진 file input 트리거 */
  triggerImageInput(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = (e) => this.onImagesSelected(e);
    input.click();
  }

  /** 파일 선택 후 유효성 검증 + 프리뷰 생성 */
  onImagesSelected(event: Event): void {
    const files = (event.target as HTMLInputElement).files;
    if (!files) return;

    const current = this.attachedImages();
    const remaining = this.MAX_IMAGES - current.length;
    if (remaining <= 0) {
      alert('이미지는 최대 5장까지 첨부 가능합니다.');
      return;
    }

    const newFiles: { file: File; preview: string }[] = [];
    for (let i = 0; i < Math.min(files.length, remaining); i++) {
      const file = files[i];
      if (file.size > this.MAX_FILE_SIZE) {
        alert(`${file.name}: 이미지당 최대 용량은 10MB입니다.`);
        continue;
      }
      if (!file.type.startsWith('image/')) continue;
      newFiles.push({ file, preview: URL.createObjectURL(file) });
    }

    if (files.length > remaining) {
      alert(`이미지는 최대 5장까지 첨부 가능합니다. ${remaining}장만 추가되었습니다.`);
    }

    this.attachedImages.set([...current, ...newFiles]);
  }

  /** 첨부 이미지 제거 */
  removeAttachedImage(index: number): void {
    const current = this.attachedImages();
    URL.revokeObjectURL(current[index].preview);
    this.attachedImages.set(current.filter((_, i) => i !== index));
  }

  toggleSidebar(): void {
    this.isSidebarOpen.update(v => !v);
  }

  openDropdownId = signal<number | null>(null);

  toggleDropdown(commentId: number, event: Event): void {
    event.stopPropagation();
    this.openDropdownId.update(v => v === commentId ? null : commentId);
  }

  closeDropdown(): void {
    this.openDropdownId.set(null);
  }

  toggleCommentMode(): void {
    if (this.commentMode() === 'feedback') {
      this.commentMode.set('general');
      this.pendingMarker.set(null);
    } else {
      this.commentMode.set('feedback');
      // 모바일에서만: 마커 찍을 수 있도록 바텀시트 닫기
      if (this.isMobileView() && this.isMobileCommentOpen()) {
        this.isMobileCommentOpen.set(false);
      }
    }
  }

  enterFeedbackMode(): void {
    if (!this.isLoggedIn()) {
      this.isLoginRequiredModalOpen.set(true);
      return;
    }
    this.commentMode.set('feedback');
    if (!this.isSidebarOpen()) {
      this.isSidebarOpen.set(true);
    }
  }

  toggleFeedbackMode(): void {
    if (!this.isLoggedIn()) {
      this.isLoginRequiredModalOpen.set(true);
      return;
    }
    if (this.commentMode() === 'feedback') {
      this.commentMode.set('general');
      this.pendingMarker.set(null);
    } else {
      this.commentMode.set('feedback');
      // 모바일에서만: 마커 찍을 수 있도록 바텀시트 닫기
      if (this.isMobileView() && this.isMobileCommentOpen()) {
        this.isMobileCommentOpen.set(false);
      } else if (!this.isSidebarOpen()) {
        this.isSidebarOpen.set(true);
      }
    }
  }

  async toggleFollow(): Promise<void> {
    if (!this.isLoggedIn()) {
      this.isLoginRequiredModalOpen.set(true);
      return;
    }
    if (this.isOwnContent() || !this.authorId) return;
    try {
      const result = await this.api.users.toggleFollow(this.authorId, this.currentUserId());
      this.isFollowing.set(result.followed);
    } catch {
      // 에러 무시
    }
  }

  exitCommentMode(): void {
    this.commentMode.set('general');
    this.pendingMarker.set(null);
  }



  onImageFrameClick(event: Event, imageIndex: number): void {
    if (this.commentMode() === 'feedback') {
      event.stopPropagation();
      event.preventDefault();
      const frame = (event.target as HTMLElement).closest('.detail-image') || event.currentTarget as HTMLElement;
      if (!frame) return;
      const rect = frame.getBoundingClientRect();
      if (event instanceof MouseEvent) {
        const top = ((event.clientY - rect.top) / rect.height) * 100;
        const left = ((event.clientX - rect.left) / rect.width) * 100;
        this.pendingMarker.set({ top, left, imageIndex });
      } else {
        this.pendingMarker.set({ top: 50, left: 50, imageIndex });
      }
      // 모바일에서만: 마커 찍히면 잠시 후 바텀시트 다시 열고, 해당 이미지를 보이도록 스크롤
      if (this.isMobileView() && !this.isMobileCommentOpen()) {
        setTimeout(() => {
          this.isMobileCommentOpen.set(true);
          // DOM 업데이트 후 마커가 찍힌 이미지를 바텀시트 위로 스크롤
          setTimeout(() => {
            const imageFrames = document.querySelectorAll('.detail-image-frame');
            const targetFrame = imageFrames[imageIndex] as HTMLElement;
            if (targetFrame) {
              targetFrame.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }, 200);
        }, 600);
      }
    } else {
      this.openManuscriptViewer(imageIndex);
    }
  }

  get nextMarkerNum(): number {
    const nums: number[] = [];
    for (const c of this.comments) {
      if (c.markerNum) nums.push(c.markerNum);
      for (const r of (c.replies || [])) {
        if (r.markerNum) nums.push(r.markerNum);
      }
    }
    return nums.length > 0 ? Math.max(...nums) + 1 : 1;
  }

  activateMarkerComment(rank: number, event: Event): void {
    event.stopPropagation();

    // 최상위 댓글에서 찾기
    const target = this.comments.find(c => c.markerNum === rank);
    let scrollTargetId = target ? `comment-${target.id}` : '';

    // 대댓글에서 찾기
    if (!target) {
      for (const c of this.comments) {
        const reply = (c.replies || []).find((r: ReplyEntry) => r.markerNum === rank);
        if (reply) {
          scrollTargetId = `comment-${reply.id}`;
          break;
        }
      }
    }

    if (!scrollTargetId) return;

    // 모바일: 댓글 시트가 닫혀있으면 열기
    const needsOpen = !this.isMobileCommentOpen();
    if (needsOpen) {
      this.isMobileCommentOpen.set(true);
    }

    // 스크롤 + 짧은 하이라이트 (시트 열림 대기 후)
    setTimeout(() => {
      const el = document.getElementById(scrollTargetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('marker-flash');
        setTimeout(() => el.classList.remove('marker-flash'), 1500);
      }
    }, needsOpen ? 400 : 100);
  }

  /* 신고 모달 */
  isReportModalOpen = signal(false);
  reportType = signal<'content' | 'comment'>('content');
  reportTargetId = signal<number>(0);
  reportText = '';
  reportSuccess = signal(false);

  /* 로그인 필요 모달 */
  isLoginRequiredModalOpen = signal(false);

  openReportModal(): void {
    if (!this.isLoggedIn()) {
      this.isLoginRequiredModalOpen.set(true);
      return;
    }
    this.reportType.set('content');
    this.reportTargetId.set(Number(this.contentId));
    this.isReportModalOpen.set(true);
  }

  goToEdit(): void {
    this.router.navigate(['/content', this.contentId, 'edit']);
  }

  /* 콘텐츠 삭제 확인 모달 */
  isContentDeleteModalOpen = signal(false);

  /* 토스트 알림 */
  toastVisible = signal(false);
  toastMessage = signal('');

  openContentDeleteModal(): void {
    this.isContentDeleteModalOpen.set(true);
  }

  closeContentDeleteModal(): void {
    this.isContentDeleteModalOpen.set(false);
  }

  private showToast(message: string, duration = 2000): void {
    this.toastMessage.set(message);
    this.toastVisible.set(true);
    setTimeout(() => this.toastVisible.set(false), duration);
  }

  async confirmContentDelete(): Promise<void> {
    try {
      await this.api.contents.delete(Number(this.contentId));
      this.isContentDeleteModalOpen.set(false);
      this.showToast('콘텐츠가 삭제되었습니다.');
      setTimeout(() => this.router.navigate(['/']), 1500);
    } catch (e) {
      console.error('콘텐츠 삭제 실패:', e);
      this.isContentDeleteModalOpen.set(false);
    }
  }

  openCommentReportModal(commentId: number): void {
    if (!this.isLoggedIn()) {
      this.isLoginRequiredModalOpen.set(true);
      return;
    }
    this.reportType.set('comment');
    this.reportTargetId.set(commentId);
    this.isReportModalOpen.set(true);
  }

  closeReportModal(): void {
    this.isReportModalOpen.set(false);
    this.reportText = '';
    this.reportTargetId.set(0);
  }

  onReportInput(event: Event): void {
    this.reportText = (event.target as HTMLTextAreaElement).value;
  }

  async submitReport(): Promise<void> {
    if (!this.reportText.trim()) return;
    try {
      await this.api.reports.create({
        type: this.reportType() === 'comment' ? 'COMMENT' : 'CONTENT',
        targetId: this.reportTargetId(),
        reason: this.reportText.trim(),
      });
      this.closeReportModal();
      this.reportSuccess.set(true);
    } catch (e) {
      console.error('신고 실패:', e);
    }
  }

  /* 원고 뷰어 모달 */
  isViewerOpen = signal(false);
  currentViewerPage = signal(1);

  get totalPages(): number {
    return this.images.length;
  }

  get manuscriptImages(): { gradient: string; markers?: { rank: number; top: number; left: number; commentId?: number }[] }[] {
    const visible = this.markersVisible();
    return this.images.map(img => ({
      gradient: img.gradient,
      markers: visible ? img.markers : [],
    }));
  }

  openManuscriptViewer(imageIndex: number): void {
    if (this.commentMode() === 'feedback') return;
    if (this.isMobileCommentOpen()) return;
    this.currentViewerPage.set(imageIndex + 1);
    this.isViewerOpen.set(true);
  }

  closeViewer(): void {
    this.isViewerOpen.set(false);
  }

  prevPage(): void {
    this.currentViewerPage.update(p => p > 1 ? p - 1 : this.totalPages);
  }

  nextPage(): void {
    this.currentViewerPage.update(p => p < this.totalPages ? p + 1 : 1);
  }

  onViewerOverlayClick(event: Event): void {
    if ((event.target as HTMLElement).classList.contains('viewer-overlay')) {
      this.closeViewer();
    }
  }

  /* 댓글 삭제 모달 */
  isDeleteModalOpen = signal(false);
  deleteTargetComment = signal<{id: number; content: string; time: string} | null>(null);

  openDeleteModal(comment: {id: number; content: string; time: string}): void {
    this.deleteTargetComment.set(comment);
    this.isDeleteModalOpen.set(true);
    this.closeDropdown();
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen.set(false);
    this.deleteTargetComment.set(null);
  }

  async submitComment(): Promise<void> {
    const text = this.commentText.trim();
    if (!text || !this.contentId) return;

    const isFeedback = this.commentMode() === 'feedback';
    if (isFeedback && !this.pendingMarker()) {
      alert('피드백 댓글을 달려면 이미지에 마커를 먼저 찍어주세요.');
      return;
    }
    const currentMarkerNum = isFeedback ? this.nextMarkerNum : null;
    const attached = this.attachedImages();
    const localPreviews = attached.map(a => a.preview);
    const replyTarget = this.replyingTo();

    try {
      // 이미지가 있으면 먼저 업로드
      let serverImageUrls: string[] = [];
      if (attached.length > 0) {
        try {
          const uploaded = await this.api.upload.multiple(attached.map(a => a.file), 'comments');
          serverImageUrls = uploaded.map(u => u.url);
        } catch (uploadErr) {
          console.warn('이미지 업로드 실패:', uploadErr);
        }
      }

      // 댓글/답글 생성
      const pm = this.pendingMarker();
      const created = await this.api.comments.create(Number(this.contentId), {
        body: text,
        ...(serverImageUrls.length > 0 ? { images: serverImageUrls } : {}),
        ...(replyTarget ? { parentId: replyTarget.id } : {}),
        type: isFeedback ? 'feedback' : 'general',
        ...(isFeedback && pm ? { markerNum: currentMarkerNum ?? 0, markerTop: pm.top, markerLeft: pm.left, markerImageIndex: pm.imageIndex } : {}),
      });
      
      const newEntry: ReplyEntry = {
        id: created.id,
        authorId: this.currentUserId(),
        userName: this.currentUserName() || '나',
        avatar: this.currentUserAvatar() || 'N',
        profileImage: this.currentUserProfileImage() || '',
        markerNum: null,
        markerTop: null,
        markerLeft: null,
        isMe: true,
        type: (isFeedback ? 'feedback' : 'general') as 'feedback' | 'general',
        content: created.body,
        time: '방금 전',
        likes: 0,
        liked: false,
        imageUrls: serverImageUrls.length > 0 ? serverImageUrls : localPreviews,
      };

      if (replyTarget) {
        // 답글 모드: 해당 댓글의 replies에 추가
        newEntry.markerNum = currentMarkerNum;

        // 대댓글 피드백 마커 위치 저장
        if (isFeedback && pm) {
          newEntry.markerTop = pm.top;
          newEntry.markerLeft = pm.left;
          newEntry.markerImageIndex = pm.imageIndex;
          const idx = pm.imageIndex;
          if (idx < this.images.length) {
            this.images[idx] = {
              ...this.images[idx],
              markers: [...this.images[idx].markers, { rank: currentMarkerNum ?? 0, top: pm.top, left: pm.left, commentId: created.id }]
            };
            this.images = [...this.images];
          }
        }

        const parent = this.comments.find(c => c.id === replyTarget.id);
        if (parent) {
          parent.replies = [...(parent.replies || []), newEntry];
          parent.replyCount = (parent.replyCount || 0) + 1;
        }
        this.replyingTo.set(null);
      } else {
        // 일반 댓글 → CommentEntry로 확장
        const commentEntry: CommentEntry = {
          ...newEntry,
          markerNum: currentMarkerNum,
          isActive: false,
          replyCount: 0,
          replies: [],
        };

        // 피드백 마커 위치 저장
        if (isFeedback && pm) {
          commentEntry.markerTop = pm.top;
          commentEntry.markerLeft = pm.left;
          commentEntry.markerImageIndex = pm.imageIndex;
          // 이미지에 영구 마커 추가 (immutable update로 Angular 감지)
          const idx = pm.imageIndex;
          if (idx < this.images.length) {
            this.images[idx] = {
              ...this.images[idx],
              markers: [...this.images[idx].markers, { rank: currentMarkerNum ?? 0, top: pm.top, left: pm.left, commentId: created.id }]
            };
            this.images = [...this.images];
          }
        }

        this.comments = [commentEntry, ...this.comments];
      }

      this.commentCount = this.comments.length;
      this.commentText = '';
      if (serverImageUrls.length > 0) {
        localPreviews.forEach(p => URL.revokeObjectURL(p));
      }
      this.attachedImages.set([]);

      // 먼저 이미지 마커가 렌더링되도록 detectChanges
      this.cdr.detectChanges();

      if (isFeedback) {
        // 약간의 딜레이로 pending 마커 제거 (saved 마커가 먼저 렌더링되도록)
        setTimeout(() => {
          this.commentMode.set('general');
          this.pendingMarker.set(null);
          this.cdr.detectChanges();
        }, 50);
      }
    } catch (e) {
      console.error('댓글 작성 실패:', e);
    }
  }

  async confirmDelete(): Promise<void> {
    const target = this.deleteTargetComment();
    if (target) {
      try {
        await this.api.comments.delete(target.id);
        // 최상위 댓글인지 확인
        const isTopLevel = this.comments.some(c => c.id === target.id);
        if (isTopLevel) {
          // 피드백 마커 제거
          const deleted = this.comments.find(c => c.id === target.id);
          if (deleted?.markerNum && this.images.length > 0) {
            const idx = deleted.markerImageIndex ?? 0;
            if (idx < this.images.length) {
              this.images[idx] = {
                ...this.images[idx],
                markers: this.images[idx].markers.filter(m => m.rank !== deleted.markerNum)
              };
              this.images = [...this.images];
            }
          }
          this.comments = this.comments.filter(c => c.id !== target.id);
        } else {
          // 대댓글 삭제: 부모 댓글에서 제거
          for (const comment of this.comments) {
            if (comment.replies?.some((r: ReplyEntry) => r.id === target.id)) {
              comment.replies = comment.replies.filter((r: ReplyEntry) => r.id !== target.id);
              comment.replyCount = Math.max(0, (comment.replyCount || 0) - 1);
              break;
            }
          }
        }
        this.commentCount = this.comments.length;
        this.cdr.detectChanges();
      } catch (e) {
        console.error('댓글 삭제 실패:', e);
      }
    }
    this.closeDeleteModal();
  }

  /* 댓글 수정 모드 */
  editingCommentId = signal<number | null>(null);
  editingCommentText = signal('');

  startEdit(comment: { id: number; content: string }): void {
    this.editingCommentId.set(comment.id);
    this.editingCommentText.set(comment.content);
    this.closeDropdown();
  }

  cancelEdit(): void {
    this.editingCommentId.set(null);
    this.editingCommentText.set('');
  }

  async saveEdit(commentId: number): Promise<void> {
    const newText = this.editingCommentText().trim();
    if (newText) {
      try {
        await this.api.comments.update(commentId, { body: newText });
        // 최상위 댓글 수정
        const topLevel = this.comments.find(c => c.id === commentId);
        if (topLevel) {
          topLevel.content = newText;
        } else {
          // 대댓글 수정
          for (const comment of this.comments) {
            const reply = comment.replies?.find((r: ReplyEntry) => r.id === commentId);
            if (reply) {
              reply.content = newText;
              break;
            }
          }
        }
        this.cdr.detectChanges();
      } catch (e) {
        console.error('댓글 수정 실패:', e);
      }
    }
    this.cancelEdit();
  }

  onEditInput(event: Event): void {
    this.editingCommentText.set((event.target as HTMLTextAreaElement).value);
  }

  /* 댓글 이미지 뷰어 */
  isCommentImageViewerOpen = signal(false);
  commentImageList = signal<string[]>([]);
  commentImageIndex = signal(0);

  openCommentImageViewer(images: string[], clickedIndex: number): void {
    this.commentImageList.set(images);
    this.commentImageIndex.set(clickedIndex);
    this.isCommentImageViewerOpen.set(true);
  }

  closeCommentImageViewer(): void {
    this.isCommentImageViewerOpen.set(false);
  }

  prevCommentImage(): void {
    this.commentImageIndex.update(i => i > 0 ? i - 1 : this.commentImageList().length - 1);
  }

  nextCommentImage(): void {
    this.commentImageIndex.update(i => i < this.commentImageList().length - 1 ? i + 1 : 0);
  }

  /* ===== 책갈피 추가 모달 ===== */
  isBookmarkModalOpen = signal(false);
  bookmarkSaved = signal(false);
  selectedEditIds = signal<Set<number>>(new Set());
  bookmarkCategories = signal<{id: number; name: string; count: number; selected: boolean; visibility: 'public' | 'private'; thumbnails: string[]}[]>([]);
  hasSelectedCategories = computed(() => this.selectedEditIds().size > 0);
  newCategoryName = '';
  /** 현재 콘텐츠가 속한 앨범 ID 목록 (책갈피 해제용) */
  private bookmarkedAlbumIds: number[] = [];

  async openBookmarkModal(): Promise<void> {
    this.isBookmarkModalOpen.set(true);
    document.body.style.overflow = 'hidden';

    try {
      const albums = await this.api.albums.findAll('BOOKMARK');
      const contentId = Number(this.contentId);
      
      const cats = albums.map((a: { id: number; name: string; albumContents?: AlbumContent[]; _count?: { albumContents?: number } }) => {
        const contents = a.albumContents || [];
        const isInAlbum = contents.some((ac: AlbumContent) => ac.contentId === contentId || ac.content?.id === contentId);
        const thumbs = contents.slice(0, 4).map((ac: AlbumContent) => ac.content?.thumbnail).filter((t): t is string => !!t);
        return {
          id: a.id,
          name: a.name,
          count: a._count?.albumContents ?? contents.length,
          selected: isInAlbum,
          visibility: 'public' as const,
          thumbnails: thumbs,
        };
      });
      this.bookmarkCategories.set(cats);
      // 이미 북마크된 앨범을 선택 상태로 설정
      this.selectedEditIds.set(new Set(cats.filter(c => c.selected).map(c => c.id)));
    } catch (e) {
      console.error('앨범 목록 로드 실패:', e);
    }
  }

  closeBookmarkModal(): void {
    this.isBookmarkModalOpen.set(false);
    this.bookmarkSaved.set(false);
    this.selectedEditIds.set(new Set());
    this.newCategoryName = '';
    document.body.style.overflow = '';
  }

  toggleRowEdit(id: number): void {
    this.toggleBookmarkCategory(id);
    this.selectedEditIds.update(ids => {
      const next = new Set(ids);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async removeBookmarkCategory(id: number, event: Event): Promise<void> {
    event.stopPropagation();
    try {
      await this.api.albums.delete(id);
      this.bookmarkCategories.update(cats => cats.filter(c => c.id !== id));
      this.selectedEditIds.update(ids => {
        const next = new Set(ids);
        next.delete(id);
        return next;
      });
    } catch (e) {
      console.error('앨범 삭제 실패:', e);
    }
  }

  toggleBookmarkCategory(id: number): void {
    this.bookmarkCategories.update(cats =>
      cats.map(c => c.id === id ? { ...c, selected: !c.selected } : c)
    );
  }

  onNewCategoryInput(event: Event): void {
    this.newCategoryName = (event.target as HTMLInputElement).value;
  }

  /* 인라인 새 카테고리 추가 */
  isAddingNewCategory = signal(false);

  startAddCategory(): void {
    this.newCategoryName = '';
    this.isAddingNewCategory.set(true);
    setTimeout(() => this.newCategoryInputRef?.nativeElement.focus());
  }

  cancelAddCategory(): void {
    this.isAddingNewCategory.set(false);
    this.newCategoryName = '';
  }

  async confirmAddCategory(): Promise<void> {
    const name = this.newCategoryName.trim();
    if (!name) { this.cancelAddCategory(); return; }
    try {
      const created = await this.api.albums.create({ name, type: 'BOOKMARK' });
      this.bookmarkCategories.update(cats => [
        ...cats,
        { id: created.id, name: created.name, count: 0, selected: true, visibility: 'public' as const, thumbnails: [] }
      ]);
      // 자동 선택 상태로 추가
      this.selectedEditIds.update(ids => {
        const next = new Set(ids);
        next.add(created.id);
        return next;
      });
    } catch (e) {
      console.error('카테고리 생성 실패:', e);
    }
    this.cancelAddCategory();
  }

  /* 인라인 이름 변경 */
  editingCategoryId = signal<number | null>(null);
  editingCategoryName = signal('');

  startRenameCategory(id: number, event: Event): void {
    event.stopPropagation();
    const cat = this.bookmarkCategories().find(c => c.id === id);
    if (!cat) return;
    this.editingCategoryId.set(id);
    this.editingCategoryName.set(cat.name);
    setTimeout(() => this.renameCategoryInputRef?.nativeElement.focus());
  }

  onEditCategoryNameInput(event: Event): void {
    this.editingCategoryName.set((event.target as HTMLInputElement).value);
  }

  cancelRenameCategory(): void {
    this.editingCategoryId.set(null);
    this.editingCategoryName.set('');
  }

  scrollToCompose(): void {
    // 바텀시트가 안 열려있으면 열기
    if (!this.isMobileCommentOpen()) {
      this.isMobileCommentOpen.set(true);
    }
    this.isMobileFabVisible.set(false);

    // DOM 업데이트 후 부드러운 스크롤 (easeInOutCubic)
    setTimeout(() => {
      const sidebar = document.querySelector('.sidebar-wrapper .detail-right') as HTMLElement;
      const compose = sidebar?.querySelector('.comment-compose') as HTMLElement;
      if (sidebar && compose) {
        const targetTop = compose.offsetTop - sidebar.offsetTop;
        const startTop = sidebar.scrollTop;
        const distance = targetTop - startTop;
        const duration = 500; // ms
        let startTime: number | null = null;

        const easeInOutCubic = (t: number) =>
          t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

        const step = (timestamp: number) => {
          if (!startTime) startTime = timestamp;
          const elapsed = timestamp - startTime;
          const progress = Math.min(elapsed / duration, 1);
          sidebar.scrollTop = startTop + distance * easeInOutCubic(progress);
          if (progress < 1) {
            requestAnimationFrame(step);
          } else {
            compose.querySelector('textarea')?.focus();
          }
        };
        requestAnimationFrame(step);
      }
    }, 150);
  }

  async confirmRenameCategory(): Promise<void> {
    const id = this.editingCategoryId();
    const name = this.editingCategoryName().trim();
    if (!id || !name) { this.cancelRenameCategory(); return; }
    try {
      await this.api.albums.update(id, { name });
      this.bookmarkCategories.update(cats =>
        cats.map(c => c.id === id ? { ...c, name } : c)
      );
    } catch (e) {
      console.error('카테고리 이름 변경 실패:', e);
    }
    this.cancelRenameCategory();
  }

  async confirmBookmark(): Promise<void> {
    const contentId = Number(this.contentId);
    const categories = this.bookmarkCategories();
    const editIds = this.selectedEditIds();
    const selected = categories.filter(c => editIds.has(c.id));
    const unselected = categories.filter(c => !editIds.has(c.id));

    try {
      // 선택된 앨범에 콘텐츠 추가
      for (const cat of selected) {
        try {
          await this.api.albums.addContent(cat.id, contentId);
        } catch { /* 이미 추가됨 */ }
      }
      // 선택 해제된 앨범에서 콘텐츠 제거
      for (const cat of unselected) {
        try {
          await this.api.albums.removeContent(cat.id, contentId);
        } catch { /* 이미 제거됨 */ }
      }

      this.bookmarkedAlbumIds = selected.map(c => c.id);
      this.isBookmarked.set(selected.length > 0);
      this.bookmarkSaved.set(true);
      this.closeBookmarkModal();
    } catch (e) {
      console.error('책갈피 저장 실패:', e);
    }
  }

  onBookmarkOverlayClick(event: Event): void {
    if ((event.target as HTMLElement).classList.contains('bm-overlay')) {
      this.closeBookmarkModal();
    }
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  scrollToBottom(): void {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }


  /** 댓글 영역이 스크롤할 만큼 많은지 체크 */
  private checkCommentScrollable(): void {
    const sidebar = document.querySelector('.sidebar-wrapper .detail-right') as HTMLElement;
    if (sidebar) {
      this.isMobileFabVisible.set(sidebar.scrollHeight > sidebar.clientHeight);
    }
  }

  /** 댓글 입력 영역이 보이면 FAB 숨김, 안 보이면 FAB 표시 */
  private setupComposeObserver(): void {
    this.teardownComposeObserver();
    const sidebar = document.querySelector('.sidebar-wrapper .detail-right') as HTMLElement;
    const compose = sidebar?.querySelector('.comment-compose') as HTMLElement;
    if (!sidebar || !compose) return;

    this.composeObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          // 댓글 입력 영역이 보이면 FAB 숨김
          if (entry.isIntersecting) {
            this.isMobileFabVisible.set(false);
          } else {
            // 스크롤 가능한 경우에만 FAB 재표시
            if (sidebar.scrollHeight > sidebar.clientHeight) {
              this.isMobileFabVisible.set(true);
            }
          }
        }
      },
      { root: sidebar, threshold: 0.3 }
    );
    this.composeObserver.observe(compose);
  }

  private teardownComposeObserver(): void {
    if (this.composeObserver) {
      this.composeObserver.disconnect();
      this.composeObserver = null;
    }
    if (this.sidebarScrollHandler) {
      this.sidebarScrollHandler = null;
    }
  }
}
