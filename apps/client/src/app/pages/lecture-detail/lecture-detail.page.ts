import { Component, OnInit, OnDestroy, signal, inject, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ApiService } from '../../services/api.service';
import { downloadFile as _downloadFile } from '../../utils/file.utils';

interface LearningFile {
  name: string;
  url?: string;
}

interface LectureDetail {
  title?: string;
  content?: string;
  body?: string;
  duration?: string;
  category?: string;
  videoUrl?: string;
  course?: { id?: number; name?: string; title?: string };
  files?: { name: string; url: string }[];
}

@Component({
  selector: 'app-lecture-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './lecture-detail.page.html',
  styleUrls: ['./lecture-detail.page.css'],
})
export class LectureDetailPage implements OnInit, OnDestroy {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);
  private sanitizer = inject(DomSanitizer);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);
  private ytPlayer: { destroy(): void } | null = null;

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
  private courseId = 0;
  private navItems: { type: 'lecture' | 'assignment'; id: number }[] = [];

  ngOnInit(): void {
    this.route.paramMap.subscribe(async (params) => {
      this.bootcampId = params.get('bootcampId') || '';
      this.lectureId = params.get('lectureId') || '';
      // 기존 YouTube iframe 정리
      this.youtubeEmbedUrl = null;
      if (this.ytPlayer) {
        try { this.ytPlayer.destroy(); } catch { /* ignore */ }
        this.ytPlayer = null;
      }
      this.navItems = [];
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
      const lecture: LectureDetail = await this.api.lectures.findOne(id);
      this.lectureTitle.set(lecture.title || '');
      this.description.set(lecture.content || lecture.body || '');
      this.duration.set(lecture.duration || '');
      this.category.set(lecture.category || '');
      this.videoUrl.set(lecture.videoUrl || '');
      this.updateYoutubeEmbed();
      if (lecture.course) {
        this.courseLabel.set(lecture.course.name || lecture.course.title || '');
        if (lecture.course.id) this.courseId = lecture.course.id;
      }
      if (this.navItems.length === 0) {
        await this.loadNavItems();
      }
      if (lecture.files && lecture.files.length > 0) {
        this.learningFiles.set(lecture.files.map((f: { name: string; url: string }) => ({ name: f.name, url: f.url })));
      } else {
        this.learningFiles.set([]);
      }
      this.cdr.markForCheck();
    } catch (err) {
      console.error('강의 로드 실패:', err);
    }
  }

  youtubeEmbedUrl: SafeResourceUrl | null = null;
  private youtubeVideoId = '';

  private updateYoutubeEmbed(): void {
    const url = this.videoUrl();
    if (!url) { this.youtubeEmbedUrl = null; return; }
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
    if (match) {
      this.youtubeVideoId = match[1];
      // null 설정 후 다음 틱에서 새 URL 적용 → iframe 강제 재생성
      this.youtubeEmbedUrl = null;
      this.cdr.detectChanges();
      setTimeout(() => {
        this.youtubeEmbedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube.com/embed/${match[1]}`);
        this.cdr.markForCheck();
      }, 50);
      // DB에 duration이 없으면 YouTube API로 가져오기
      if (!this.duration()) {
        this.fetchYoutubeDuration(match[1]);
      }
    } else {
      this.youtubeEmbedUrl = null;
    }
  }

  /** YouTube IFrame API로 영상 길이 가져오기 */
  private fetchYoutubeDuration(videoId: string): void {
    const loadApi = () => {
      // 숨겨진 div에 플레이어 생성 (duration 조회 전용)
      const container = document.createElement('div');
      container.id = 'yt-duration-player';
      container.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:1px;height:1px;overflow:hidden;';
      document.body.appendChild(container);

      this.ytPlayer = new (window as unknown as { YT: { Player: new (id: string, opts: Record<string, unknown>) => { destroy(): void } } }).YT.Player('yt-duration-player', {
        videoId,
        events: {
          onReady: (event: { target: { getDuration(): number; destroy(): void } }) => {
            const sec = event.target.getDuration();
            if (sec > 0) {
              const min = Math.floor(sec / 60);
              const s = Math.floor(sec % 60);
              const formatted = `${min}:${s.toString().padStart(2, '0')}`;
              this.ngZone.run(() => {
                this.duration.set(formatted);
                this.cdr.markForCheck();
              });
            }
            // 플레이어 정리
            event.target.destroy();
            container.remove();
            this.ytPlayer = null;
          },
        },
      });
    };

    const waitForYT = (callback: () => void) => {
      if ((window as unknown as Record<string, Record<string, unknown>>)['YT']?.['Player']) {
        callback();
        return;
      }
      if (!document.getElementById('yt-iframe-api')) {
        const tag = document.createElement('script');
        tag.id = 'yt-iframe-api';
        tag.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(tag);
      }
      const interval = setInterval(() => {
        if ((window as unknown as Record<string, Record<string, unknown>>)['YT']?.['Player']) {
          clearInterval(interval);
          callback();
        }
      }, 200);
      setTimeout(() => clearInterval(interval), 10000);
    };

    waitForYT(() => loadApi());
  }

  ngOnDestroy(): void {
    if (this.ytPlayer) {
      try { this.ytPlayer.destroy(); } catch { /* ignore */ }
    }
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

  private async loadNavItems(): Promise<void> {
    try {
      if (this.returnTab === '학습목록' && this.courseId) {
        // 학습목록 탭: 같은 과정 내 강의+과제 통합 순서
        const lectures = await this.api.lectures.findByCourse(this.courseId);
        const assignments = await this.api.assignments.findByCourse(this.courseId);
        this.navItems = [
          ...lectures.map(l => ({ type: 'lecture' as const, id: l.id })),
          ...assignments.map(a => ({ type: 'assignment' as const, id: a.id })),
        ];
      } else {
        // 강의 탭 등: 부트캠프 전체 강의만
        const courses = await this.api.courses.findByBootcamp(Number(this.bootcampId));
        const allItems: { type: 'lecture' | 'assignment'; id: number }[] = [];
        for (const course of courses) {
          const lectures = await this.api.lectures.findByCourse(course.id);
          lectures.forEach(l => allItems.push({ type: 'lecture', id: l.id }));
        }
        this.navItems = allItems;
      }
    } catch { /* ignore */ }
  }

  goNextLecture(): void {
    const currentId = Number(this.lectureId);
    const idx = this.navItems.findIndex(n => n.type === 'lecture' && n.id === currentId);
    if (idx === -1 || idx >= this.navItems.length - 1) {
      alert('마지막 항목입니다.');
      return;
    }
    const next = this.navItems[idx + 1];
    if (next.type === 'assignment') {
      this.router.navigate(
        ['/my-bootcamp', this.bootcampId, 'assignment', next.id],
        { queryParams: this.returnTab ? { tab: this.returnTab } : {} }
      );
    } else {
      this.router.navigate(
        ['/my-bootcamp', this.bootcampId, 'lecture', next.id],
        { queryParams: this.returnTab ? { tab: this.returnTab } : {} }
      );
    }
  }

  togglePlay(): void {
    this.isPlaying.update(v => !v);
  }

  toggleMaterial(): void {
    this.isMaterialOpen.update(v => !v);
  }

  downloadFile(file: LearningFile): void {
    _downloadFile(file.url, file.name);
  }
}
