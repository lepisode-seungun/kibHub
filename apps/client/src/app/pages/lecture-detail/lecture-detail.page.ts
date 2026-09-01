import { Component, OnInit, signal, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ApiService } from '../../services/api.service';

interface LearningFile {
  name: string;
  url?: string;
}

@Component({
  selector: 'app-lecture-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './lecture-detail.page.html',
  styleUrls: ['./lecture-detail.page.css'],
})
export class LectureDetailPage implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);
  private sanitizer = inject(DomSanitizer);
  private cdr = inject(ChangeDetectorRef);

  lectureId = '';
  bootcampId = '';

  courseLabel = signal('');
  lectureType = signal<'강의' | '과제'>('강의');
  category = signal('');
  lectureTitle = signal('');
  duration = signal('');
  description = signal('');
  videoUrl = signal('');

  isPlaying = signal(false);
  currentTime = '0:00';
  totalTime = '0:00';
  progress = 0;
  isMaterialOpen = signal(true);

  learningFiles = signal<LearningFile[]>([]);

  ngOnInit(): void {
    this.route.paramMap.subscribe(async (params) => {
      this.bootcampId = params.get('bootcampId') || '';
      this.lectureId = params.get('lectureId') || '';
      if (this.lectureId) {
        await this.loadLecture(Number(this.lectureId));
      }
    });
    this.route.queryParamMap.subscribe((qp) => {
      this.returnTab = qp.get('tab') || '';
    });
  }

  private async loadLecture(id: number): Promise<void> {
    try {
      const lecture: any = await this.api.lectures.findOne(id);
      this.lectureTitle.set(lecture.title || '');
      this.description.set(lecture.content || lecture.body || '');
      this.duration.set(lecture.duration || '');
      this.category.set(lecture.category || '');
      this.videoUrl.set(lecture.videoUrl || '');
      if (lecture.course) {
        this.courseLabel.set(lecture.course.name || lecture.course.title || '');
      }
      if (lecture.files && lecture.files.length > 0) {
        this.learningFiles.set(lecture.files.map((f: any) => ({ name: f.name, url: f.url })));
      } else {
        this.learningFiles.set([]);
      }
      this.cdr.markForCheck();
    } catch (err) {
      console.error('강의 로드 실패:', err);
    }
  }

  get youtubeEmbedUrl(): SafeResourceUrl | null {
    const url = this.videoUrl();
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
    return match ? this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube.com/embed/${match[1]}`) : null;
  }

  returnTab = '';

  goBack(): void {
    if (this.bootcampId) {
      this.router.navigate(['/my-bootcamp', this.bootcampId], {
        queryParams: this.returnTab ? { tab: this.returnTab } : {},
      });
    } else {
      this.router.navigate(['/my-bootcamp']);
    }
  }

  goNextLecture(): void {
    const nextId = Number(this.lectureId) + 1;
    this.router.navigate(
      ['/my-bootcamp', this.bootcampId, 'lecture', nextId],
      { queryParams: this.returnTab ? { tab: this.returnTab } : {} }
    );
  }

  togglePlay(): void {
    this.isPlaying.update(v => !v);
  }

  toggleMaterial(): void {
    this.isMaterialOpen.update(v => !v);
  }
}
