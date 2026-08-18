import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';

interface LearningFile {
  name: string;
}

interface Comment {
  id: number;
  author: string;
  date: string;
  content: string;
  avatarInitial: string;
}

@Component({
  selector: 'app-feedback-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './feedback-detail.page.html',
  styleUrls: ['./feedback-detail.page.css'],
})
export class FeedbackDetailPage implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  feedbackId = '';
  bootcampId = '';

  detailTabs = ['학습목록', '강의', '과제', '공지사항'];
  activeDetailTab = signal('과제');

  courseLabel = '과정1. 웹툰의 기초';
  assignmentTitle = '강의명강의명강의명강의명강의명강의명강의명강의명강의명강의명';
  badge = '피드백';
  author = '고예림';
  date = '2024.01.20';
  fileName = '과제명 30자 이내 과제명 30자 이내';
  description = '강의 내용 에디터 작성 '.repeat(70);

  isMaterialOpen = signal(true);
  isMoreOpen = signal(false);

  // TODO: 차후 계정 권한 API 연동
  isAuthor = false;
  isInstructor = true;

  learningFiles: LearningFile[] = [
    { name: '학습자료_웹툰기초_이론편.pdf' },
    { name: '학습자료_웹툰기초_실습가이드.pdf' },
    { name: '학습자료.pdf' },
    { name: '참고자료.pdf' },
    { name: '과제안내.pdf' },
  ];

  comments: Comment[] = [
    { id: 1, author: 'newon', date: '2024.01.20 13:12', content: '현재 제출한 과제 형식이 맞는지 문의드립니다.', avatarInitial: 'N' },
    { id: 2, author: 'newon', date: '2024.01.20 13:12', content: '현재 제출한 과제 형식이 맞는지 문의드립니다.', avatarInitial: 'N' },
    { id: 3, author: 'newon', date: '2024.01.20 13:12', content: '현재 제출한 과제 형식이 맞는지 문의드립니다.', avatarInitial: 'N' },
    { id: 4, author: 'newon', date: '2024.01.20 13:12', content: '현재 제출한 과제 형식이 맞는지 문의드립니다.', avatarInitial: 'N' },
    { id: 5, author: 'newon', date: '2024.01.20 13:12', content: '현재 제출한 과제 형식이 맞는지 문의드립니다.', avatarInitial: 'N' },
    { id: 6, author: 'newon', date: '2024.01.20 13:12', content: '현재 제출한 과제 형식이 맞는지 문의드립니다.', avatarInitial: 'N' },
    { id: 7, author: 'newon', date: '2024.01.20 13:12', content: '현재 제출한 과제 형식이 맞는지 문의드립니다.', avatarInitial: 'N' },
    { id: 8, author: 'newon', date: '2024.01.20 13:12', content: '현재 제출한 과제 형식이 맞는지 문의드립니다.', avatarInitial: 'N' },
  ];

  newComment = '';

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.bootcampId = params.get('bootcampId') || '';
      this.feedbackId = params.get('feedbackId') || '';
    });
  }

  goBack(): void {
    if (this.bootcampId) {
      this.router.navigate(['/my-bootcamp', this.bootcampId]);
    } else {
      this.router.navigate(['/my-bootcamp']);
    }
  }

  selectDetailTab(tab: string): void {
    this.activeDetailTab.set(tab);
    if (this.bootcampId) {
      this.router.navigate(['/my-bootcamp', this.bootcampId]);
    }
  }

  toggleMaterial(): void {
    this.isMaterialOpen.update(v => !v);
  }

  toggleMore(): void {
    this.isMoreOpen.update(v => !v);
  }

  closeMore(): void {
    this.isMoreOpen.set(false);
  }

  onEdit(): void {
    this.closeMore();
  }

  onDelete(): void {
    this.closeMore();
  }

  onRegisterFeedback(): void {
    this.closeMore();
  }

  onCommentInput(event: Event): void {
    this.newComment = (event.target as HTMLTextAreaElement).value;
  }

  submitComment(): void {
    if (!this.newComment.trim()) return;
    this.comments.push({
      id: this.comments.length + 1,
      author: 'newon',
      date: new Date().toLocaleDateString('ko-KR'),
      content: this.newComment.trim(),
      avatarInitial: 'N',
    });
    this.newComment = '';
  }
}
