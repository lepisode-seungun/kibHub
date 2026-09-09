import { Component, inject, signal, ViewChild, ElementRef, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';



@Component({
  selector: 'app-assignment-submit',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './assignment-submit.page.html',
  styleUrls: ['./assignment-submit.page.css'],
})
export class AssignmentSubmitPage implements AfterViewInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);

  bootcampId = '';
  assignmentId = '';
  submissionId = '';
  isEditMode = false;

  detailTabs = ['학습목록', '강의', '과제', '공지사항'];
  activeDetailTab = signal('과제');

  title = '';
  content = '';
  isSubmitting = signal(false);

  uploadedFiles = signal<{ name: string; extension: string; size: string; status: 'uploading' | 'done' | 'error'; url?: string; path?: string }[]>([]);

  constructor() {
    this.route.params.subscribe((params) => {
      this.bootcampId = params['bootcampId'] || '';
      this.assignmentId = params['assignmentId'] || '';
      this.submissionId = params['submissionId'] || '';
      this.isEditMode = !!this.submissionId;
    });
  }

  ngAfterViewInit(): void {
    if (this.isEditMode) {
      this.loadSubmission();
    }
  }

  private async loadSubmission(): Promise<void> {
    try {
      const s = await this.api.submissions.findOne(Number(this.submissionId)) as {
        title?: string; content?: string;
        files?: { name: string; url?: string; mimeType?: string }[];
        assignment?: { id: number };
      };
      this.title = s.title || '';
      this.content = s.content || '';
      if (s.assignment) {
        this.assignmentId = String(s.assignment.id);
      }
      // 에디터에 기존 내용 삽입
      if (this.editorArea?.nativeElement && this.content) {
        this.editorArea.nativeElement.innerHTML = this.content;
      }
      // 기존 첨부파일 로드
      if (s.files?.length) {
        this.uploadedFiles.set(s.files.map(f => {
          const parts = f.name.split('.');
          const ext = parts.length > 1 ? parts.pop()! : '';
          const name = parts.join('.');
          return { name, extension: ext, size: '', status: 'done' as const, url: f.url || '' };
        }));
      }
      this.cdr.detectChanges();
    } catch (err) {
      console.error('제출 데이터 로드 실패:', err);
    }
  }

  selectDetailTab(tab: string): void {
    this.activeDetailTab.set(tab);
  }

  goBack(): void {
    if (this.isEditMode) {
      this.router.navigate(['/my-bootcamp', this.bootcampId, 'submission', this.submissionId]);
    } else {
      this.router.navigate(['/my-bootcamp', this.bootcampId, 'assignment', this.assignmentId]);
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
            // 커서를 이미지 뒤로
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

      // UI에 uploading 상태로 추가
      this.uploadedFiles.update(files => [...files, {
        name: file.name.replace(`.${ext}`, ''),
        extension: ext,
        size: `${sizeKB}KB`,
        status: 'uploading' as const,
      }]);

      // Supabase 업로드
      try {
        const result = await this.api.upload.single(file, 'assignments');
        this.uploadedFiles.update(files => files.map((f, j) =>
          j === idx ? { ...f, status: 'done' as const, url: result.url, path: result.path } : f
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
        .filter(f => f.status === 'done' && f.url)
        .map(f => ({ url: f.url ?? '', name: f.name + '.' + f.extension, size: 0, mimeType: '' }));
      const payload = { title: this.title, content: this.content, files };
      if (this.isEditMode) {
        await this.api.submissions.update(Number(this.submissionId), payload);
      } else {
        await this.api.submissions.create(Number(this.assignmentId), payload);
      }
      this.goBack();
    } catch (err) {
      console.error('제출 실패:', err);
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
