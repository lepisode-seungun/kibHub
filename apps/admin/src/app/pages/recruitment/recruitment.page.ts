import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataGridComponent, GridColumn } from '../../components/data-grid/data-grid.component';

@Component({
  selector: 'adm-recruitment',
  standalone: true,
  imports: [CommonModule, DataGridComponent],
  templateUrl: './recruitment.page.html',
  styleUrl: './recruitment.page.css',
})
export class RecruitmentPage {
  activeTab = signal<'intro' | 'curriculum' | 'instructor' | 'review'>('intro');

  setTab(tab: 'intro' | 'curriculum' | 'instructor' | 'review'): void {
    this.activeTab.set(tab);
  }

  // 각 탭별 에디터 내용
  introContent = signal('');
  curriculumContent = signal('');
  reviewContent = signal('');

  updateContent(event: Event): void {
    const value = (event.target as HTMLTextAreaElement).value;
    const tab = this.activeTab();
    if (tab === 'intro') this.introContent.set(value);
    else if (tab === 'curriculum') this.curriculumContent.set(value);
    else if (tab === 'review') this.reviewContent.set(value);
  }

  getCurrentContent(): string {
    const tab = this.activeTab();
    if (tab === 'intro') return this.introContent();
    if (tab === 'curriculum') return this.curriculumContent();
    return this.reviewContent();
  }

  // ===== 강사소개 그리드 =====
  instructorColumns: GridColumn[] = [
    { key: 'id', label: '순번', width: '60px' },
    { key: 'thumbnail', label: '썸네일', width: '120px', type: 'image' },
    { key: 'name', label: '이름', width: '120px' },
    { key: 'summary', label: '요약설명' },
    { key: 'title', label: '대표직', width: '140px' },
    { key: 'menu', label: '', width: '50px', type: 'drag' },
  ];

  instructorData = [
    { id: 1, thumbnail: '', name: '김민수', summary: 'BD/만화 스토리텔링 전문가, 프랑스 앙굴렘 국제만화축제 초청작가', title: '앙굴렘 강사' },
    { id: 2, thumbnail: '', name: '이지은', summary: '디지털 일러스트레이션 및 캐릭터 디자인 전문', title: '일러스트 강사' },
    { id: 3, thumbnail: '', name: '박준혁', summary: '웹툰 연출 및 컷 구성 전문가, 네이버 웹툰 연재 경력 5년', title: '웹툰 강사' },
  ];

  // ===== 강사 등록 드로어 =====
  instructorDrawerOpen = signal(false);
  instructorName = signal('');
  instructorSummary = signal('');
  instructorTitle = signal('');
  instructorFile = signal<{ name: string; size: string } | null>(null);

  openInstructorDrawer(): void {
    this.instructorDrawerOpen.set(true);
  }

  closeInstructorDrawer(): void {
    this.instructorDrawerOpen.set(false);
  }

  onInstructorFileSelect(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      const sizeKB = Math.round(file.size / 1024);
      this.instructorFile.set({ name: file.name, size: sizeKB + 'KB' });
    }
  }

  removeInstructorFile(): void {
    this.instructorFile.set(null);
  }

  submitInstructor(): void {
    this.instructorDrawerOpen.set(false);
    // TODO: 등록 처리
  }
}
