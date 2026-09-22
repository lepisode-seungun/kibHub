import { Component, input, output, signal, ElementRef, ViewChild, AfterViewInit, OnChanges, OnDestroy, SimpleChanges, booleanAttribute, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-text-editor',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './text-editor.component.html',
  styleUrl: './text-editor.component.css',
})
export class TextEditorComponent implements AfterViewInit, OnChanges, OnDestroy {
  private api = inject(ApiService);
  placeholder = input<string>('내용을 입력하세요.');
  minHeight = input<string>('400px');
  content = input<string>('');
  showFontSize = input(true, { transform: booleanAttribute });
  contentChange = output<string>();
  wordCountChange = output<number>();

  @ViewChild('editorContent') editorRef!: ElementRef<HTMLDivElement>;

  isBold = signal(false);
  isItalic = signal(false);
  isUnderline = signal(false);
  fontSizeOpen = signal(false);
  currentFontSize = signal('16px');
  colorPaletteOpen = signal(false);
  currentColor = signal('#E4E4E7');

  readonly fontSizes = [
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
    '#FAFAFA', '#E4E4E7', '#A1A1AA', '#71717A', '#52525B',
    '#EF4444', '#F97316', '#EAB308', '#22C55E', '#3B82F6',
    '#6366F1', '#A855F7', '#EC4899', '#38C4D1', '#AF91FF',
  ];

  private selectionListener: (() => void) | null = null;
  private contentLoaded = false;

  ngAfterViewInit(): void {
    const initial = this.content();
    if (initial && this.editorRef?.nativeElement) {
      this.editorRef.nativeElement.innerHTML = initial;
      this.contentLoaded = true;
      this.emitWordCount();
    }
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

    // 에디터 루트 자체이면 현재 값 유지 (빈 에디터 / 루트 커서)
    if (el === this.editorRef.nativeElement) return;

    // 커서 위치에서 에디터 루트까지 올라가며 명시적 fontSize를 찾는다
    let current: HTMLElement | null = el;
    while (current && current !== this.editorRef.nativeElement) {
      if (current.style.fontSize) {
        this.currentFontSize.set(current.style.fontSize);
        return;
      }
      current = current.parentElement;
    }
    // 명시적 fontSize가 없으면 현재 값 유지 (기본 16px로 리셋 방지)
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['content'] && this.editorRef?.nativeElement && !this.contentLoaded) {
      const val = this.content();
      if (document.activeElement === this.editorRef.nativeElement) {
        this.contentLoaded = true;
        return;
      }
      if (val) {
        this.editorRef.nativeElement.innerHTML = val;
        this.contentLoaded = true;
        this.emitWordCount();
      }
    }
  }

  toggleBold(): void {
    this.editorRef?.nativeElement?.focus();
    document.execCommand('bold');
    this.isBold.update(v => !v);
    this.contentChange.emit(this.editorRef?.nativeElement?.innerHTML || '');
  }
  toggleItalic(): void {
    this.editorRef?.nativeElement?.focus();
    document.execCommand('italic');
    this.isItalic.update(v => !v);
    this.contentChange.emit(this.editorRef?.nativeElement?.innerHTML || '');
  }
  toggleUnderline(): void {
    this.editorRef?.nativeElement?.focus();
    document.execCommand('underline');
    this.isUnderline.update(v => !v);
    this.contentChange.emit(this.editorRef?.nativeElement?.innerHTML || '');
  }

  toggleFontSizeMenu(): void { this.fontSizeOpen.update(v => !v); this.colorPaletteOpen.set(false); }

  setFontSize(size: string): void {
    this.editorRef?.nativeElement?.focus();
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      if (!sel.isCollapsed) {
        document.execCommand('fontSize', false, '7');
        const editor = this.editorRef?.nativeElement;
        const replacedSpans: HTMLElement[] = [];
        if (editor) {
          const fontTags = editor.querySelectorAll('font[size="7"]');
          fontTags.forEach((font: Element) => {
            const span = document.createElement('span');
            span.style.fontSize = size;
            span.innerHTML = font.innerHTML;
            font.parentNode?.replaceChild(span, font);
            replacedSpans.push(span);
          });
        }
        if (replacedSpans.length > 0) {
          const newRange = document.createRange();
          newRange.setStartBefore(replacedSpans[0]);
          newRange.setEndAfter(replacedSpans[replacedSpans.length - 1]);
          sel.removeAllRanges();
          sel.addRange(newRange);
        }
      } else {
        const range = sel.getRangeAt(0);
        const span = document.createElement('span');
        span.style.fontSize = size;
        span.appendChild(document.createTextNode('\u200B'));
        range.insertNode(span);
        const newRange = document.createRange();
        const textNode = span.firstChild;
        if (textNode) {
          newRange.setStart(textNode, 1);
        }
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
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const node = sel.anchorNode;
      const el = node instanceof HTMLElement ? node : node?.parentElement;
      const img = el?.tagName === 'IMG' ? el as HTMLImageElement
        : el?.querySelector('img') || el?.closest('div')?.querySelector('img');
      if (img) {
        const wrapper = img.parentElement;
        if (wrapper && wrapper.tagName === 'DIV' && wrapper !== this.editorRef?.nativeElement) {
          wrapper.style.textAlign = align;
        } else {
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
    this.emitWordCount();
  }

  private emitWordCount(): void {
    const text = this.editorRef?.nativeElement?.innerText || '';
    const count = text.replace(/\s/g, '').length;
    this.wordCountChange.emit(count);
  }

  isUploading = signal(false);

  async onImageUpload(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    this.isUploading.set(true);
    try {
      const uploaded = await this.api.upload.single(file, 'editor');
      this.editorRef?.nativeElement?.focus();
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
      const img = `<div style="text-align: ${align};"><img src="${uploaded.url}" alt="${file.name}" style="max-width: 100%; height: auto; border-radius: 4px; margin: 8px 0; display: inline-block;" /></div>`;
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
