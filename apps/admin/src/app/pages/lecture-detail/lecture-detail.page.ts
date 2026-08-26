import { Component, signal, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';

@Component({
  selector: 'adm-lecture-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lecture-detail.page.html',
  styleUrl: './lecture-detail.page.css',
})
export class LectureDetailPage {
  private location = inject(Location);

  // 아코디언 상태
  courseInfoOpen = signal(true);
  lectureInfoOpen = signal(true);
  lectureContentOpen = signal(true);

  toggleCourseInfo(): void { this.courseInfoOpen.update(v => !v); }
  toggleLectureInfo(): void { this.lectureInfoOpen.update(v => !v); }
  toggleLectureContent(): void { this.lectureContentOpen.update(v => !v); }

  // 강의 기본 정보 드롭다운
  lectureInfoMenuOpen = signal(false);
  toggleLectureInfoMenu(): void { this.lectureInfoMenuOpen.update(v => !v); }
  onLectureInfoMenuAction(action: string): void {
    this.lectureInfoMenuOpen.set(false);
    if (action === 'delete') {
      this.showDeleteModal.set(true);
    }
  }

  // 삭제 확인 모달
  showDeleteModal = signal(false);

  confirmDelete(): void {
    this.showDeleteModal.set(false);
    this.location.back();
  }

  cancelDelete(): void {
    this.showDeleteModal.set(false);
  }

  // 샘플 데이터
  courseData = {
    id: 1,
    status: '노출',
    name: '웹툰의 기초',
    createdAt: '2025-01-20 13:11',
  };

  lectureData = {
    id: 1,
    category: '작화',
    name: '얼굴 그리기',
    createdAt: '2025-01-20 13:11',
    videoUrl: 'https://vimeo.com/1048803857/8709552d2e',
    videoDuration: '12:30',
    content: '얼굴 그리기얼굴 그리기얼굴 그리기얼굴 그리기얼굴 그리기 얼굴 그리기얼굴 그리기얼굴 그리기얼굴 그리기얼굴 그리기얼굴 그리기얼굴 그리기얼굴 그리기얼굴 그리기얼굴 그리기얼굴 그리기얼굴 그리기얼굴 그리기얼굴 그리기얼굴 그리기얼굴 그리기얼굴 그리기얼굴 그리기얼굴 그리기얼굴 그리기얼굴 그리기얼굴 그리기얼굴 그리기얼굴 그리기얼굴 그리기',
    materials: [
      { name: '학습자료학습자료학습자료학습자료학습자료학습자료학습자료', size: '10.2MB' },
      { name: '학습자료.pdf', size: '10.2MB' },
    ],
  };

  goBack(): void {
    this.location.back();
  }
}
