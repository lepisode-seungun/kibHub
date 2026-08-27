import { Component, OnInit, OnDestroy, signal, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';
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
  selectedCategory = signal('웹툰');
  title = '';
  description = '';

  // 카테고리 칩 목록
  categories: CategoryChip[] = [
    { name: '웹툰', icon: 'layers', color: '#38C4D1' },
    { name: '그림', icon: 'image', color: '#D37FC8' },
    { name: '글', icon: 'profile', color: '#7B7EDF' },
    { name: '카테고리1', icon: 'layers', color: '#38C4D1' },
    { name: '카테고리2', icon: 'image', color: '#D37FC8' },
    { name: '카테고리3', icon: 'profile', color: '#7B7EDF' },
    { name: '카테고리4', icon: 'layers', color: '#38C4D1' },
    { name: '카테고리5', icon: 'image', color: '#D37FC8' },
    { name: '카테고리6', icon: 'profile', color: '#7B7EDF' },
    { name: '기타1', icon: 'layers', color: '#38C4D1' },
    { name: '기타2', icon: 'image', color: '#D37FC8' },
  ];

  // 콘텐츠 아이템
  contentItems = signal<ContentItem[]>([
    { id: 1, fileName: '콘텐츠.jpg콘텐츠.jpg콘텐츠.jpg', size: '1920px * 3000px 10.23KB', thumbnailUrl: '', status: 'uploading' },
    { id: 2, fileName: '콘텐츠.jpg콘텐츠.jpg콘텐츠.jpg', size: '1920px * 3000px 10.23KB', thumbnailUrl: '', status: 'uploading' },
    { id: 3, fileName: '콘텐츠.jpg콘텐츠.jpg콘텐츠.jpg', size: '1920px * 3000px 10.23KB', thumbnailUrl: '', status: 'error' },
    { id: 4, fileName: '콘텐츠.jpg콘텐츠.jpg콘텐츠.jpg', size: '1920px * 3000px 10.23KB', thumbnailUrl: '', status: 'done' },
    { id: 5, fileName: '콘텐츠.jpg콘텐츠.jpg콘텐츠.jpg', size: '1920px * 3000px 10.23KB', thumbnailUrl: '', status: 'done' },
    { id: 6, fileName: '콘텐츠.jpg콘텐츠.jpg콘텐츠.jpg', size: '1920px * 3000px 10.23KB', thumbnailUrl: '', status: 'done' },
    { id: 7, fileName: '콘텐츠.jpg콘텐츠.jpg콘텐츠.jpg', size: '1920px * 3000px 10.23KB', thumbnailUrl: '', status: 'done' },
  ]);

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
  albums = signal<{ id: number; name: string; count: number }[]>([]);
  selectedAlbumId = signal<number | null>(null);
  selectedAlbumName = signal<string>('');

  private cropper: Cropper | null = null;

  @ViewChild('cropImage') cropImageRef!: ElementRef<HTMLImageElement>;
  @ViewChild('thumbFileInput') thumbFileInput!: ElementRef<HTMLInputElement>;

  ngOnInit(): void {
    document.body.classList.add('page-content-upload');
    this.route.paramMap.subscribe((params) => {
      this.contentType = params.get('type') || 'webtoon';
    });
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

  selectCategory(name: string): void {
    this.selectedCategory.set(name);
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

  onFileSelect(): void {
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

  // ===== 앨범 모달 =====
  closeAlbumModal(): void {
    this.isAlbumModalOpen.set(false);
  }

  selectAlbum(id: number): void {
    this.selectedAlbumId.set(id);
  }

  removeAlbum(id: number): void {
    this.albums.update(list => list.filter(a => a.id !== id));
    if (this.selectedAlbumId() === id) {
      this.selectedAlbumId.set(null);
    }
  }

  confirmAlbumSelection(): void {
    const selected = this.albums().find(a => a.id === this.selectedAlbumId());
    if (selected) {
      this.selectedAlbumName.set(selected.name);
    }
    this.isAlbumModalOpen.set(false);
  }

  private albumIdCounter = 0;
  addNewAlbum(): void {
    const name = prompt('새 앨범 이름을 입력하세요:');
    if (name && name.trim()) {
      this.albumIdCounter++;
      this.albums.update(list => [
        ...list,
        { id: this.albumIdCounter, name: name.trim(), count: 0 },
      ]);
      this.selectedAlbumId.set(this.albumIdCounter);
    }
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}
