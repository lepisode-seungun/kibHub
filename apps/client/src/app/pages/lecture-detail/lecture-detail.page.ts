import { Component, OnInit, OnDestroy, AfterViewInit, signal, inject, ChangeDetectorRef, NgZone } from '@angular/core';
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
  course?: { name?: string; title?: string };
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
  private ytPlayer: any = null;

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
      const lecture: LectureDetail = await this.api.lectures.findOne(id);
      this.lectureTitle.set(lecture.title || '');
      this.description.set(lecture.content || lecture.body || '');
      this.duration.set(lecture.duration || '');
      this.category.set(lecture.category || '');
      this.videoUrl.set(lecture.videoUrl || '');
      this.updateYoutubeEmbed();
      if (lecture.course) {
        this.courseLabel.set(lecture.course.name || lecture.course.title || '');
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
      this.youtubeEmbedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube.com/embed/${match[1]}?enablejsapi=1`);
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

      this.ytPlayer = new (window as any).YT.Player('yt-duration-player', {
        videoId,
        events: {
          onReady: (event: any) => {
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
      if ((window as any).YT && (window as any).YT.Player) {
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
        if ((window as any).YT && (window as any).YT.Player) {
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

  downloadFile(file: LearningFile): void {
    _downloadFile(file.url, file.name);
  }
}
