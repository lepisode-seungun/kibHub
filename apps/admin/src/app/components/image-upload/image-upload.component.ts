import { Component, Input, Output, EventEmitter, signal, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ImageUploadData {
  name: string;
  size: string;
  preview: string;
  file: File;
}

let nextId = 0;

@Component({
  selector: 'adm-image-upload',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col gap-2">
      <!-- 라벨 -->
      @if (label) {
        <div class="flex items-center gap-1">
          <span class="font-suit font-medium text-base leading-[22px] tracking-[-0.04em] text-gray-800">{{ label }}</span>
          @if (required) {
            <span class="font-suit font-medium text-base leading-[22px] tracking-[-0.04em] text-[#1693C9]">*</span>
          }
        </div>
      }

      <!-- 안내 문구 -->
      @if (hint) {
        <div class="flex items-start gap-2 px-2 py-1 rounded-md self-start" style="background: #D9E9FE;">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" class="flex-shrink-0 mt-0.5">
            <circle cx="8" cy="8" r="8" fill="#3C8EEE"/>
            <text x="8" y="12" text-anchor="middle" fill="#FFFFFF" font-size="11" font-weight="600" font-family="SUIT, sans-serif">i</text>
          </svg>
          <span class="font-suit font-medium text-sm leading-[150%] tracking-[-0.04em] text-gray-700">{{ hint }}</span>
        </div>
      }

      <!-- 파일 입력 (숨김) -->
      <input type="file" [id]="inputId" [accept]="accept" class="hidden" (change)="onFileSelected($event)" />

      <!-- 이미지 프리뷰 (새 파일 또는 기존 URL) -->
      @if (currentPreview()) {
        <div class="relative w-full rounded-lg overflow-hidden cursor-pointer group"
             (click)="triggerInput()">
          <img [src]="currentPreview()" alt="" class="w-full h-[120px] object-cover rounded-lg" />
          <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 4v16M4 12h16" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <span class="font-suit font-medium text-sm text-white">변경하기</span>
          </div>
          <button class="absolute top-2 right-2 flex items-center justify-center w-7 h-7 bg-white/90 rounded-full border-none cursor-pointer hover:bg-white transition-colors"
                  (click)="removeFile(); $event.stopPropagation()">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 3l8 8M11 3l-8 8" stroke="#374151" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
      } @else {
        <!-- 드래그 앤 드롭 영역 -->
        <div class="flex flex-col items-center justify-center px-4 py-4 border border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-gray-300 transition-colors"
             style="min-height: 84px;"
             (click)="triggerInput()">
          <svg width="20" height="19" viewBox="0 0 20 19" fill="none">
            <path d="M10.8333 0V10.3848L15.1667 6.0515L16.6985 7.58333L9.75 14.5318L2.8015 7.58333L4.33333 6.0515L8.66667 10.3848V0H10.8333ZM0 16.25H19.5V18.4167H0V16.25Z" fill="#3C8EEE"/>
          </svg>
          <span class="font-suit font-medium text-sm leading-[150%] tracking-[-0.04em] text-gray-400 mt-2">사진 또는 파일을 드래그 할 수 있어요</span>
        </div>
      }
    </div>
  `,
})
export class ImageUploadComponent implements OnChanges {
  /** 라벨 텍스트 */
  @Input() label = '';
  /** 필수 여부 (* 표시) */
  @Input() required = false;
  /** 안내 문구 (info 박스) */
  @Input() hint = '';
  /** accept 속성 (기본: image/*) */
  @Input() accept = 'image/*';
  /** 기존 이미지 URL (수정 모드에서 프리뷰 표시) */
  @Input() existingUrl = '';

  /** 파일 선택/제거 시 이벤트 */
  @Output() fileChange = new EventEmitter<ImageUploadData | null>();

  readonly inputId = `img-upload-${nextId++}`;
  imageData = signal<ImageUploadData | null>(null);
  currentPreview = signal('');

  triggerInput(): void {
    (document.getElementById(this.inputId) as HTMLInputElement)?.click();
  }

  ngOnChanges(): void {
    // 새 파일이 없으면 기존 URL 표시
    if (!this.imageData()) {
      this.currentPreview.set(this.existingUrl || '');
    }
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const sizeKB = Math.round(file.size / 1024);
    const reader = new FileReader();
    reader.onload = () => {
      const data: ImageUploadData = {
        name: file.name,
        size: `${sizeKB}KB`,
        preview: reader.result as string,
        file,
      };
      this.imageData.set(data);
      this.currentPreview.set(data.preview);
      this.fileChange.emit(data);
    };
    reader.readAsDataURL(file);
  }

  removeFile(): void {
    this.imageData.set(null);
    this.currentPreview.set('');
    this.fileChange.emit(null);
  }

  /** 외부에서 프로그래밍적으로 리셋 */
  reset(): void {
    this.imageData.set(null);
    this.currentPreview.set('');
  }
}
