import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataGridComponent, GridColumn } from '../../components/data-grid/data-grid.component';
import { ImageUploadComponent, ImageUploadData } from '../../components/image-upload/image-upload.component';
import { TextEditorComponent } from '../../components/text-editor/text-editor.component';
import { ApiService } from '../../services/api.service';
import { BootcampContextService } from '../../services/bootcamp-context.service';
import { RecruitInstructor } from '../../shared/types';
import { ToastService } from '../../shared/toast/toast.service';

@Component({
  selector: 'adm-recruitment',
  standalone: true,
  imports: [CommonModule, DataGridComponent, ImageUploadComponent, TextEditorComponent],
  templateUrl: './recruitment.page.html',
  styleUrl: './recruitment.page.css',
})
export class RecruitmentPage implements OnInit {
  private api = inject(ApiService);
  private bootcampCtx = inject(BootcampContextService);
  private toast = inject(ToastService);

  activeTab = signal<'intro' | 'curriculum' | 'instructor' | 'review'>('intro');
  isSaving = signal(false);

  setTab(tab: 'intro' | 'curriculum' | 'instructor' | 'review'): void {
    this.activeTab.set(tab);
  }

  // 각 탭별 에디터 내용 (HTML)
  introContent = signal('');
  curriculumContent = signal('');
  reviewContent = signal('');
  reviewVisibility = signal<'' | 'show' | 'hide'>('');

  async ngOnInit(): Promise<void> {
    const id = this.bootcampCtx.currentBootcampId();
    if (id) {
      try {
        const bc = await this.api.bootcamps.findOne(id);
        this.introContent.set(bc.recruitIntro || '');
        this.curriculumContent.set(bc.recruitCurriculum || '');
        this.reviewContent.set(bc.recruitReview || '');
        this.reviewVisibility.set((bc as any).recruitReviewVisibility || '');
        if (bc.recruitInstructors && Array.isArray(bc.recruitInstructors)) {
          this.loadInstructors(bc.recruitInstructors as any[]);
        }
      } catch (e) {
        console.error('모집페이지 데이터 로드 실패:', e);
      }
    }
  }

  getCurrentContent(): string {
    const tab = this.activeTab();
    if (tab === 'intro') return this.introContent();
    if (tab === 'curriculum') return this.curriculumContent();
    return this.reviewContent();
  }

  onEditorChange(html: string): void {
    const tab = this.activeTab();
    if (tab === 'intro') this.introContent.set(html);
    else if (tab === 'curriculum') this.curriculumContent.set(html);
    else if (tab === 'review') this.reviewContent.set(html);
  }

  async saveCurrentTab(): Promise<void> {
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
      else if (tab === 'review') data = { recruitReview: this.reviewContent(), recruitReviewVisibility: this.reviewVisibility() };
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
