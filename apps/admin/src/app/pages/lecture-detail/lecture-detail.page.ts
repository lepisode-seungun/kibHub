import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';

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

  courseInfoOpen = signal(true);
  lectureInfoOpen = signal(true);
  lectureContentOpen = signal(true);

  toggleCourseInfo(): void { this.courseInfoOpen.update(v => !v); }
  toggleLectureInfo(): void { this.lectureInfoOpen.update(v => !v); }
  toggleLectureContent(): void { this.lectureContentOpen.update(v => !v); }

  lectureInfoMenuOpen = signal(false);
  toggleLectureInfoMenu(): void { this.lectureInfoMenuOpen.update(v => !v); }
  onLectureInfoMenuAction(action: string): void {
    this.lectureInfoMenuOpen.set(false);
    if (action === 'delete') {
      this.showDeleteModal.set(true);
    }
  }

  showDeleteModal = signal(false);

  async confirmDelete(): Promise<void> {
    try {
      await this.api.lectures.delete(this.lectureData.id);
    } catch (err) {
      console.error('강의 삭제 실패:', err);
    }
    this.showDeleteModal.set(false);
    this.location.back();
  }

  cancelDelete(): void {
    this.showDeleteModal.set(false);
  }

  courseData: any = {};
  lectureData: any = {};

  ngOnInit(): void {
    this.route.paramMap.subscribe(async (params) => {
      const id = params.get('id');
      if (id) {
        try {
          const lecture: any = await this.api.lectures.findOne(Number(id));
          this.lectureData = {
            id: lecture.id,
            category: lecture.category || '',
            name: lecture.title || '',
            createdAt: lecture.createdAt,
            videoUrl: lecture.videoUrl || '',
            videoDuration: lecture.duration || '',
            content: lecture.body || '',
            materials: lecture.files || [],
          };
          if (lecture.course) {
            this.courseData = {
              id: lecture.course.id,
              name: lecture.course.title || '',
            };
          }
        } catch (err) {
          console.error('강의 로드 실패:', err);
        }
      }
    });
  }

  goBack(): void {
    this.location.back();
  }
}
