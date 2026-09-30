import { formatDate } from '../../shared/format-date';
import { Component, signal, computed, inject, OnInit, HostListener } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../shared/toast/toast.service';
import { Lecture } from '../../shared/types';

interface CourseInfo {
  id: number;
  name: string;
  status: string;
  createdAt: string;
}

interface LectureInfo {
  id: number;
  category: string;
  name: string;
  createdAt: string;
  videoUrl: string;
  videoDuration: string;
  content: string;
  thumbnail: string;
  materials: { id: number; name: string; url: string; size: number; mimeType: string }[];
}

interface LectureResponse {
  id: number;
  title?: string;
  category?: string;
  createdAt?: string;
  videoUrl?: string;
  duration?: string;
  content?: string;
  body?: string;
  thumbnail?: string;
  files?: { id: number; name: string; url: string; size: number; mimeType: string }[];
  course?: { id: number; name?: string; title?: string; status?: string; createdAt?: string };
}

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
  private sanitizer = inject(DomSanitizer);

  courseInfoOpen = signal(true);
  lectureInfoOpen = signal(true);
  lectureContentOpen = signal(true);

  toggleCourseInfo(): void { this.courseInfoOpen.update(v => !v); }
  toggleLectureInfo(): void { this.lectureInfoOpen.update(v => !v); }
  toggleLectureContent(): void { this.lectureContentOpen.update(v => !v); }

  // ===== 강의 기본 정보 케밥 =====
  lectureInfoMenuOpen = signal(false);
  toggleLectureInfoMenu(event?: Event): void { event?.stopPropagation(); this.lectureInfoMenuOpen.update(v => !v); }

  @HostListener('document:click')
  onDocumentClick(): void { this.lectureInfoMenuOpen.set(false); }
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
  courseData = signal<CourseInfo>({ id: 0, name: '', status: '', createdAt: '' });
  lectureData = signal<LectureInfo>({ id: 0, category: '', name: '', createdAt: '', videoUrl: '', videoDuration: '', content: '', thumbnail: '', materials: [] });

  ngOnInit(): void {
    const lectureId = this.route.snapshot.paramMap.get('lectureId')
      || this.route.snapshot.paramMap.get('id') || '';
    if (lectureId) this.loadLecture(Number(lectureId));
  }

  private async loadLecture(id: number): Promise<void> {
    try {
      const lecture: LectureResponse = await this.api.lectures.findOne(id);
      this.lectureData.set({
        id: lecture.id, category: lecture.category || '',
        name: lecture.title || '', createdAt: lecture.createdAt ? formatDate(lecture.createdAt) : '',
        videoUrl: lecture.videoUrl || '', videoDuration: lecture.duration || '',
        content: lecture.content || lecture.body || '', thumbnail: lecture.thumbnail || '',
        materials: lecture.files || [],
      });
      if (lecture.course) {
        const SM: Record<string, string> = { PENDING: '노출', IN_PROGRESS: '진행중', COMPLETED: '완료', VISIBLE: '노출', HIDDEN: '숨김' };
        this.courseData.set({
          id: lecture.course.id,
          name: lecture.course.name || lecture.course.title || '',
          status: SM[lecture.course.status || ''] || lecture.course.status || '',
          createdAt: lecture.course.createdAt ? formatDate(lecture.course.createdAt) : '',
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
      await this.api.lectures.update(this.lectureData().id, { title, category: this.editCategory(), content: this.editContent() } as Record<string, string>);
      this.toast.success('수정 완료 되었습니다.');
      this.editDrawerOpen.set(false);
      await this.loadLecture(this.lectureData().id);
    } catch { this.toast.error('수정에 실패했습니다.'); }
  }

  // ===== 상세내용 인라인 편집 =====
  contentEditMode = signal(false);
  contentEditVideoUrl = signal('');
  contentEditContent = signal('');
  contentEditThumbnail = signal('');
  isThumbnailUploading = signal(false);

  toggleContentEditMode(): void {
    if (!this.contentEditMode()) {
      this.contentEditVideoUrl.set(this.lectureData().videoUrl || '');
      this.contentEditContent.set(this.lectureData().content || '');
      this.contentEditThumbnail.set(this.lectureData().thumbnail || '');
    }
    this.contentEditMode.update(v => !v);
  }

  getYoutubeVideoId(url: string): string {
    if (!url) return '';
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/|youtube\.com\/live\/|music\.youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : '';
  }

  getYoutubeEmbedUrl(url: string): string {
    const videoId = this.getYoutubeVideoId(url);
    return videoId ? `https://www.youtube.com/embed/${videoId}` : '';
  }

  getYoutubeThumbnail(url: string): string {
    const videoId = this.getYoutubeVideoId(url);
    return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : '';
  }

  currentThumbnail = computed(() => {
    const adminThumb = this.contentEditMode() ? this.contentEditThumbnail() : (this.lectureData().thumbnail || '');
    if (adminThumb) return adminThumb;
    // 관리자 업로드 썸네일이 없으면 YouTube 임베딩 썸네일 사용
    const videoUrl = this.contentEditMode() ? this.contentEditVideoUrl() : (this.lectureData().videoUrl || '');
    return this.getYoutubeThumbnail(videoUrl);
  });

  currentEmbedUrl = computed((): SafeResourceUrl | null => {
    const url = this.contentEditMode() ? this.contentEditVideoUrl() : (this.lectureData().videoUrl || '');
    const embedUrl = this.getYoutubeEmbedUrl(url);
    return embedUrl ? this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl) : null;
  });

  async onThumbnailSelect(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { this.toast.error('이미지 파일만 업로드 가능합니다.'); return; }
    try {
      this.isThumbnailUploading.set(true);
      const uploaded = await this.api.uploadFile(file, 'thumbnails');
      this.contentEditThumbnail.set(uploaded.url);
    } catch { this.toast.error('썸네일 업로드에 실패했습니다.'); }
    finally { this.isThumbnailUploading.set(false); input.value = ''; }
  }

  removeThumbnail(): void {
    this.contentEditThumbnail.set('');
  }

  async saveContentEdit(): Promise<void> {
    try {
      await this.api.lectures.update(this.lectureData().id, {
        videoUrl: this.contentEditVideoUrl(),
        content: this.contentEditContent(),
        thumbnail: this.contentEditThumbnail(),
      } as Partial<Lecture>);
      this.toast.success('수정 완료 되었습니다.');
      this.contentEditMode.set(false);
      await this.loadLecture(this.lectureData().id);
    } catch (err) {
      console.error('강의 상세내용 저장 실패:', err);
      this.toast.error('수정에 실패했습니다.');
    }
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
    } catch {
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
    } catch {
      this.toast.error('파일 삭제에 실패했습니다.');
    }
  }

  async downloadMaterial(mat: { name?: string; url?: string }): Promise<void> {
    if (!mat.url) { this.toast.error('다운로드 URL이 없습니다.'); return; }
    try {
      const res = await fetch(mat.url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = mat.name || 'file';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      this.toast.error('다운로드에 실패했습니다.');
    }
  }

  goBack(): void { this.location.back(); }
}
