import { Component, computed, effect, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ImageViewerComponent } from '../../components/image-viewer/image-viewer.component';

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

  /* Mock data — 나중에 API로 교체 */
  contentId = '';
  authorName = '고뚱이고뚱이고뚱이';
  authorRole = '강사';
  title = '크리스마스 트리가 있는 녹차밭 제목 30자 이내로 제한';
  description = '크리스마스 트리가 있는 녹차밭을 그려봤어요. 얼씨구 절씨구 ! 크리스마스 트리가 있는 녹차밭을 그려봤어요. 크리스마스 트리가 있는 녹차밭을 그려봤어요. 얼씨구 절씨구 ! 크리스마스 트리가 있는 녹차밭을 그려봤어요. 크리스마스 트리가 있는 녹차밭을 그려봤어요. 얼씨구 절씨구 ! 크리스마스 트리가 있는 녹차밭을 그려봤어요.';
  category = '카테고리명';
  bookmarkCount = 314;
  commentCount = 30;
  dateStr = '2024. 7. 10 13:23';
  isBookmarked = signal(false);
  isDescOpen = signal(false);
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
  isLoggedIn = this.authService.isLoggedIn;
  pendingMarker = signal<{top: number; left: number} | null>(null);
  commentText = '';

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

  images = [
    { gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', markers: [{rank: 1, top: 33, left: 33}, {rank: 2, top: 83, left: 562}, {rank: 3, top: 433, left: 882}] },
    { gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', markers: [{rank: 4, top: 92, left: 571}, {rank: 5, top: 442, left: 891}] },
  ];

  comments = [
    {
      id: 1, userName: '고식혜', avatar: 'N', markerNum: 1, isMe: true, isActive: false, type: 'feedback' as const,
      content: '피드백 댓글 내용 피드백 댓글 내용 피드백 댓글 내용 피드백 댓글 내용 피드백 댓글 내용 피드백 댓글 내용 피드백 댓글 내용',
      time: '3시간 전', likes: 30, liked: true, replyCount: 30,
      replies: [
        { id: 11, userName: '고식혜', avatar: 'N', isMe: true,
          content: '피드백 댓글 내용 피드백 댓글 내용 피드백 댓글 내용 피드백 댓글 내용 피드백 댓글 내용 피드백 댓글 내용 피드백 댓글 내용',
          time: '3시간 전', likes: 30, liked: false, images: 5 },
        { id: 12, userName: '고식혜', avatar: 'N', isMe: true,
          content: '피드백 댓글 내용 피드백 댓글 내용 피드백 댓글 내용 피드백 댓글 내용 피드백 댓글 내용 피드백 댓글 내용 피드백 댓글 내용',
          time: '3시간 전', likes: 30, liked: false, images: 5 },
      ]
    },
    {
      id: 2, userName: '고식혜', avatar: 'N', markerNum: 2, isMe: true, isActive: true, type: 'feedback' as const,
      content: '피드백 댓글 내용 피드백 댓글 내용 피드백 댓글 내용 피드백 댓글 내용 피드백 댓글 내용 피드백 댓글 내용 피드백 댓글 내용',
      time: '3시간 전', likes: 30, liked: false, replyCount: 30, replies: []
    },
    {
      id: 4, userName: '고식혜', avatar: 'N', markerNum: null, isMe: true, isActive: false, type: 'general' as const,
      content: '색감이 정말 좋네요! 톤앤매너가 잘 맞는 것 같아요.',
      time: '5시간 전', likes: 8, liked: false, replyCount: 0, replies: []
    },
    {
      id: 3, userName: '고식혜', avatar: 'N', markerNum: 3, isMe: false, isActive: false, type: 'feedback' as const,
      content: '배경의 그라데이션 처리가 인상적입니다. 어떤 브러시를 사용하셨나요?',
      time: '1일 전', likes: 5, liked: false, replyCount: 2, replies: []
    },
  ];

  get filteredComments() {
    const tab = this.activeCommentTab();
    if (tab === 'all') return this.comments;
    return this.comments.filter(c => c.type === tab);
  }

  get feedbackCount() { return this.comments.filter(c => c.type === 'feedback').length; }
  get generalCount() { return this.comments.filter(c => c.type === 'general').length; }
  get allCount() { return this.comments.length; }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.contentId = params['id'] || '1';
    });
    document.body.classList.add('page-content-detail');
  }

  ngOnDestroy(): void {
    document.body.classList.remove('page-content-detail');
    document.body.style.overflow = '';
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  toggleBookmark(): void {
    if (!this.isLoggedIn()) {
      this.isLoginRequiredModalOpen.set(true);
      return;
    }
    if (this.isBookmarked()) {
      // 이미 추가된 상태면 해제
      this.isBookmarked.set(false);
    } else {
      // 미추가 상태면 모달 열기 (버튼 상태는 아직 변경 안 함)
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

  exitCommentMode(): void {
    this.commentMode.set('general');
    this.pendingMarker.set(null);
  }

  onImageClick(event: Event): void {
    if (this.commentMode() !== 'feedback') return;
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    if (event instanceof MouseEvent) {
      const top = event.clientY - rect.top;
      const left = event.clientX - rect.left;
      this.pendingMarker.set({ top, left });
    } else {
      this.pendingMarker.set({ top: rect.height / 2, left: rect.width / 2 });
    }
  }

  get nextMarkerNum(): number {
    const nums = this.comments.filter(c => c.markerNum).map(c => c.markerNum as number);
    return nums.length > 0 ? Math.max(...nums) + 1 : 1;
  }

  /* 신고 모달 */
  isReportModalOpen = signal(false);
  reportType = signal<'content' | 'comment'>('content');
  reportText = '';

  /* 로그인 필요 모달 */
  isLoginRequiredModalOpen = signal(false);

  openReportModal(): void {
    if (!this.isLoggedIn()) {
      this.isLoginRequiredModalOpen.set(true);
      return;
    }
    this.reportType.set('content');
    this.isReportModalOpen.set(true);
  }

  openCommentReportModal(): void {
    if (!this.isLoggedIn()) {
      this.isLoginRequiredModalOpen.set(true);
      return;
    }
    this.reportType.set('comment');
    this.isReportModalOpen.set(true);
  }

  closeReportModal(): void {
    this.isReportModalOpen.set(false);
    this.reportText = '';
  }

  onReportInput(event: Event): void {
    this.reportText = (event.target as HTMLTextAreaElement).value;
  }

  submitReport(): void {
    if (!this.reportText.trim()) return;
    // 추후 API 연결
    this.closeReportModal();
  }

  /* 원고 뷰어 모달 */
  isViewerOpen = signal(false);
  currentViewerPage = signal(1);
  totalPages = 17;

  manuscriptImages = Array.from({ length: 17 }, (_, i) => ({
    id: i + 1,
    gradient: `linear-gradient(${135 + i * 15}deg, #667eea ${i * 3}%, #764ba2 ${50 + i * 2}%, #f093fb 100%)`,
  }));

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

  confirmDelete(): void {
    const target = this.deleteTargetComment();
    if (target) {
      this.comments = this.comments.filter(c => c.id !== target.id);
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

  saveEdit(commentId: number): void {
    const newText = this.editingCommentText().trim();
    if (newText) {
      this.comments = this.comments.map(c =>
        c.id === commentId ? { ...c, content: newText } : c
      );
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

  openCommentImageViewer(imageCount: number, clickedIndex: number): void {
    const images = Array.from({ length: imageCount }, () =>
      `linear-gradient(135deg, #3F3F46 0%, #52525B 100%)`
    );
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
  /** 현재 편집(삭제) 대상으로 선택된 카테고리 ID Set. 다중 선택 가능 */
  selectedEditIds = signal<Set<number>>(new Set());
  bookmarkCategories = signal<{id: number; name: string; count: number; selected: boolean; visibility: 'public' | 'private'; thumbnail: string}[]>([
    { id: 1, name: '채용 오퍼레이션을 위한', count: 0, selected: false, visibility: 'public', thumbnail: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    { id: 2, name: '채용 오퍼레이션을 위한', count: 0, selected: false, visibility: 'private', thumbnail: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
    { id: 3, name: '채용 오퍼레이션을 위한', count: 0, selected: false, visibility: 'public', thumbnail: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
    { id: 4, name: '채용 오퍼레이션을 위한', count: 0, selected: false, visibility: 'public', thumbnail: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
  ]);
  hasSelectedCategories = computed(() => this.bookmarkCategories().some(c => c.selected));
  newCategoryName = '';

  openBookmarkModal(): void {
    this.isBookmarkModalOpen.set(true);
    document.body.style.overflow = 'hidden';
  }

  closeBookmarkModal(): void {
    this.isBookmarkModalOpen.set(false);
    this.bookmarkSaved.set(false);
    this.selectedEditIds.set(new Set());
    this.newCategoryName = '';
    document.body.style.overflow = '';
  }

  /** 로우 클릭: 카테고리 선택/해제 토글 + 편집 상태 토글 (다중 선택) */
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

  removeBookmarkCategory(id: number, event: Event): void {
    event.stopPropagation();
    this.bookmarkCategories.update(cats => cats.filter(c => c.id !== id));
    this.selectedEditIds.update(ids => {
      const next = new Set(ids);
      next.delete(id);
      return next;
    });
  }

  toggleBookmarkCategory(id: number): void {
    this.bookmarkCategories.update(cats =>
      cats.map(c => c.id === id ? { ...c, selected: !c.selected } : c)
    );
  }

  onNewCategoryInput(event: Event): void {
    this.newCategoryName = (event.target as HTMLInputElement).value;
  }

  addNewCategory(): void {
    const name = this.newCategoryName.trim() || `새 카테고리 ${this.bookmarkCategories().length + 1}`;
    this.bookmarkCategories.update(cats => [
      ...cats,
      { id: Date.now(), name, count: 0, selected: true, visibility: 'public' as const, thumbnail: 'linear-gradient(135deg, #3F3F46, #52525B)' }
    ]);
    this.newCategoryName = '';
  }

  confirmBookmark(): void {
    const selected = this.bookmarkCategories().filter(c => c.selected);
    console.log('책갈피 추가:', selected.map(c => c.name));
    this.bookmarkSaved.set(true);
    this.isBookmarked.set(true);
    this.closeBookmarkModal();
  }

  onBookmarkOverlayClick(event: Event): void {
    if ((event.target as HTMLElement).classList.contains('bm-overlay')) {
      this.closeBookmarkModal();
    }
  }
}
