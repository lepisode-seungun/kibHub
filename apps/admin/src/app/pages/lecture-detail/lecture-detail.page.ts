import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../shared/toast/toast.service';

@Component({
  selector: 'adm-lecture-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lecture-detail.page.html',
  styleUrl: './lecture-detail.page.css',
})
export class LectureDetailPage implements OnInit {
  private location = inject(Location);
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);
  private toast = inject(ToastService);

  courseInfoOpen = signal(true);
  lectureInfoOpen = signal(true);
  lectureContentOpen = signal(true);

  toggleCourseInfo(): void { this.courseInfoOpen.update(v => !v); }
  toggleLectureInfo(): void { this.lectureInfoOpen.update(v => !v); }
  toggleLectureContent(): void { this.lectureContentOpen.update(v => !v); }

  // ===== 강의 기본 정보 케밥 =====
  lectureInfoMenuOpen = signal(false);
  toggleLectureInfoMenu(): void { this.lectureInfoMenuOpen.update(v => !v); }
  onLectureInfoMenuAction(action: string): void {
    this.lectureInfoMenuOpen.set(false);
    if (action === 'edit') this.openEditDrawer();
    else if (action === 'delete') this.showDeleteModal.set(true);
  }

  // ===== 강의 삭제 =====
  showDeleteModal = signal(false);
  async confirmDelete(): Promise<void> {
    try {
      await this.api.lectures.delete(this.lectureData().id);
      this.toast.success('삭제 완료 되었습니다.');
    } catch (err) { console.error('강의 삭제 실패:', err); }
    this.showDeleteModal.set(false);
    this.location.back();
  }
  cancelDelete(): void { this.showDeleteModal.set(false); }

  // ===== 데이터 =====
  courseData = signal<any>({});
  lectureData = signal<any>({});

  ngOnInit(): void {
    const lectureId = this.route.snapshot.paramMap.get('lectureId')
      || this.route.snapshot.paramMap.get('id') || '';
    if (lectureId) this.loadLecture(Number(lectureId));
  }

  private async loadLecture(id: number): Promise<void> {
    try {
      const lecture: any = await this.api.lectures.findOne(id);
      this.lectureData.set({
        id: lecture.id, category: lecture.category || '',
        name: lecture.title || '', createdAt: lecture.createdAt,
        videoUrl: lecture.videoUrl || '', videoDuration: lecture.duration || '',
        content: lecture.content || lecture.body || '', materials: lecture.files || [],
      });
      if (lecture.course) {
        const SM: Record<string, string> = { PENDING: '대기', IN_PROGRESS: '진행중', COMPLETED: '완료' };
        this.courseData.set({
          id: lecture.course.id,
          name: lecture.course.name || lecture.course.title || '',
          status: SM[lecture.course.status] || lecture.course.status || '',
          createdAt: lecture.course.createdAt ? new Date(lecture.course.createdAt).toLocaleString('ko-KR') : '',
        });
      }
    } catch (err) { console.error('강의 로드 실패:', err); }
  }

  // ===== 강의 수정 드로어 =====
  editDrawerOpen = signal(false);
  editTitle = signal('');
  editCategory = signal('');
  editContent = signal('');

  openEditDrawer(): void {
    const d = this.lectureData();
    this.editTitle.set(d.name || '');
    this.editCategory.set(d.category || '');
    this.editContent.set(d.content || '');
    this.editDrawerOpen.set(true);
  }
  closeEditDrawer(): void { this.editDrawerOpen.set(false); }

  async submitEdit(): Promise<void> {
    const title = this.editTitle().trim();
    if (!title) { this.toast.error('강의명을 입력해주세요.'); return; }
    try {
      await this.api.lectures.update(this.lectureData().id, { title, category: this.editCategory(), content: this.editContent() } as any);
      this.toast.success('수정 완료 되었습니다.');
      this.editDrawerOpen.set(false);
      await this.loadLecture(this.lectureData().id);
    } catch (e) { this.toast.error('수정에 실패했습니다.'); }
  }

  // ===== 상세내용 인라인 편집 =====
  contentEditMode = signal(false);
  contentEditVideoUrl = signal('');
  contentEditContent = signal('');

  toggleContentEditMode(): void {
    if (!this.contentEditMode()) {
      this.contentEditVideoUrl.set(this.lectureData().videoUrl || '');
      this.contentEditContent.set(this.lectureData().content || '');
    }
    this.contentEditMode.update(v => !v);
  }

  getYoutubeThumbnail(url: string): string {
    if (!url) return '';
    // youtube.com/watch?v=ID
    let match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
    if (match) return `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
    return '';
  }

  get currentThumbnail(): string {
    const url = this.contentEditMode() ? this.contentEditVideoUrl() : (this.lectureData().videoUrl || '');
    return this.getYoutubeThumbnail(url);
  }

  async saveContentEdit(): Promise<void> {
    try {
      await this.api.lectures.update(this.lectureData().id, {
        videoUrl: this.contentEditVideoUrl(),
        content: this.contentEditContent(),
      } as any);
      this.toast.success('수정 완료 되었습니다.');
      this.contentEditMode.set(false);
      await this.loadLecture(this.lectureData().id);
    } catch (e) { this.toast.error('수정에 실패했습니다.'); }
  }

  cancelContentEdit(): void { this.contentEditMode.set(false); }

  // ===== 학습자료 파일 업로드/삭제 =====
  isUploading = signal(false);

  async onMaterialFileSelect(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    this.isUploading.set(true);
    try {
      const files = Array.from(input.files);
      for (const file of files) {
        const uploaded = await this.api.uploadFile(file, 'lectures');
        await this.api.lectureFiles.add(this.lectureData().id, {
          name: file.name,
          url: uploaded.url,
          size: file.size,
          mimeType: file.type,
        });
      }
      this.toast.success(`${files.length}개 파일 업로드 완료`);
      await this.loadLecture(this.lectureData().id);
    } catch (e) {
      this.toast.error('파일 업로드에 실패했습니다.');
    } finally {
      this.isUploading.set(false);
      input.value = '';
    }
  }

  async removeMaterial(fileId: number): Promise<void> {
    try {
      await this.api.lectureFiles.delete(fileId);
      this.toast.success('파일이 삭제되었습니다.');
      await this.loadLecture(this.lectureData().id);
    } catch (e) {
      this.toast.error('파일 삭제에 실패했습니다.');
    }
  }

  goBack(): void { this.location.back(); }
}
