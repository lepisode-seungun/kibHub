import { Component, OnInit, OnDestroy, signal, computed, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { ContentType } from '@kibhub/shared';
import Cropper from 'cropperjs';

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
  imports: [CommonModule, RouterModule],
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

  // 제출 상태
  isSubmitting = signal(false);
  formError = signal('');
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
      this.contentType = params.get('type') || 'webtoon';
      const mapped = this.TYPE_MAP[this.contentType];
      if (mapped) this.selectedType.set(mapped);
    });
    this.loadCategories();
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
    this.selectedType.set(this.selectedType() === name ? '' : name);
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
    if (this.thumbCandidates().length > 0) {
      this.isThumbModalOpen.set(true);
    } else {
      // 처음: 선택 모달도 열고 파일 다이얼로그도 열기
      this.isThumbModalOpen.set(true);
      this.triggerFileInput();
    }
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
      this.isThumbModalOpen.set(true);
      this.isCropModalOpen.set(true);
      setTimeout(() => this.initCropper(), 300);
    };
    reader.readAsDataURL(file);
    input.value = '';
  }

  private formatFileSize(bytes: number): string {
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

  // 크롭 저장 → 후보에 추가 → 선택 모달 열기
  saveCrop(): void {
    if (!this.cropper) return;

    const canvas = this.cropper.getCroppedCanvas({
      width: 320,
      height: 320,
    });

    if (canvas) {
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      this.thumbCandidateId++;
      this.thumbCandidates.update(list => [
        ...list,
        {
          id: this.thumbCandidateId,
          name: this.selectedFileName(),
          size: this.selectedFileSize(),
          dataUrl,
        },
      ]);
      if (this.thumbCandidates().length === 1) {
        this.selectedThumbId.set(this.thumbCandidateId);
      }
    }

    this.destroyCropper();
    this.isCropModalOpen.set(false);
    this.cropImageSrc.set('');
    this.isThumbModalOpen.set(true);
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
    if (!this.subDescription.trim()) {
      this.subDescError.set('설명을 입력해주세요.');
      hasError = true;
    }
    if (!this.description.trim()) {
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
      // 1. 썸네일 업로드 (크롭 이미지가 있는 경우)
      let thumbnailUrl: string | undefined;
      const croppedUrl = this.croppedThumbnailUrl();
      if (croppedUrl) {
        const blob = this.dataUrlToBlob(croppedUrl);
        const file = new File([blob], 'thumbnail.jpg', { type: 'image/jpeg' });
        const result = await this.api.upload.single(file, 'thumbnails');
        thumbnailUrl = result.url;
      }

      // 2. 선택된 카테고리 ID 찾기
      const selectedCat = this.categories().find(c => c.name === this.selectedCategory());
      const categoryId = selectedCat?.id;

      // 3. 콘텐츠 이미지 URL 수집
      const contentImageUrls = this.contentItems()
        .filter(item => item.status === 'done' && item.thumbnailUrl)
        .map(item => item.thumbnailUrl);

      // 4. 콘텐츠 생성
      const created = await this.api.contents.create({
        title: this.title.trim(),
        body: this.description.trim(),
        type: this.mapTypeToContentType(this.selectedType()),
        thumbnail: thumbnailUrl,
        images: contentImageUrls.length > 0 ? contentImageUrls : undefined,
        categoryId,
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
    } catch (e: unknown) {
      console.error('콘텐츠 업로드 실패:', e);
      const err = e as Record<string, unknown>;
      if (err['status']) console.error('HTTP Status:', err['status']);
      if (err['error']) console.error('Server Error:', err['error']);
      this.formError.set('업로드에 실패했습니다. 다시 시도해주세요.');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}
