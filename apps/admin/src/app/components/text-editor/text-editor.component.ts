import { Component, input, output, signal, ElementRef, ViewChild, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
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
  headingOpen = signal(false);
  currentHeading = signal('본문');

  private contentLoaded = false;

  ngAfterViewInit(): void {
    const initial = this.content();
    if (initial && this.editorRef?.nativeElement) {
      this.editorRef.nativeElement.innerHTML = initial;
      this.contentLoaded = true;
    }
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

  // Heading 드롭다운
  toggleHeadingMenu(): void { this.headingOpen.update(v => !v); }

  setHeading(tag: string, label: string): void {
    this.editorRef?.nativeElement?.focus();
    document.execCommand('formatBlock', false, `<${tag}>`);
    this.currentHeading.set(label);
    this.headingOpen.set(false);
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
