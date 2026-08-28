import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
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

      <!-- 드래그 앤 드롭 영역 -->
      <div class="flex flex-col items-center justify-center px-4 py-6 border border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-gray-300 transition-colors"
           style="min-height: 103px;"
           (click)="triggerInput()">
        <svg width="20" height="19" viewBox="0 0 20 19" fill="none">
          <path d="M10.8333 0V10.3848L15.1667 6.0515L16.6985 7.58333L9.75 14.5318L2.8015 7.58333L4.33333 6.0515L8.66667 10.3848V0H10.8333ZM0 16.25H19.5V18.4167H0V16.25Z" fill="#3C8EEE"/>
        </svg>
        <span class="font-suit font-medium text-sm leading-[150%] tracking-[-0.04em] text-gray-400 mt-2">사진 또는 파일을 드래그 할 수 있어요</span>
      </div>

      <!-- 업로드된 파일 프리뷰 -->
      @if (imageData()) {
        <div class="flex items-start gap-2.5 p-2.5 bg-white border border-slate-200 rounded-md">
          <img [src]="imageData()!.preview" alt="" class="w-[35px] h-[46px] rounded object-cover"/>
          <div class="flex items-center justify-between flex-1">
            <div class="flex flex-col gap-1">
              <span class="font-suit font-semibold text-sm leading-[150%] tracking-[-0.04em] text-gray-700">{{ imageData()!.name }}</span>
              <span class="font-suit font-medium text-sm leading-[150%] tracking-[-0.04em] text-gray-400">{{ imageData()!.size }}</span>
            </div>
            <div class="flex items-center gap-4">
              <svg width="15" height="12" viewBox="0 0 15 12" fill="none">
                <path d="M4.65833 8.81667L1.18333 5.34167L0 6.51667L4.65833 11.175L14.6583 1.175L13.4833 0L4.65833 8.81667Z" fill="#10B981"/>
              </svg>
              <button class="flex items-center justify-center border-none bg-transparent cursor-pointer p-0"
                      (click)="removeFile(); $event.stopPropagation()">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M5 5l10 10M15 5L5 15" stroke="#374151" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class ImageUploadComponent {
  /** 라벨 텍스트 */
  @Input() label = '';
  /** 필수 여부 (* 표시) */
  @Input() required = false;
  /** 안내 문구 (info 박스) */
  @Input() hint = '';
  /** accept 속성 (기본: image/*) */
  @Input() accept = 'image/*';

  /** 파일 선택/제거 시 이벤트 */
  @Output() fileChange = new EventEmitter<ImageUploadData | null>();

  readonly inputId = `img-upload-${nextId++}`;
  imageData = signal<ImageUploadData | null>(null);

  triggerInput(): void {
    (document.getElementById(this.inputId) as HTMLInputElement)?.click();
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
      this.fileChange.emit(data);
    };
    reader.readAsDataURL(file);
  }

  removeFile(): void {
    this.imageData.set(null);
    this.fileChange.emit(null);
  }

  /** 외부에서 프로그래밍적으로 리셋 */
  reset(): void {
    this.imageData.set(null);
  }
}
