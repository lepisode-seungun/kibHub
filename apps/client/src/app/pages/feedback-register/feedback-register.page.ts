import { Component, inject, signal, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';


@Component({
  selector: 'app-feedback-register',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './feedback-register.page.html',
  styleUrls: ['./feedback-register.page.css'],
})
export class FeedbackRegisterPage implements OnInit, OnDestroy {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);

  bootcampId = '';
  submissionId = '';
  feedbackId = '';

  detailTabs = ['학습목록', '강의', '과제', '공지사항'];
  activeDetailTab = signal('과제');

  title = '';
  content = '';
  isSubmitting = signal(false);

  uploadedFiles = signal<{ name: string; extension: string; size: string; status: 'uploading' | 'done' | 'error'; url?: string }[]>([]);

  constructor() {
    this.route.params.subscribe((params) => {
      this.bootcampId = params['bootcampId'] || '';
      this.submissionId = params['submissionId'] || '';
      this.feedbackId = params['feedbackId'] || '';
    });
  }

  ngOnInit(): void {
    document.body.classList.add('page-feedback-register');
  }

  ngOnDestroy(): void {
    document.body.classList.remove('page-feedback-register');
  }

  selectDetailTab(tab: string): void {
    this.activeDetailTab.set(tab);
    if (this.bootcampId) {
      this.router.navigate(['/my-bootcamp', this.bootcampId]);
    }
  }

  goBack(): void {
    if (this.bootcampId && this.feedbackId) {
      this.router.navigate(['/my-bootcamp', this.bootcampId, 'feedback', this.feedbackId]);
    } else if (this.bootcampId && this.submissionId) {
      this.router.navigate(['/my-bootcamp', this.bootcampId, 'submission', this.submissionId]);
    } else if (this.bootcampId) {
      this.router.navigate(['/my-bootcamp', this.bootcampId]);
    } else {
      this.router.navigate(['/my-bootcamp']);
    }
  }

  removeFile(index: number): void {
    this.uploadedFiles.update(files => files.filter((_, i) => i !== index));
  }

  /* ===== 텍스트 에디터 명령 ===== */
  @ViewChild('editorArea') editorArea!: ElementRef<HTMLDivElement>;

  execCmd(command: string, value?: string): void {
    document.execCommand(command, false, value);
    this.editorArea?.nativeElement?.focus();
  }

  /* 글 색상 팔레트 */
  isColorOpen = signal(false);
  readonly colorOptions = [
    '#000000', '#434343', '#666666', '#999999', '#CCCCCC',
    '#EF4444', '#F97316', '#EAB308', '#22C55E', '#14B8A6',
    '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#EC4899',
    '#991B1B', '#9A3412', '#854D0E', '#166534', '#115E59',
    '#1E3A8A', '#3730A3', '#5B21B6', '#7E22CE', '#9D174D',
  ];

  toggleColorPalette(): void {
    this.isColorOpen.update(v => !v);
    this.isFontSizeOpen.set(false);
  }

  applyColor(color: string): void {
    document.execCommand('foreColor', false, color);
    this.isColorOpen.set(false);
    this.editorArea?.nativeElement?.focus();
  }

  /* 글씨 크기 드롭다운 */
  isFontSizeOpen = signal(false);
  readonly fontSizeOptions = [
    { label: '10', value: '1' },
    { label: '13', value: '2' },
    { label: '16', value: '3' },
    { label: '18', value: '4' },
    { label: '24', value: '5' },
    { label: '32', value: '6' },
    { label: '48', value: '7' },
  ];

  toggleFontSizeDropdown(): void {
    this.isFontSizeOpen.update(v => !v);
    this.isColorOpen.set(false);
  }

  applyFontSize(value: string): void {
    document.execCommand('fontSize', false, value);
    this.isFontSizeOpen.set(false);
    this.editorArea?.nativeElement?.focus();
  }

  insertLink(): void {
    const url = prompt('링크 URL을 입력하세요:', 'https://');
    if (url) {
      document.execCommand('createLink', false, url);
    }
  }

  insertImage(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.addEventListener('change', async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const result = await this.api.upload.single(file, 'editor');
        if (result?.url) {
          const img = document.createElement('img');
          img.src = result.url;
          img.alt = file.name;
          img.style.maxWidth = '360px';
          img.style.maxHeight = '300px';
          img.style.height = 'auto';
          img.style.width = 'auto';
          img.style.borderRadius = '8px';
          img.style.margin = '8px 0';
          img.style.display = 'block';

          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            range.deleteContents();
            range.insertNode(img);
            const newRange = document.createRange();
            newRange.setStartAfter(img);
            newRange.collapse(true);
            selection.removeAllRanges();
            selection.addRange(newRange);
          } else {
            this.editorArea?.nativeElement?.appendChild(img);
          }
          this.content = this.editorArea?.nativeElement?.innerHTML || '';
        }
      } catch (err) {
        console.error('이미지 업로드 실패:', err);
      }
      this.editorArea?.nativeElement?.focus();
    });
    input.click();
  }

  onEditorInput(event: Event): void {
    this.content = (event.target as HTMLElement).innerHTML;
  }

  onEditorFocus(event: FocusEvent): void {
    const el = event.target as HTMLElement;
    const placeholder = el.querySelector('.editor-placeholder');
    if (placeholder) placeholder.remove();
  }

  onEditorBlur(event: FocusEvent): void {
    const el = event.target as HTMLElement;
    if (!el.textContent?.trim() && !el.querySelector('img')) {
      el.innerHTML = '<span class="text-zinc-500 pointer-events-none editor-placeholder">입력해주세요.</span>';
      this.content = '';
    }
  }

  async onFileSelect(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    for (let i = 0; i < input.files.length; i++) {
      const file = input.files[i];
      const ext = file.name.split('.').pop() || '';
      const sizeKB = Math.round(file.size / 1024);
      const idx = this.uploadedFiles().length;

      this.uploadedFiles.update(files => [...files, {
        name: file.name.replace(`.${ext}`, ''),
        extension: ext,
        size: `${sizeKB}KB`,
        status: 'uploading' as const,
      }]);

      try {
        const result = await this.api.upload.single(file, 'feedbacks');
        this.uploadedFiles.update(files => files.map((f, j) =>
          j === idx ? { ...f, status: 'done' as const, url: result.url } : f
        ));
      } catch {
        this.uploadedFiles.update(files => files.map((f, j) =>
          j === idx ? { ...f, status: 'error' as const } : f
        ));
      }
    }
    input.value = '';
  }

  onCancel(): void {
    this.goBack();
  }

  async onSubmit(): Promise<void> {
    if (this.isSubmitting()) return;
    this.isSubmitting.set(true);
    try {
      const files = this.uploadedFiles()
        .filter(f => f.status === 'done')
        .map(f => ({ url: f.url ?? '', name: f.name + '.' + f.extension, size: 0, mimeType: '' }));
      const parentId = Number(this.submissionId || this.feedbackId);
      await this.api.submissions.createFeedback(parentId, {
        title: this.title,
        content: this.content,
        files,
      });
      this.goBack();
    } catch (err) {
      console.error('피드백 등록 실패:', err);
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
