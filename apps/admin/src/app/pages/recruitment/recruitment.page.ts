import { Component, signal, inject, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataGridComponent, GridColumn } from '../../components/data-grid/data-grid.component';
import { ImageUploadComponent, ImageUploadData } from '../../components/image-upload/image-upload.component';
import { ApiService } from '../../services/api.service';
import { BootcampContextService } from '../../services/bootcamp-context.service';
import { RecruitInstructor } from '../../shared/types';
import { ToastService } from '../../shared/toast/toast.service';

@Component({
  selector: 'adm-recruitment',
  standalone: true,
  imports: [CommonModule, DataGridComponent, ImageUploadComponent],
  templateUrl: './recruitment.page.html',
  styleUrl: './recruitment.page.css',
})
export class RecruitmentPage implements OnInit, AfterViewChecked {
  private api = inject(ApiService);
  private bootcampCtx = inject(BootcampContextService);
  private toast = inject(ToastService);

  @ViewChild('editorBody') editorBody!: ElementRef<HTMLDivElement>;

  activeTab = signal<'intro' | 'curriculum' | 'instructor' | 'review'>('intro');
  isSaving = signal(false);
  private pendingEditorSync = false;
  private lastSyncedTab = '';

  setTab(tab: 'intro' | 'curriculum' | 'instructor' | 'review'): void {
    // 에디터 탭에서 나갈 때만 내용 저장 (instructor 탭은 에디터 없음)
    const currentTab = this.activeTab();
    if (currentTab !== 'instructor') {
      this.syncEditorToSignal();
    }
    this.colorPaletteOpen.set(false);
    this.activeTab.set(tab);
    this.pendingEditorSync = true;
    this.lastSyncedTab = ''; // 강제 리로드
  }

  // 각 탭별 에디터 내용 (HTML)
  introContent = signal('');
  curriculumContent = signal('');
  reviewContent = signal('');

  async ngOnInit(): Promise<void> {
    const id = this.bootcampCtx.currentBootcampId();
    if (id) {
      try {
        const bc = await this.api.bootcamps.findOne(id);
        this.introContent.set(bc.recruitIntro || '');
        this.curriculumContent.set(bc.recruitCurriculum || '');
        this.reviewContent.set(bc.recruitReview || '');
        if (bc.recruitInstructors && Array.isArray(bc.recruitInstructors)) {
          this.loadInstructors(bc.recruitInstructors as any[]);
        }
      } catch (e) {
        console.error('모집페이지 데이터 로드 실패:', e);
      }
    }
    // DOM이 준비된 후 에디터에 내용 로드
    this.loadEditorContent();
  }

  ngAfterViewChecked(): void {
    if (!this.pendingEditorSync) return;
    const tab = this.activeTab();
    if (tab === 'instructor') {
      this.pendingEditorSync = false;
      return;
    }
    if (this.editorBody?.nativeElement) {
      this.editorBody.nativeElement.innerHTML = this.getCurrentContent();
      this.pendingEditorSync = false;
    }
  }

  /** DOM 준비 후 에디터에 내용 로드 */
  private loadEditorContent(): void {
    setTimeout(() => {
      if (this.editorBody?.nativeElement && this.activeTab() !== 'instructor') {
        this.editorBody.nativeElement.innerHTML = this.getCurrentContent();
      }
    }, 0);
  }

  /** contenteditable div → signal 동기화 */
  syncEditorToSignal(): void {
    if (!this.editorBody?.nativeElement) return;
    const html = this.editorBody.nativeElement.innerHTML;
    // 빈 에디터거나 placeholder만 있으면 저장하지 않음
    if (!html || html === '<br>' || html === '<p><br></p>') return;
    const tab = this.activeTab();
    if (tab === 'intro') this.introContent.set(html);
    else if (tab === 'curriculum') this.curriculumContent.set(html);
    else if (tab === 'review') this.reviewContent.set(html);
  }

  onEditorInput(): void {
    this.syncEditorToSignal();
  }

  getCurrentContent(): string {
    const tab = this.activeTab();
    if (tab === 'intro') return this.introContent();
    if (tab === 'curriculum') return this.curriculumContent();
    return this.reviewContent();
  }

  // ===== 에디터 서식 명령 =====
  execCommand(command: string, value?: string): void {
    document.execCommand(command, false, value || '');
    this.editorBody?.nativeElement.focus();
    this.syncEditorToSignal();
  }

  onBold(): void { this.execCommand('bold'); }
  onItalic(): void { this.execCommand('italic'); }
  onUnderline(): void { this.execCommand('underline'); }
  onUnorderedList(): void { this.execCommand('insertUnorderedList'); }
  onOrderedList(): void { this.execCommand('insertOrderedList'); }
  onAlignLeft(): void { this.alignContent('left'); }
  onAlignCenter(): void { this.alignContent('center'); }
  onAlignRight(): void { this.alignContent('right'); }

  /** 마지막으로 클릭된 이미지 */
  private selectedImage: HTMLImageElement | null = null;

  /** 에디터 클릭 시 이미지 선택 추적 */
  onEditorClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (target instanceof HTMLImageElement) {
      this.selectedImage = target;
    } else {
      this.selectedImage = null;
    }
  }

  private alignContent(align: string): void {
    // 선택된 이미지가 있으면 이미지에 직접 인라인 스타일 적용
    if (this.selectedImage) {
      const img = this.selectedImage;
      img.style.display = 'block';
      if (align === 'center') {
        img.style.marginLeft = 'auto';
        img.style.marginRight = 'auto';
      } else if (align === 'right') {
        img.style.marginLeft = 'auto';
        img.style.marginRight = '0';
      } else {
        img.style.marginLeft = '0';
        img.style.marginRight = 'auto';
      }
      this.syncEditorToSignal();
      return;
    }
    // 일반 텍스트는 기존 execCommand 사용
    const cmd = align === 'left' ? 'justifyLeft' : align === 'center' ? 'justifyCenter' : 'justifyRight';
    this.execCommand(cmd);
  }

  onLink(): void {
    const url = prompt('링크 URL을 입력하세요:', 'https://');
    if (url) this.execCommand('createLink', url);
  }

  onImage(): void {
    // 업로드 전 현재 정렬 상태를 queryCommandState로 확인
    let currentAlign = 'left';
    if (document.queryCommandState('justifyCenter')) currentAlign = 'center';
    else if (document.queryCommandState('justifyRight')) currentAlign = 'right';
    else if (document.queryCommandState('justifyFull')) currentAlign = 'justify';

    // Selection 저장
    const sel = window.getSelection();
    let savedRange: Range | null = null;
    if (sel && sel.rangeCount > 0) {
      savedRange = sel.getRangeAt(0).cloneRange();
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const result = await this.api.upload.single(file, 'editor');

        // 정렬에 따른 인라인 스타일
        let imgStyle = 'display:block;';
        if (currentAlign === 'center') {
          imgStyle += 'margin-left:auto;margin-right:auto;';
        } else if (currentAlign === 'right') {
          imgStyle += 'margin-left:auto;margin-right:0;';
        } else {
          imgStyle += 'margin-left:0;margin-right:auto;';
        }

        // Selection 복원 후 삽입
        const el = this.editorBody?.nativeElement;
        if (el) {
          el.focus();
          if (savedRange) {
            const s = window.getSelection();
            s?.removeAllRanges();
            s?.addRange(savedRange);
          }
          document.execCommand('insertHTML', false,
            `<img src="${result.url}" style="${imgStyle}" /><br>`
          );
        }
        this.syncEditorToSignal();
      } catch (e) {
        this.toast.error('이미지 업로드에 실패했습니다.');
        console.error(e);
      }
    };
    input.click();
  }

  onFontSize(): void {
    const size = prompt('폰트 크기 (1~7):', '3');
    if (size) this.execCommand('fontSize', size);
  }

  // ===== 글씨색 팔레트 =====
  colorPaletteOpen = signal(false);
  colorPresets = [
    '#FFFFFF', '#000000', '#434343', '#666666',
    '#999999', '#EF4444', '#F97316', '#EAB308',
    '#22C55E', '#3B82F6', '#6366F1', '#A855F7',
    '#EC4899', '#7C2D12', '#14532D', '#1E3A5F',
  ];

  onFontColor(): void {
    this.colorPaletteOpen.update(v => !v);
  }

  applyColor(color: string): void {
    this.colorPaletteOpen.set(false);
    this.execCommand('foreColor', color);
  }

  async saveCurrentTab(): Promise<void> {
    this.syncEditorToSignal();
    const id = this.bootcampCtx.currentBootcampId();
    if (!id) {
      this.toast.error('부트캠프가 선택되지 않았습니다.');
      return;
    }
    if (this.isSaving()) return;
    this.isSaving.set(true);
    try {
      const tab = this.activeTab();
      let data: any = {};
      if (tab === 'intro') data = { recruitIntro: this.introContent() };
      else if (tab === 'curriculum') data = { recruitCurriculum: this.curriculumContent() };
      else if (tab === 'review') data = { recruitReview: this.reviewContent() };
      await this.api.bootcamps.update(id, data);
      this.toast.success('저장 완료 되었습니다.');
    } catch (e: any) {
      const msg = e?.error?.message || e?.message || '저장 실패';
      this.toast.error(msg);
      console.error('저장 실패:', e);
    } finally {
      this.isSaving.set(false);
    }
  }

  // ===== 강사소개 그리드 =====
  instructorColumns: GridColumn[] = [
    { key: 'id', label: '순번', width: '60px' },
    { key: 'photo', label: '썸네일', width: '120px', type: 'image' },
    { key: 'name', label: '이름', width: '120px' },
    { key: 'summary', label: '요약설명' },
    { key: 'badge', label: '대표작', width: '140px' },
    { key: 'menu', label: '', width: '50px', type: 'drag' },
  ];

  instructorData = signal<any[]>([]);

  // ===== 강사 등록/수정 드로어 =====
  instructorDrawerOpen = signal(false);
  editingInstructorIndex = signal<number | null>(null);
  instructorName = signal('');
  instructorSummary = signal('');
  instructorBadge = signal('');
  instructorWork = signal('');
  instructorUploadFile = signal<File | null>(null);
  instructorExistingPhoto = signal('');

  /** 등록 드로어 열기 (빈 폼) */
  openInstructorDrawer(): void {
    this.editingInstructorIndex.set(null);
    this.instructorName.set('');
    this.instructorSummary.set('');
    this.instructorBadge.set('');
    this.instructorWork.set('');
    this.instructorUploadFile.set(null);
    this.instructorExistingPhoto.set('');
    this.instructorDrawerOpen.set(true);
  }

  /** 수정 드로어 열기 (기존 데이터 프리필) */
  editInstructor(index: number): void {
    const inst = this.instructorData()[index];
    if (!inst) return;
    this.editingInstructorIndex.set(index);
    this.instructorName.set(inst.name || '');
    this.instructorSummary.set(inst.summary || '');
    this.instructorBadge.set(inst.badge || '');
    this.instructorWork.set(inst.work || '');
    this.instructorUploadFile.set(null);
    this.instructorExistingPhoto.set(inst.photo || '');
    this.instructorDrawerOpen.set(true);
  }

  closeInstructorDrawer(): void {
    this.instructorDrawerOpen.set(false);
  }

  onInstructorImageChange(data: ImageUploadData | null): void {
    this.instructorUploadFile.set(data?.file ?? null);
  }

  get isEditMode(): boolean {
    return this.editingInstructorIndex() !== null;
  }

  async submitInstructor(): Promise<void> {
    const id = this.bootcampCtx.currentBootcampId();
    if (!id) return;

    let photoUrl = this.instructorExistingPhoto();
    const file = this.instructorUploadFile();
    if (file) {
      try {
        const res = await this.api.upload.single(file, 'instructors');
        photoUrl = res.url;
      } catch (e) {
        this.toast.error('이미지 업로드에 실패했습니다.');
        console.error(e);
        return;
      }
    }

    const instData: RecruitInstructor = {
      name: this.instructorName(),
      summary: this.instructorSummary(),
      photo: photoUrl,
      badge: this.instructorBadge(),
      work: this.instructorWork(),
    };

    const current = this.instructorData();
    let updated: any[];
    const editIdx = this.editingInstructorIndex();

    if (editIdx !== null) {
      // 수정
      updated = current.map((item, i) =>
        i === editIdx ? { ...instData, id: item.id } : item
      );
    } else {
      // 등록
      updated = [...current, { ...instData, id: current.length + 1 }];
    }

    try {
      await this.api.bootcamps.update(id, { recruitInstructors: updated.map(({ id: _id, ...rest }) => rest) } as any);
      this.instructorData.set(updated);
      this.instructorDrawerOpen.set(false);
      this.toast.success(editIdx !== null ? '수정 완료 되었습니다.' : '등록 완료 되었습니다.');
    } catch (e: any) {
      this.toast.error('저장에 실패했습니다.');
      console.error(e);
    }
  }

  async deleteInstructor(index: number): Promise<void> {
    if (!confirm('이 강사를 삭제하시겠습니까?')) return;
    const id = this.bootcampCtx.currentBootcampId();
    if (!id) return;

    const updated = this.instructorData().filter((_, i) => i !== index)
      .map((item, i) => ({ ...item, id: i + 1 }));

    try {
      await this.api.bootcamps.update(id, { recruitInstructors: updated.map(({ id: _id, ...rest }) => rest) } as any);
      this.instructorData.set(updated);
      this.toast.success('삭제 완료 되었습니다.');
    } catch (e) {
      this.toast.error('삭제에 실패했습니다.');
      console.error(e);
    }
  }

  private loadInstructors(data: any[]): void {
    this.instructorData.set(
      data.map((item: any, i: number) => ({ ...item, id: i + 1 }))
    );
  }

  onInstructorContextMenu(event: { action: string; row: any }): void {
    const index = this.instructorData().indexOf(event.row);
    if (index === -1) return;
    if (event.action === '수정') {
      this.editInstructor(index);
    } else if (event.action === '삭제') {
      this.deleteInstructor(index);
    }
  }
}
