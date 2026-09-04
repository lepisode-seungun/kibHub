import { Component, input, output, signal, ElementRef, ViewChild, AfterViewInit, OnChanges, OnDestroy, SimpleChanges, booleanAttribute, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'adm-text-editor',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './text-editor.component.html',
  styleUrl: './text-editor.component.css',
})
export class TextEditorComponent implements AfterViewInit, OnChanges {
  private api = inject(ApiService);
  placeholder = input<string>('내용을 입력하세요.');
  minHeight = input<string>('280px');
  content = input<string>('');
  showFontSize = input(false, { transform: booleanAttribute });
  contentChange = output<string>();

  @ViewChild('editorContent') editorRef!: ElementRef<HTMLDivElement>;

  isBold = signal(false);
  isItalic = signal(false);
  isUnderline = signal(false);
  fontSizeOpen = signal(false);
  currentFontSize = signal('14px');
  colorPaletteOpen = signal(false);
  currentColor = signal('#000000');

  readonly fontSizes = [
    { label: '10px', value: '10px' },
    { label: '12px', value: '12px' },
    { label: '14px', value: '14px' },
    { label: '16px', value: '16px' },
    { label: '18px', value: '18px' },
    { label: '20px', value: '20px' },
    { label: '24px', value: '24px' },
    { label: '28px', value: '28px' },
    { label: '32px', value: '32px' },
    { label: '36px', value: '36px' },
    { label: '48px', value: '48px' },
  ];

  readonly colorOptions = [
    '#FFFFFF', '#000000', '#374151', '#6B7280', '#9CA3AF',
    '#EF4444', '#F97316', '#EAB308', '#22C55E', '#3B82F6',
    '#6366F1', '#A855F7', '#EC4899', '#DC2626', '#EA580C',
    '#CA8A04', '#16A34A', '#2563EB', '#4F46E5', '#9333EA',
  ];

  private selectionListener: (() => void) | null = null;

  private contentLoaded = false;

  ngAfterViewInit(): void {
    const initial = this.content();
    if (initial && this.editorRef?.nativeElement) {
      this.editorRef.nativeElement.innerHTML = initial;
      this.contentLoaded = true;
    }
    // selectionchange로 현재 폰트 크기 감지
    this.selectionListener = () => this.detectFontSize();
    document.addEventListener('selectionchange', this.selectionListener);
  }

  ngOnDestroy(): void {
    if (this.selectionListener) {
      document.removeEventListener('selectionchange', this.selectionListener);
    }
  }

  private detectFontSize(): void {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const node = sel.anchorNode;
    if (!node) return;
    const el = node instanceof HTMLElement ? node : node.parentElement;
    if (!el || !this.editorRef?.nativeElement?.contains(el)) return;
    const computed = window.getComputedStyle(el);
    const size = Math.round(parseFloat(computed.fontSize)) + 'px';
    this.currentFontSize.set(size);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['content'] && this.editorRef?.nativeElement && !this.contentLoaded) {
      const val = this.content();
      if (val) {
        this.editorRef.nativeElement.innerHTML = val;
        this.contentLoaded = true;
      }
    }
  }

  toggleBold(): void { this.isBold.update(v => !v); document.execCommand('bold'); }
  toggleItalic(): void { this.isItalic.update(v => !v); document.execCommand('italic'); }
  toggleUnderline(): void { this.isUnderline.update(v => !v); document.execCommand('underline'); }

  // 폰트 크기 드롭다운
  toggleFontSizeMenu(): void { this.fontSizeOpen.update(v => !v); this.colorPaletteOpen.set(false); }

  setFontSize(size: string): void {
    this.editorRef?.nativeElement?.focus();
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      if (!sel.isCollapsed) {
        // 텍스트가 선택된 경우: 선택 영역을 span으로 감싸기
        const range = sel.getRangeAt(0);
        const span = document.createElement('span');
        span.style.fontSize = size;
        range.surroundContents(span);
        sel.removeAllRanges();
        const newRange = document.createRange();
        newRange.selectNodeContents(span);
        sel.addRange(newRange);
      } else {
        // 커서만 놓인 경우: 빈 span 삽입 후 커서를 그 안에 배치
        const range = sel.getRangeAt(0);
        const span = document.createElement('span');
        span.style.fontSize = size;
        span.appendChild(document.createTextNode('\u200B')); // zero-width space
        range.insertNode(span);
        // 커서를 span 안으로 이동
        const newRange = document.createRange();
        newRange.setStart(span.firstChild!, 1);
        newRange.collapse(true);
        sel.removeAllRanges();
        sel.addRange(newRange);
      }
    }
    this.currentFontSize.set(size);
    this.fontSizeOpen.set(false);
    this.contentChange.emit(this.editorRef?.nativeElement?.innerHTML || '');
  }

  toggleColorPalette(): void {
    this.colorPaletteOpen.update(v => !v);
    this.fontSizeOpen.set(false);
  }

  setTextColor(color: string): void {
    this.editorRef?.nativeElement?.focus();
    document.execCommand('foreColor', false, color);
    this.currentColor.set(color);
    this.colorPaletteOpen.set(false);
    this.contentChange.emit(this.editorRef?.nativeElement?.innerHTML || '');
  }

  setList(type: 'ul' | 'ol'): void {
    document.execCommand(type === 'ul' ? 'insertUnorderedList' : 'insertOrderedList');
  }

  setAlign(align: 'left' | 'center' | 'right'): void {
    // 이미지가 선택되어 있는지 확인
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const node = sel.anchorNode;
      const el = node instanceof HTMLElement ? node : node?.parentElement;
      // 클릭한 곳이 이미지이거나 이미지를 포함한 div인지 확인
      const img = el?.tagName === 'IMG' ? el as HTMLImageElement
        : el?.querySelector('img') || el?.closest('div')?.querySelector('img');
      if (img) {
        const wrapper = img.parentElement;
        if (wrapper && wrapper.tagName === 'DIV' && wrapper !== this.editorRef?.nativeElement) {
          wrapper.style.textAlign = align;
        } else {
          // 래퍼가 없으면 div로 감싸기
          const div = document.createElement('div');
          div.style.textAlign = align;
          img.parentNode?.insertBefore(div, img);
          div.appendChild(img);
        }
        this.contentChange.emit(this.editorRef?.nativeElement?.innerHTML || '');
        return;
      }
    }
    document.execCommand(align === 'left' ? 'justifyLeft' : align === 'center' ? 'justifyCenter' : 'justifyRight');
    this.contentChange.emit(this.editorRef?.nativeElement?.innerHTML || '');
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const node = sel.anchorNode;
        const block = (node instanceof HTMLElement ? node : node?.parentElement)?.closest('h2, h3');
        if (block) {
          event.preventDefault();
          document.execCommand('insertLineBreak');
        }
      }
    }
  }

  onInput(event: Event): void {
    const el = event.target as HTMLElement;
    this.contentChange.emit(el.innerHTML);
  }

  isUploading = signal(false);

  async onImageUpload(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    this.isUploading.set(true);
    try {
      const uploaded = await this.api.uploadFile(file, 'editor');
      this.editorRef?.nativeElement?.focus();
      // 현재 정렬 상태 감지
      const sel = window.getSelection();
      let align = 'left';
      if (sel && sel.rangeCount > 0) {
        const node = sel.anchorNode;
        const el = node instanceof HTMLElement ? node : node?.parentElement;
        if (el) {
          const computed = window.getComputedStyle(el);
          if (computed.textAlign === 'center' || computed.textAlign === '-webkit-center') align = 'center';
          else if (computed.textAlign === 'right') align = 'right';
        }
      }
      const img = `<div style="text-align: ${align};"><img src="${uploaded.url}" alt="${file.name}" style="max-width: 500px; height: auto; border-radius: 4px; margin: 8px 0; display: inline-block;" /></div>`;
      document.execCommand('insertHTML', false, img);
      this.contentChange.emit(this.editorRef?.nativeElement?.innerHTML || '');
    } catch (e) {
      console.error('이미지 업로드 실패:', e);
    } finally {
      this.isUploading.set(false);
      input.value = '';
    }
  }
}
