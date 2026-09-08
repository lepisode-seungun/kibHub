import { Component, OnInit, OnDestroy, inject, signal, computed, effect, ChangeDetectorRef, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ImageViewerComponent } from '../../components/image-viewer/image-viewer.component';
import { ApiService } from '../../services/api.service';

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

  private mobileCommentEffect = effect(() => {
    const isOpen = this.isMobileCommentOpen();
    if (typeof document !== 'undefined') {
      document.body.style.overflow = isOpen ? 'hidden' : '';
    }
  });
  commentMode = signal<'general' | 'feedback'>('general');
  markersVisible = signal(true);
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

  comments: any[] = [];

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
        this.authorRole = (content.author as any)?.role || '';
        this.authorProfileImage = (content.author as any)?.profileImage || '';
        this.authorInitial = (content.author as any)?.initial || (this.authorName || 'U').charAt(0).toUpperCase();
        this.authorId = (content.author as any)?.id || 0;
        if (this.currentUserId() && this.authorId) {
          this.isOwnContent.set(this.currentUserId() === this.authorId);
          if (!this.isOwnContent()) {
            this.api.users.followStatus(this.authorId, this.currentUserId()).then(res => {
              this.isFollowing.set(res.isFollowing);
            }).catch(() => {});
          }
        }
        this.category = content.category?.name || '미분류';
        this.dateStr = new Date(content.createdAt).toLocaleString('ko-KR');
        this.commentCount = (content as any)._count?.comments || (content as any).comments?.length || 0;

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
        this.comments = serverComments.map((c: any) => {
          return {
            id: c.id,
            authorId: c.author?.id || 0,
            userName: c.author?.nickname || c.author?.name || '익명',
            avatar: (c.author?.nickname || c.author?.name || 'U').charAt(0),
            profileImage: c.author?.profileImage || '',
            markerNum: c.markerNum ?? null,
            markerTop: c.markerTop ?? null,
            markerLeft: c.markerLeft ?? null,
            isMe: c.author?.id === this.currentUserId(),
            isActive: false,
            type: (c.type || 'general') as 'feedback' | 'general',
            content: c.body,
            time: this.timeAgo(new Date(c.createdAt)),
            likes: c.likeCount || 0, liked: (c.likes?.length || 0) > 0,
            replyCount: c.replies?.length || 0,
            replies: (c.replies || []).map((r: any) => ({
              id: r.id,
              authorId: r.author?.id || 0,
              userName: r.author?.nickname || r.author?.name || '익명',
              avatar: (r.author?.nickname || r.author?.name || 'U').charAt(0),
              profileImage: r.author?.profileImage || '',
              markerNum: r.markerNum ?? null,
              markerTop: r.markerTop ?? null,
              markerLeft: r.markerLeft ?? null,
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
          const addMarker = (c: any) => {
            if (c.markerNum && c.markerTop != null) {
              const idx = c.markerImageIndex ?? 0;
              if (idx < this.images.length) {
                this.images[idx].markers.push({ rank: c.markerNum, top: c.markerTop, left: c.markerLeft, commentId: c.id });
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
            if (contents.some((ac: any) => ac.contentId === contentId || ac.content?.id === contentId)) {
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
  }

  goBack(): void {
    this.router.navigate(['/']);
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

  async toggleLike(target: any): Promise<void> {
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
      if (!this.isSidebarOpen()) {
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
    let target = this.comments.find(c => c.markerNum === rank);
    let scrollTargetId = target ? `comment-${target.id}` : '';
    let isReply = false;

    // 대댓글에서 찾기
    if (!target) {
      for (const c of this.comments) {
        const reply = (c.replies || []).find((r: any) => r.markerNum === rank);
        if (reply) {
          scrollTargetId = `comment-${reply.id}`;
          isReply = true;
          break;
        }
      }
      // 대댓글 추적 시 모든 댓글 호버링 해제
      if (isReply) {
        this.comments.forEach(c => c.isActive = false);
      }
    }

    if (!scrollTargetId) return;

    if (!isReply && target) {
      // 최상위 댓글 토글
      if (target.isActive && scrollTargetId === `comment-${target.id}`) {
        target.isActive = false;
      } else {
        this.comments.forEach(c => c.isActive = false);
        target.isActive = true;
        setTimeout(() => {
          const el = document.getElementById(scrollTargetId);
          el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    } else {
      // 대댓글: 스크롤 + flash highlight
      setTimeout(() => {
        const el = document.getElementById(scrollTargetId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('marker-flash');
          setTimeout(() => el.classList.remove('marker-flash'), 1500);
        }
      }, 100);
    }
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
      } as any);
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
        ...(isFeedback && pm ? { markerNum: currentMarkerNum!, markerTop: pm.top, markerLeft: pm.left, markerImageIndex: pm.imageIndex } : {}),
      });
      
      const newEntry: any = {
        id: created.id,
        userName: this.currentUserName() || '나',
        avatar: this.currentUserAvatar() || 'N',
        profileImage: this.currentUserProfileImage() || '',
        isMe: true,
        content: created.body,
        time: '방금 전',
        likes: 0,
        liked: false,
        imageUrls: serverImageUrls.length > 0 ? serverImageUrls : localPreviews,
      };

      if (replyTarget) {
        // 답글 모드: 해당 댓글의 replies에 추가
        newEntry.type = (isFeedback ? 'feedback' : 'general') as 'feedback' | 'general';
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
              markers: [...this.images[idx].markers, { rank: currentMarkerNum!, top: pm.top, left: pm.left, commentId: created.id }]
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
        // 일반 댓글
        newEntry.markerNum = currentMarkerNum;
        newEntry.isActive = false;
        newEntry.type = (isFeedback ? 'feedback' : 'general') as 'feedback' | 'general';
        newEntry.replyCount = 0;
        newEntry.replies = [];

        // 피드백 마커 위치 저장
        if (isFeedback && pm) {
          newEntry.markerTop = pm.top;
          newEntry.markerLeft = pm.left;
          newEntry.markerImageIndex = pm.imageIndex;
          // 이미지에 영구 마커 추가 (immutable update로 Angular 감지)
          const idx = pm.imageIndex;
          if (idx < this.images.length) {
            this.images[idx] = {
              ...this.images[idx],
              markers: [...this.images[idx].markers, { rank: currentMarkerNum!, top: pm.top, left: pm.left, commentId: created.id }]
            };
            this.images = [...this.images];
          }
        }

        this.comments = [newEntry, ...this.comments];
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
            if (comment.replies?.some((r: any) => r.id === target.id)) {
              comment.replies = comment.replies.filter((r: any) => r.id !== target.id);
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
            const reply = comment.replies?.find((r: any) => r.id === commentId);
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
      
      const cats = albums.map((a: any) => {
        const contents = a.albumContents || [];
        const isInAlbum = contents.some((ac: any) => ac.contentId === contentId || ac.content?.id === contentId);
        const thumbs = contents.slice(0, 4).map((ac: any) => ac.content?.thumbnail).filter(Boolean);
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
  }

  onEditCategoryNameInput(event: Event): void {
    this.editingCategoryName.set((event.target as HTMLInputElement).value);
  }

  cancelRenameCategory(): void {
    this.editingCategoryId.set(null);
    this.editingCategoryName.set('');
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
}
