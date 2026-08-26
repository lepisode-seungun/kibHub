import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'adm-text-editor',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './text-editor.component.html',
  styleUrl: './text-editor.component.css',
})
export class TextEditorComponent {
  placeholder = input<string>('내용을 입력하세요.');
  minHeight = input<string>('280px');
  contentChange = output<string>();

  isBold = signal(false);
  isItalic = signal(false);
  isUnderline = signal(false);

  toggleBold(): void { this.isBold.update(v => !v); document.execCommand('bold'); }
  toggleItalic(): void { this.isItalic.update(v => !v); document.execCommand('italic'); }
  toggleUnderline(): void { this.isUnderline.update(v => !v); document.execCommand('underline'); }

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

  onInput(event: Event): void {
    const el = event.target as HTMLElement;
    this.contentChange.emit(el.innerHTML);
  }
}
