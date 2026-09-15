import { Component, OnInit, OnDestroy, signal, computed, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { ContentType, Attachment } from '@kibhub/shared';
import Cropper from 'cropperjs';
import { TextEditorComponent } from '../../components/text-editor/text-editor.component';

interface CategoryChip {
  name: string;
  icon: string;
  color: string;
}

interface ContentItem {
  id: number;
  fileName: string;
  size: string;
  thumbnailUrl: string;
  status: 'uploading' | 'done' | 'error';
}

interface ThumbCandidate {
  id: number;
  name: string;
  size: string;
  dataUrl: string;
}

interface ServerAlbumResponse {
  id: number;
  name: string;
  _count?: { albumContents?: number };
  albumContents?: { content?: { thumbnail?: string } }[];
}

@Component({
  selector: 'app-content-upload',
  standalone: true,
  imports: [CommonModule, RouterModule, TextEditorComponent],
  templateUrl: './content-upload.page.html',
  styleUrls: ['./content-upload.page.css'],
})
export class ContentUploadPage implements OnInit, OnDestroy {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);

  contentType = '';

  // 섹션 접기/펼치기
  isDetailOpen = signal(true);
  isContentOpen = signal(true);
  isThumbnailOpen = signal(true);

  // 폼 필드
  scheduleName = '';
  selectedType = signal('웹툰');
  selectedCategory = signal('');
  title = '';
  subDescription = '';
  description = '';

  // 그림 전용 필드
  selectedTools = signal<string[]>([]);
  customTool = '';
  artMedium = '';
  artistNote = '';
  workDuration = '';
  selectedDifficulty = signal<string>('');
  imageResolution = signal('');
  processImages = signal<{ id: number; fileName: string; thumbnailUrl: string; status: 'uploading' | 'done' | 'error' }[]>([]);

  // 웹툰 전용 필드
  selectedGenre = signal<string>('');
  selectedAudience = signal<string>('');
  selectedWebtoonTools = signal<string[]>([]);
  customWebtoonTool = '';
  episodeNumber = '';
  storyboardImages = signal<{ id: number; fileName: string; thumbnailUrl: string; status: 'uploading' | 'done' | 'error' }[]>([]);

  // 글 전용 필드
  selectedWritingGenre = signal<string>('');
  selectedWritingTools = signal<string[]>([]);
  customWritingTool = '';
  referenceUrls = signal<string[]>([]);
  newReferenceUrl = '';
  wordCount = signal(0);
  editorContent = '';
  attachmentFiles = signal<{ id: number; name: string; url: string; size: number; mimeType: string; status: 'uploading' | 'done' | 'error' }[]>([]);

  // 사용 도구 옵션
  toolOptions = ['Photoshop', 'Clip Studio', 'Procreate', 'Illustrator', 'SAI'];
  difficultyOptions = ['초급', '중급', '고급'];
  mediumOptions = ['디지털', '수채화', '유화', '아크릴', '색연필', '연필/목탄'];

  // 웹툰 전용 옵션
  genreOptions = ['로맨스', '액션', '판타지', '일상', '드라마', '스릴러', '공포', '코미디', 'SF', '스포츠'];
  audienceOptions = ['전체', '15세 이상', '성인'];
  webtoonToolOptions = ['Clip Studio', 'Photoshop', 'Procreate', 'Illustrator', 'MediBang', 'SAI'];

  // 글 전용 옵션
  writingGenreOptions = ['에세이', '시나리오', '리뷰', '비평', '칼럼', '소설', '시', '일기', '기타'];
  writingToolOptions = ['Google Docs', 'Notion', 'Word', 'Scrivener', 'Pages', '한글'];

  // 제출 상태
  isSubmitting = signal(false);
  formError = signal('');

  // 수정 모드
  isEditMode = false;
  editContentId = 0;
  categoryError = signal('');
  titleError = signal('');
  subDescError = signal('');
  descError = signal('');
  thumbError = signal('');

  // 타입 목록 (처음 3개)
  types: CategoryChip[] = [
    { name: '웹툰', icon: 'layers', color: '#38C4D1' },
    { name: '그림', icon: 'image', color: '#D37FC8' },
    { name: '글', icon: 'profile', color: '#7B7EDF' },
  ];

  // 카테고리 칩 목록 (서버에서 로드)
  categories = signal<{ id: number; name: string; icon: string; color: string }[]>([]);

  // 콘텐츠 아이템 (실제 업로드된 파일만 표시)
  contentItems = signal<ContentItem[]>([]);

  // 업로드 상태 통계
  uploadingCount = computed(() => this.contentItems().filter(i => i.status === 'uploading').length);
  doneCount = computed(() => this.contentItems().filter(i => i.status === 'done').length);
  errorCount = computed(() => this.contentItems().filter(i => i.status === 'error').length);
  totalCount = computed(() => this.contentItems().length);
  allUploaded = computed(() => this.totalCount() > 0 && this.uploadingCount() === 0);

  // 썸네일 관련
  isThumbModalOpen = signal(false);
  isCropModalOpen = signal(false);
  selectedThumbId = signal<number | null>(null);
  cropImageSrc = signal<string>('');
  croppedThumbnailUrl = signal<string>('');
  selectedFileName = signal<string>('');
  selectedFileSize = signal<string>('');

  // 크롭 후보 리스트
  thumbCandidates = signal<ThumbCandidate[]>([]);
  private thumbCandidateId = 0;

  // 앨범 모달
  isAlbumModalOpen = signal(false);
  albums = signal<{ id: number; name: string; count: number; thumbnails: string[] }[]>([]);
  selectedAlbumId = signal<number | null>(null);
  selectedAlbumName = signal<string>('');

  private cropper: Cropper | null = null;

  @ViewChild('cropImage') cropImageRef!: ElementRef<HTMLImageElement>;
  @ViewChild('thumbFileInput') thumbFileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('titleInput') titleInputRef!: ElementRef<HTMLInputElement>;
  @ViewChild('newAlbumInput') newAlbumInputRef?: ElementRef<HTMLInputElement>;

  private readonly TYPE_MAP: Record<string, string> = {
    webtoon: '웹툰',
    image: '그림',
    text: '글',
  };

  ngOnInit(): void {
    document.body.classList.add('page-content-upload');
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      const type = params.get('type');
      if (id && !type) {
        // content/:id/edit 라우트 → 수정 모드
        this.isEditMode = true;
        this.editContentId = Number(id);
        this.loadContentForEdit(this.editContentId);
      } else {
        // upload/:type 라우트 → 생성 모드
        this.contentType = type || 'webtoon';
        const mapped = this.TYPE_MAP[this.contentType];
        if (mapped) this.selectedType.set(mapped);
      }
    });
    this.loadCategories();
  }

  private async loadContentForEdit(contentId: number): Promise<void> {
    try {
      const content = await this.api.contents.findOne(contentId);
      // 기본 정보 채우기
      this.title = content.title || '';
      this.description = content.body || '';

      // 타입 매핑
      const typeReverseMap: Record<string, string> = {
        WEBTOON: '웹툰', ILLUSTRATION: '그림', WRITING: '글',
      };
      this.selectedType.set(typeReverseMap[content.type] || '웹툰');

      // 카테고리
      if (content.category?.name) {
        this.selectedCategory.set(content.category.name);
      }

      // 썸네일
      if (content.thumbnail) {
        this.croppedThumbnailUrl.set(content.thumbnail);
      }

      // 이미지 목록
      if (content.images && content.images.length > 0) {
        this.contentItems.set(content.images.map((url: string, i: number) => ({
          id: Date.now() + i,
          fileName: `image_${i + 1}`,
          size: '-',
          thumbnailUrl: url,
          status: 'done' as const,
        })));
      }

      // ===== 그림 전용 필드 복원 =====
      if (content.artMedium) {
        this.artMedium = content.artMedium;
      }
      if (content.artTools && content.artTools.length > 0) {
        this.selectedTools.set(content.artTools);
      }
      if (content.artistNote) {
        this.artistNote = content.artistNote;
      }
      if (content.workDuration) {
        this.workDuration = content.workDuration;
      }
      if (content.difficulty) {
        this.selectedDifficulty.set(content.difficulty);
      }
      if (content.resolution) {
        this.imageResolution.set(content.resolution);
      }
      if (content.processImages && content.processImages.length > 0) {
        this.processImages.set(content.processImages.map((url: string, i: number) => ({
          id: Date.now() + 1000 + i,
          fileName: `process_${i + 1}`,
          thumbnailUrl: url,
          status: 'done' as const,
        })));
      }

      // ===== 웹툰 전용 필드 복원 =====
      if (content.webtoonGenre) {
        this.selectedGenre.set(content.webtoonGenre);
      }
      if (content.targetAudience) {
        this.selectedAudience.set(content.targetAudience);
      }
      if (content.webtoonTools && content.webtoonTools.length > 0) {
        this.selectedWebtoonTools.set(content.webtoonTools);
      }
      if (content.episodeNumber) {
        this.episodeNumber = String(content.episodeNumber);
      }
      if (content.storyboardImages && content.storyboardImages.length > 0) {
        this.storyboardImages.set(content.storyboardImages.map((url: string, i: number) => ({
          id: Date.now() + 2000 + i,
          fileName: `storyboard_${i + 1}`,
          thumbnailUrl: url,
          status: 'done' as const,
        })));
      }

      // ===== 글 전용 필드 복원 =====
      if (content.writingGenre) {
        this.selectedWritingGenre.set(content.writingGenre);
      }
      if (content.writingTools && content.writingTools.length > 0) {
        this.selectedWritingTools.set(content.writingTools);
      }
      if (content.referenceUrls && content.referenceUrls.length > 0) {
        this.referenceUrls.set(content.referenceUrls);
      }
      if (content.wordCount) {
        this.wordCount.set(content.wordCount);
      }
      if (content.attachments && Array.isArray(content.attachments)) {
        this.attachmentFiles.set((content.attachments as Attachment[]).map((a, i) => ({
          id: Date.now() + 3000 + i,
          name: a.name,
          url: a.url,
          size: a.size,
          mimeType: a.mimeType,
          status: 'done' as const,
        })));
      }
      // 글 타입이면 body를 에디터 콘텐츠로 설정
      if (content.type === 'WRITING') {
        this.editorContent = content.body || '';
      }

    } catch (e) {
      console.error('콘텐츠 로드 실패:', e);
      this.formError.set('콘텐츠를 불러올 수 없습니다.');
    }
  }


  private async loadCategories(): Promise<void> {
    try {
      const cats = await this.api.contentCategories.findAll();
      const colors = ['#38C4D1', '#D37FC8', '#7B7EDF', '#43E97B', '#FA709A', '#A18CD1'];
      const icons = ['layers', 'image', 'profile'];
      this.categories.set(cats.map((c, i) => ({
        id: c.id,
        name: c.name,
        icon: icons[i % icons.length],
        color: colors[i % colors.length],
      })));
    } catch (e) {
      console.error('카테고리 로드 실패:', e);
    }
  }

  ngOnDestroy(): void {
    document.body.classList.remove('page-content-upload');
  }

  toggleDetail(): void {
    this.isDetailOpen.update(v => !v);
  }

  toggleContent(): void {
    this.isContentOpen.update(v => !v);
  }

  toggleThumbnail(): void {
    this.isThumbnailOpen.update(v => !v);
  }

  selectType(name: string): void {
    const prev = this.selectedType();
    if (prev === name) return; // 이미 선택된 타입 → 해제 불가
    const next = name;
    this.selectedType.set(next);

    // 탭 변경 시 폼 전체 초기화
    if (prev !== next) {
      // 공통 필드 초기화
      this.title = '';
      this.subDescription = '';
      this.description = '';
      this.selectedCategory.set('');
      this.selectedAlbumId.set(null);
      this.selectedAlbumName.set('');
      this.contentItems.set([]);
      this.formError.set('');
      this.categoryError.set('');
      this.titleError.set('');
      this.subDescError.set('');
      this.descError.set('');
      this.thumbError.set('');

      // 썸네일 초기화
      this.croppedThumbnailUrl.set('');
      this.thumbCandidates.set([]);
      this.selectedThumbId.set(null);
      this.cropImageSrc.set('');
      this.selectedFileName.set('');
      this.selectedFileSize.set('');

      // 그림 전용 초기화
      this.selectedTools.set([]);
      this.customTool = '';
      this.artMedium = '';
      this.artistNote = '';
      this.workDuration = '';
      this.selectedDifficulty.set('');
      this.imageResolution.set('');
      this.processImages.set([]);

      // 웹툰 전용 초기화
      this.selectedGenre.set('');
      this.selectedAudience.set('');
      this.selectedWebtoonTools.set([]);
      this.customWebtoonTool = '';
      this.episodeNumber = '';
      this.storyboardImages.set([]);

      // 글 전용 초기화
      this.selectedWritingGenre.set('');
      this.selectedWritingTools.set([]);
      this.customWritingTool = '';
      this.referenceUrls.set([]);
      this.newReferenceUrl = '';
      this.wordCount.set(0);
      this.editorContent = '';
      this.attachmentFiles.set([]);
    }
  }

  selectCategory(name: string): void {
    this.selectedCategory.set(this.selectedCategory() === name ? '' : name);
  }

  onScheduleNameInput(event: Event): void {
    this.scheduleName = (event.target as HTMLInputElement).value;
  }

  onTitleInput(event: Event): void {
    this.title = (event.target as HTMLInputElement).value;
  }

  onDescriptionInput(event: Event): void {
    this.description = (event.target as HTMLTextAreaElement).value;
  }

  // ===== 그림 전용 핸들러 =====
  toggleTool(tool: string): void {
    this.selectedTools.update(tools =>
      tools.includes(tool) ? tools.filter(t => t !== tool) : [...tools, tool]
    );
  }

  onCustomToolInput(event: Event): void {
    this.customTool = (event.target as HTMLInputElement).value;
  }

  addCustomTool(): void {
    const tool = this.customTool.trim();
    if (tool && !this.selectedTools().includes(tool)) {
      this.selectedTools.update(tools => [...tools, tool]);
      this.customTool = '';
    }
  }

  removeCustomTool(tool: string): void {
    this.selectedTools.update(tools => tools.filter(t => t !== tool));
  }

  selectMedium(medium: string): void {
    this.artMedium = this.artMedium === medium ? '' : medium;
  }

  selectDifficulty(level: string): void {
    this.selectedDifficulty.set(this.selectedDifficulty() === level ? '' : level);
  }

  onArtistNoteInput(event: Event): void {
    this.artistNote = (event.target as HTMLTextAreaElement).value;
  }

  onWorkDurationInput(event: Event): void {
    this.workDuration = (event.target as HTMLInputElement).value;
  }

  async onProcessImageSelect(): Promise<void> {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = async () => {
      if (!input.files) return;
      for (let i = 0; i < input.files.length; i++) {
        const file = input.files[i];
        const id = Date.now() + i;

        // 첫 번째 이미지인 경우 해상도 감지
        if (this.processImages().length === 0 && i === 0) {
          this.detectResolution(file);
        }

        this.processImages.update(items => [...items, {
          id, fileName: file.name, thumbnailUrl: '', status: 'uploading' as const,
        }]);

        try {
          const result = await this.api.upload.single(file, 'process');
          this.processImages.update(items => items.map(item =>
            item.id === id ? { ...item, status: 'done' as const, thumbnailUrl: result.url } : item
          ));
        } catch (e) {
          console.error('작업 과정 이미지 업로드 실패:', e);
          this.processImages.update(items => items.map(item =>
            item.id === id ? { ...item, status: 'error' as const } : item
          ));
        }
      }
    };
    input.click();
  }


  removeProcessImage(id: number): void {
    this.processImages.update(items => items.filter(i => i.id !== id));
  }

  // ===== 웹툰 전용 메서드 =====
  toggleWebtoonTool(tool: string): void {
    this.selectedWebtoonTools.update(tools =>
      tools.includes(tool) ? tools.filter(t => t !== tool) : [...tools, tool]
    );
  }

  addCustomWebtoonTool(): void {
    const t = this.customWebtoonTool.trim();
    if (t && !this.selectedWebtoonTools().includes(t)) {
      this.selectedWebtoonTools.update(tools => [...tools, t]);
    }
    this.customWebtoonTool = '';
  }

  onCustomWebtoonToolInput(event: Event): void {
    this.customWebtoonTool = (event.target as HTMLInputElement).value;
  }

  onEpisodeNumberInput(event: Event): void {
    this.episodeNumber = (event.target as HTMLInputElement).value;
  }

  async onStoryboardImageSelect(): Promise<void> {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = async () => {
      if (!input.files) return;
      for (let i = 0; i < input.files.length; i++) {
        const file = input.files[i];
        const id = Date.now() + i;

        this.storyboardImages.update(items => [...items, {
          id, fileName: file.name, thumbnailUrl: '', status: 'uploading' as const,
        }]);

        try {
          const result = await this.api.upload.single(file, 'storyboard');
          this.storyboardImages.update(items => items.map(item =>
            item.id === id ? { ...item, status: 'done' as const, thumbnailUrl: result.url } : item
          ));
        } catch (e) {
          console.error('콘티 이미지 업로드 실패:', e);
          this.storyboardImages.update(items => items.map(item =>
            item.id === id ? { ...item, status: 'error' as const } : item
          ));
        }
      }
    };
    input.click();
  }

  removeStoryboardImage(id: number): void {
    this.storyboardImages.update(items => items.filter(i => i.id !== id));
  }


  private detectResolution(file: File): void {
    const img = new Image();
    img.onload = () => {
      this.imageResolution.set(`${img.naturalWidth} × ${img.naturalHeight}px`);
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(file);
  }

  async onFileSelect(): Promise<void> {
    try {
      const serverAlbums = await this.api.albums.findAll('ALBUM');
      this.albums.set(serverAlbums.map((a: ServerAlbumResponse) => {
        const thumbnails = (a.albumContents || [])
          .slice(0, 4)
          .map((ac) => ac.content?.thumbnail)
          .filter((t): t is string => !!t);
        return {
          id: a.id,
          name: a.name,
          count: a._count?.albumContents || 0,
          thumbnails,
        };
      }));
    } catch (e) {
      console.error('앨범 로드 실패:', e);
    }
    this.isAlbumModalOpen.set(true);
  }

  async onContentFileSelect(): Promise<void> {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = async () => {
      if (!input.files) return;
      for (let i = 0; i < input.files.length; i++) {
        const file = input.files[i];
        const id = Date.now() + i;
        const sizeKB = (file.size / 1024).toFixed(2);

        // UI에 uploading 상태로 추가
        this.contentItems.update(items => [...items, {
          id, fileName: file.name, size: `${sizeKB}KB`, thumbnailUrl: '', status: 'uploading' as const,
        }]);

        // Supabase 업로드
        try {
          const result = await this.api.upload.single(file, 'contents');
          this.contentItems.update(items => items.map(item =>
            item.id === id ? { ...item, status: 'done' as const, thumbnailUrl: result.url } : item
          ));
        } catch {
          this.contentItems.update(items => items.map(item =>
            item.id === id ? { ...item, status: 'error' as const } : item
          ));
        }
      }
    };
    input.click();
  }

  removeContentItem(id: number): void {
    this.contentItems.update(items => items.filter(i => i.id !== id));
  }

  // ===== 이미지 업로드 버튼 =====
  openThumbSelectModal(): void {
    this.triggerFileInput();
  }

  triggerFileInput(): void {
    const input = this.thumbFileInput?.nativeElement;
    if (input) {
      input.click();
    } else {
      const el = document.querySelector('#thumbFileInput') as HTMLInputElement;
      if (el) el.click();
    }
  }

  onThumbFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    if (!file.type.startsWith('image/')) return;

    this.selectedFileName.set(file.name);
    this.selectedFileSize.set(this.formatFileSize(file.size));

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      this.cropImageSrc.set(result);
      this.isCropModalOpen.set(true);
      setTimeout(() => this.initCropper(), 300);
    };
    reader.readAsDataURL(file);
    input.value = '';
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + 'B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + 'KB';
    return (bytes / (1024 * 1024)).toFixed(2) + 'MB';
  }

  private initCropper(): void {
    this.destroyCropper();

    let imgEl = this.cropImageRef?.nativeElement;
    if (!imgEl) {
      imgEl = document.querySelector('.crop-image') as HTMLImageElement;
    }
    if (!imgEl) return;

    this.cropper = new Cropper(imgEl, {
      aspectRatio: 1,
      viewMode: 1,
      dragMode: 'none',
      autoCropArea: 0.6,
      movable: false,
      zoomable: false,
      rotatable: false,
      scalable: false,
      cropBoxResizable: true,
      cropBoxMovable: true,
      guides: true,
      center: true,
      highlight: true,
      background: false,
    });
  }

  private destroyCropper(): void {
    if (this.cropper) {
      this.cropper.destroy();
      this.cropper = null;
    }
  }

  closeCropModal(): void {
    this.destroyCropper();
    this.isCropModalOpen.set(false);
    this.cropImageSrc.set('');
  }

  // 크롭 저장 → 썸네일 직접 적용
  saveCrop(): void {
    if (!this.cropper) return;

    const canvas = this.cropper.getCroppedCanvas({
      width: 320,
      height: 320,
    });

    if (canvas) {
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      this.croppedThumbnailUrl.set(dataUrl);
    }

    this.destroyCropper();
    this.isCropModalOpen.set(false);
    this.cropImageSrc.set('');
  }

  // ===== 선택 모달 =====
  closeThumbModal(): void {
    this.isThumbModalOpen.set(false);
  }

  closeAllModals(): void {
    this.destroyCropper();
    this.isThumbModalOpen.set(false);
    this.isCropModalOpen.set(false);
    this.cropImageSrc.set('');
  }

  selectThumb(id: number): void {
    this.selectedThumbId.set(id);
  }

  confirmThumbSelection(): void {
    const selected = this.thumbCandidates().find(c => c.id === this.selectedThumbId());
    if (selected) {
      this.croppedThumbnailUrl.set(selected.dataUrl);
    }
    this.isThumbModalOpen.set(false);
  }

  addMoreThumbnails(): void {
    this.triggerFileInput();
  }

  onThumbnailDelete(): void {
    this.croppedThumbnailUrl.set('');
    this.selectedThumbId.set(null);
    this.thumbCandidates.set([]);
  }

  applyTitleAsThumbnail(): void {
    const titleText = this.title?.trim() || 'KIPhub';

    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 배경 그라디언트
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#7A48FF');
    gradient.addColorStop(1, '#3B1F8E');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 텍스트 설정
    let fontSize = 48;
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 폰트 크기 자동 조정
    while (ctx.measureText(titleText).width > canvas.width - 80 && fontSize > 18) {
      fontSize -= 2;
      ctx.font = `bold ${fontSize}px sans-serif`;
    }

    // 여러 줄 처리
    const maxWidth = canvas.width - 80;
    const lines: string[] = [];
    let currentLine = '';
    for (const char of titleText) {
      const testLine = currentLine + char;
      if (ctx.measureText(testLine).width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = char;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);

    const lineHeight = fontSize * 1.4;
    const startY = canvas.height / 2 - ((lines.length - 1) * lineHeight) / 2;
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], canvas.width / 2, startY + i * lineHeight);
    }

    this.croppedThumbnailUrl.set(canvas.toDataURL('image/png'));
  }

  // ===== 앨범 모달 =====
  closeAlbumModal(): void {
    this.isAlbumModalOpen.set(false);
  }

  selectAlbum(id: number): void {
    this.selectedAlbumId.set(id);
  }

  async removeAlbum(id: number): Promise<void> {
    try {
      await this.api.albums.delete(id);
      this.albums.update(list => list.filter(a => a.id !== id));
      if (this.selectedAlbumId() === id) {
        this.selectedAlbumId.set(null);
      }
    } catch (e) {
      console.error('앨범 삭제 실패:', e);
    }
  }

  confirmAlbumSelection(): void {
    const selected = this.albums().find(a => a.id === this.selectedAlbumId());
    if (selected) {
      this.selectedAlbumName.set(selected.name);
    }
    this.isAlbumModalOpen.set(false);
  }

  /* 인라인 앨범 추가 */
  isAddingAlbum = signal(false);
  newAlbumInputName = signal('');

  startAddAlbum(): void {
    this.newAlbumInputName.set('');
    this.isAddingAlbum.set(true);
    setTimeout(() => this.newAlbumInputRef?.nativeElement.focus());
  }

  cancelAddAlbum(): void {
    this.isAddingAlbum.set(false);
    this.newAlbumInputName.set('');
  }

  onNewAlbumInput(event: Event): void {
    this.newAlbumInputName.set((event.target as HTMLInputElement).value);
  }

  async confirmAddAlbum(): Promise<void> {
    const name = this.newAlbumInputName().trim();
    if (!name) { this.cancelAddAlbum(); return; }
    try {
      const created = await this.api.albums.create({ name });
      this.albums.update(list => [
        ...list,
        { id: created.id, name: created.name, count: 0, thumbnails: [] },
      ]);
      this.selectedAlbumId.set(created.id);
    } catch (e) {
      console.error('앨범 생성 실패:', e);
    }
    this.cancelAddAlbum();
  }

  onSubDescriptionInput(event: Event): void {
    this.subDescription = (event.target as HTMLInputElement).value;
  }

  private mapTypeToContentType(type: string): ContentType {
    switch (type) {
      case '웹툰': return 'WEBTOON';
      case '그림': return 'ILLUSTRATION';
      case '글': return 'WRITING';
      default: return 'WEBTOON';
    }
  }

  private dataUrlToBlob(dataUrl: string): Blob {
    const parts = dataUrl.split(',');
    const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const binary = atob(parts[1]);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  }

  async submitContent(): Promise<void> {
    // 인라인 에러 초기화
    this.categoryError.set('');
    this.titleError.set('');
    this.subDescError.set('');
    this.descError.set('');
    this.thumbError.set('');
    this.formError.set('');

    let hasError = false;
    if (!this.selectedCategory()) {
      this.categoryError.set('카테고리를 선택해주세요.');
      hasError = true;
    }
    if (!this.title.trim()) {
      this.titleError.set('제목을 입력해주세요.');
      hasError = true;
    }

    const bodyEmpty = this.selectedType() === '글'
      ? !this.editorContent.replace(/<[^>]*>/g, '').trim() && !this.editorContent.includes('<img')
      : !this.description.trim();
    if (bodyEmpty) {
      this.descError.set('내용을 입력해주세요.');
      hasError = true;
    }
    if (!this.croppedThumbnailUrl()) {
      this.thumbError.set('썸네일을 등록해주세요.');
      hasError = true;
    }
    if (hasError) return;

    this.formError.set('');
    this.isSubmitting.set(true);

    try {
      // 1. 썸네일 처리
      let thumbnailUrl: string | undefined;
      const croppedUrl = this.croppedThumbnailUrl();
      if (croppedUrl) {
        if (croppedUrl.startsWith('data:')) {
          // 새로 크롭한 이미지 → 업로드
          const blob = this.dataUrlToBlob(croppedUrl);
          const file = new File([blob], 'thumbnail.jpg', { type: 'image/jpeg' });
          const result = await this.api.upload.single(file, 'thumbnails');
          thumbnailUrl = result.url;
        } else {
          // 기존 HTTP URL → 그대로 사용
          thumbnailUrl = croppedUrl;
        }
      }

      // 2. 선택된 카테고리 ID 찾기
      const selectedCat = this.categories().find(c => c.name === this.selectedCategory());
      const categoryId = selectedCat?.id;

      // 3. 콘텐츠 이미지 URL 수집
      const contentImageUrls = this.contentItems()
        .filter(item => item.status === 'done' && item.thumbnailUrl)
        .map(item => item.thumbnailUrl);

      // 3-1. 작업 과정 이미지 URL 수집 (그림 전용)
      const processImageUrls = this.processImages()
        .filter(item => item.status === 'done' && item.thumbnailUrl)
        .map(item => item.thumbnailUrl);

      // 3-2. 콘티/스토리보드 이미지 URL 수집 (웹툰 전용)
      const storyboardImageUrls = this.storyboardImages()
        .filter(item => item.status === 'done' && item.thumbnailUrl)
        .map(item => item.thumbnailUrl);

      // 그림 전용 필드
      const artFields = this.selectedType() === '그림' ? {
        artMedium: this.artMedium || undefined,
        artTools: this.selectedTools().length > 0 ? this.selectedTools() : undefined,
        artistNote: this.artistNote.trim() || undefined,
        workDuration: this.workDuration.trim() || undefined,
        difficulty: this.selectedDifficulty() || undefined,
        resolution: this.imageResolution() || undefined,
        processImages: processImageUrls.length > 0 ? processImageUrls : undefined,
      } : {};

      // 웹툰 전용 필드
      const webtoonFields = this.selectedType() === '웹툰' ? {
        webtoonGenre: this.selectedGenre() || undefined,
        targetAudience: this.selectedAudience() || undefined,
        webtoonTools: this.selectedWebtoonTools().length > 0 ? this.selectedWebtoonTools() : undefined,
        episodeNumber: this.episodeNumber ? parseInt(this.episodeNumber, 10) : undefined,
        storyboardImages: storyboardImageUrls.length > 0 ? storyboardImageUrls : undefined,
      } : {};

      // 글 전용 필드
      const writingFields = this.selectedType() === '글' ? {
        writingGenre: this.selectedWritingGenre() || undefined,
        writingTools: this.selectedWritingTools().length > 0 ? this.selectedWritingTools() : undefined,
        referenceUrls: this.referenceUrls().length > 0 ? this.referenceUrls() : undefined,
        wordCount: this.wordCount() || undefined,
        attachments: this.attachmentFiles().filter(f => f.status === 'done').map(f => ({ name: f.name, url: f.url, size: f.size, mimeType: f.mimeType })),
      } : {};

      // 글 타입이면 에디터 콘텐츠를 body로 사용
      const bodyContent = this.selectedType() === '글' ? this.editorContent : this.description.trim();

      // 4. 콘텐츠 생성 또는 수정
      if (this.isEditMode) {
        // 수정 모드: update API 사용
        await this.api.contents.update(this.editContentId, {
          title: this.title.trim(),
          body: bodyContent,
          type: this.mapTypeToContentType(this.selectedType()),
          thumbnail: thumbnailUrl,
          images: contentImageUrls.length > 0 ? contentImageUrls : undefined,
          categoryId,
          ...artFields,
          ...webtoonFields,
          ...writingFields,
        });
        // 수정 완료 → 상세 페이지로 이동
        this.router.navigate(['/content', this.editContentId]);
      } else {
        // 생성 모드: create API 사용
        const created = await this.api.contents.create({
          title: this.title.trim(),
          body: bodyContent,
          type: this.mapTypeToContentType(this.selectedType()),
          thumbnail: thumbnailUrl,
          images: contentImageUrls.length > 0 ? contentImageUrls : undefined,
          categoryId,
          ...artFields,
          ...webtoonFields,
          ...writingFields,
        });


        // 5. 선택된 앨범이 있으면 콘텐츠를 앨범에 추가
        const albumId = this.selectedAlbumId();
        if (albumId && created?.id) {
          try {
            await this.api.albums.addContent(albumId, created.id);
          } catch (e) {
            console.error('앨범에 콘텐츠 추가 실패:', e);
          }
        }

        // 6. 성공 → 홈으로 이동
        this.router.navigate(['/']);
      }
    } catch (e: unknown) {
      console.error('콘텐츠 업로드 실패:', e);
      const err = e as Record<string, unknown>;
      if (err['status']) console.error('HTTP Status:', err['status']);
      if (err['error']) console.error('Server Error:', JSON.stringify(err['error']));
      if (err['message']) console.error('Message:', err['message']);
      const serverMsg = (err['error'] as Record<string, unknown>)?.['message'];
      this.formError.set(`업로드에 실패했습니다. ${serverMsg || '다시 시도해주세요.'}`);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  // ===== 글 전용 메서드 =====
  toggleWritingGenre(genre: string): void {
    this.selectedWritingGenre.set(this.selectedWritingGenre() === genre ? '' : genre);
  }

  toggleWritingTool(tool: string): void {
    this.selectedWritingTools.update(tools =>
      tools.includes(tool) ? tools.filter(t => t !== tool) : [...tools, tool]
    );
  }

  addCustomWritingTool(): void {
    const t = this.customWritingTool.trim();
    if (t && !this.selectedWritingTools().includes(t)) {
      this.selectedWritingTools.update(tools => [...tools, t]);
    }
    this.customWritingTool = '';
  }

  onCustomWritingToolInput(event: Event): void {
    this.customWritingTool = (event.target as HTMLInputElement).value;
  }

  addReferenceUrl(): void {
    const url = this.newReferenceUrl.trim();
    if (url && !this.referenceUrls().includes(url)) {
      this.referenceUrls.update(urls => [...urls, url]);
    }
    this.newReferenceUrl = '';
  }

  removeReferenceUrl(index: number): void {
    this.referenceUrls.update(urls => urls.filter((_, i) => i !== index));
  }

  onReferenceUrlInput(event: Event): void {
    this.newReferenceUrl = (event.target as HTMLInputElement).value;
  }

  onReferenceUrlKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.addReferenceUrl();
    }
  }

  onEditorContentChange(html: string): void {
    this.editorContent = html;
  }

  onWordCountChange(count: number): void {
    this.wordCount.set(count);
  }

  private attachmentIdCounter = 0;

  async onAttachmentUpload(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const files = Array.from(input.files);
    for (const file of files) {
      const id = ++this.attachmentIdCounter;
      const item = {
        id,
        name: file.name,
        url: '',
        size: file.size,
        mimeType: file.type,
        status: 'uploading' as const,
      };
      this.attachmentFiles.update(list => [...list, item]);
      try {
        const result = await this.api.upload.single(file, 'attachments');
        this.attachmentFiles.update(list =>
          list.map(f => f.id === id ? { ...f, url: result.url, status: 'done' as const } : f)
        );
      } catch (err) {
        console.error('첨부파일 업로드 실패:', file.name, file.type, err);
        this.attachmentFiles.update(list =>
          list.map(f => f.id === id ? { ...f, status: 'error' as const } : f)
        );
      }
    }
    input.value = '';
  }

  removeAttachment(id: number): void {
    this.attachmentFiles.update(list => list.filter(f => f.id !== id));
  }


  goBack(): void {
    this.router.navigate(['/']);
  }
}
