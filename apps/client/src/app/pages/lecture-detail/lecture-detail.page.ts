import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';

interface LearningFile {
  name: string;
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

  lectureId = '';
  bootcampId = '';

  courseLabel = '과정1. 웹툰의 기초';
  lectureType: '강의' | '과제' = '강의';
  category = '카테고리';
  lectureTitle = '강의명강의명강의명강의명강의명강의명강의명강의명강의명강의명';
  duration = '13:27';
  description = '강의 내용 에디터 작성 '.repeat(70);

  isPlaying = signal(false);
  currentTime = '0:51';
  totalTime = '2:31';
  progress = 33;
  volume = 73;
  isMaterialOpen = signal(true);

  learningFiles: LearningFile[] = [
    { name: '학습자료_웹툰기초_이론편.pdf' },
    { name: '학습자료_웹툰기초_실습가이드.pdf' },
    { name: '학습자료.pdf' },
    { name: '참고자료.pdf' },
    { name: '과제안내.pdf' },
  ];

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.bootcampId = params.get('bootcampId') || '';
      this.lectureId = params.get('lectureId') || '';
    });
    this.route.queryParamMap.subscribe((qp) => {
      this.returnTab = qp.get('tab') || '';
    });
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
    // 추후 구현
  }

  togglePlay(): void {
    this.isPlaying.update(v => !v);
  }

  toggleMaterial(): void {
    this.isMaterialOpen.update(v => !v);
  }
}
