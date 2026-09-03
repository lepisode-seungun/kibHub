import { Component, input, output, signal, ElementRef, ViewChild, AfterViewInit, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'adm-text-editor',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './text-editor.component.html',
  styleUrl: './text-editor.component.css',
})
export class TextEditorComponent implements AfterViewInit, OnChanges {
  placeholder = input<string>('내용을 입력하세요.');
  minHeight = input<string>('280px');
  content = input<string>('');
  contentChange = output<string>();

  @ViewChild('editorContent') editorRef!: ElementRef<HTMLDivElement>;

  isBold = signal(false);
  isItalic = signal(false);
  isUnderline = signal(false);
  fontSizeOpen = signal(false);
  currentFontSize = signal('14px');

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
  toggleFontSizeMenu(): void { this.fontSizeOpen.update(v => !v); }

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

  insertLink(): void {
    const url = prompt('링크 URL을 입력하세요:');
    if (url) document.execCommand('createLink', false, url);
  }

  setList(type: 'ul' | 'ol'): void {
    document.execCommand(type === 'ul' ? 'insertUnorderedList' : 'insertOrderedList');
  }

  setAlign(align: 'left' | 'center' | 'right'): void {
    document.execCommand(align === 'left' ? 'justifyLeft' : align === 'center' ? 'justifyCenter' : 'justifyRight');
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
}
