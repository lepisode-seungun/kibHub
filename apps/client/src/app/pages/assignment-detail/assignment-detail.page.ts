import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';

interface LearningFile {
  name: string;
}

interface Submission {
  id: number;
  title: string;
  badge: '과제제출' | '피드백';
  author: string;
  date: string;
  fileName: string;
  commentCount: number;
  isReply: boolean;
  isInstructor: boolean;
}

@Component({
  selector: 'app-assignment-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './assignment-detail.page.html',
  styleUrls: ['./assignment-detail.page.css'],
})
export class AssignmentDetailPage implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  assignmentId = '';
  bootcampId = '';

  courseLabel = '과정1. 웹툰의 기초';
  assignmentTitle = '강의명강의명강의명강의명강의명강의명강의명강의명강의명강의명';
  dateRange = '2024년 1월 22일 ~ 2024년 1월 25일';
  description = '강의 내용 에디터 작성 '.repeat(70);

  isMaterialOpen = signal(true);

  detailTabs = ['학습목록', '강의', '과제', '공지사항'];
  activeDetailTab = signal('과제');

  /* 강의 섹션 */
  lectureType: '강의' | '과제' = '강의';
  category = '카테고리';
  lectureTitle = '강의명강의명강의명강의명강의명강의명강의명강의명강의명강의명';
  duration = '13:27';
  lectureDescription = '강의 내용 에디터 작성 '.repeat(70);

  isPlaying = signal(false);
  currentTime = '0:51';
  totalTime = '2:31';
  progress = 33;
  volume = 73;

  learningFiles: LearningFile[] = [
    { name: '학습자료_웹툰기초_이론편.pdf' },
    { name: '학습자료_웹툰기초_실습가이드.pdf' },
    { name: '학습자료.pdf' },
    { name: '참고자료.pdf' },
    { name: '과제안내.pdf' },
  ];

  submissions: Submission[] = [
    { id: 1, title: '과제제출명 30자 이내 과제제출명 30자 이내 과제제출', badge: '과제제출', author: '고예림', date: '2024.01.20', fileName: '과제명 30자 이내 과제명 30자 이내', commentCount: 3, isReply: false, isInstructor: false },
    { id: 2, title: '과제제출명 30자 이내 과제제출명 30자 이내 과제제출', badge: '피드백', author: '고식혜', date: '2024.01.20', fileName: '과제명 30자 이내 과제명 30자 이내', commentCount: 3, isReply: true, isInstructor: true },
    { id: 3, title: '과제제출명 30자 이내 과제제출명 30자 이내 과제제출', badge: '피드백', author: '고식혜', date: '2024.01.20', fileName: '과제명 30자 이내 과제명 30자 이내', commentCount: 3, isReply: true, isInstructor: true },
    { id: 4, title: '과제제출명 30자 이내 과제제출명 30자 이내 과제제출', badge: '과제제출', author: '고예림', date: '2024.01.20', fileName: '과제명 30자 이내 과제명 30자 이내', commentCount: 3, isReply: false, isInstructor: false },
    { id: 5, title: '과제제출명 30자 이내 과제제출명 30자 이내 과제제출', badge: '과제제출', author: '고예림', date: '2024.01.20', fileName: '과제명 30자 이내 과제명 30자 이내', commentCount: 3, isReply: false, isInstructor: false },
    { id: 6, title: '과제제출명 30자 이내 과제제출명 30자 이내 과제제출', badge: '과제제출', author: '고예림', date: '2024.01.20', fileName: '과제명 30자 이내 과제명 30자 이내', commentCount: 3, isReply: false, isInstructor: false },
  ];

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.bootcampId = params.get('bootcampId') || '';
      this.assignmentId = params.get('assignmentId') || '';
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

  goNext(): void {
    // 추후 구현
  }

  selectDetailTab(tab: string): void {
    this.activeDetailTab.set(tab);
    if (tab === '학습목록' || tab === '강의' || tab === '공지사항') {
      if (this.bootcampId) {
        this.router.navigate(['/my-bootcamp', this.bootcampId], {
          queryParams: { tab },
        });
      }
    }
  }

  toggleMaterial(): void {
    this.isMaterialOpen.update(v => !v);
  }

  togglePlay(): void {
    this.isPlaying.update(v => !v);
  }

  navigateToSubmission(submissionId: number): void {
    const item = this.submissions.find(s => s.id === submissionId);
    if (item?.badge === '피드백') {
      this.router.navigate(['/my-bootcamp', this.bootcampId, 'feedback', submissionId]);
    } else {
      this.router.navigate(['/my-bootcamp', this.bootcampId, 'submission', submissionId]);
    }
  }

  navigateToSubmit(): void {
    this.router.navigate(['/my-bootcamp', this.bootcampId, 'assignment', this.assignmentId, 'submit']);
  }
}
