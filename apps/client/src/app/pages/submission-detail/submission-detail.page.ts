import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';

interface LearningFile {
  name: string;
}

@Component({
  selector: 'app-submission-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './submission-detail.page.html',
  styleUrls: ['./submission-detail.page.css'],
})
export class SubmissionDetailPage implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  submissionId = '';
  bootcampId = '';

  detailTabs = ['학습목록', '강의', '과제', '공지사항'];
  activeDetailTab = signal('과제');

  courseLabel = '과정1. 웹툰의 기초';
  assignmentTitle = '강의명강의명강의명강의명강의명강의명강의명강의명강의명강의명';
  badge = '과제제출';
  author = '고예림';
  date = '2024.01.20';
  fileName = '과제명 30자 이내 과제명 30자 이내';
  description = '강의 내용 에디터 작성 '.repeat(70);

  isMaterialOpen = signal(true);
  isMoreOpen = signal(false);

  // TODO: 차후 계정 권한 API 연동
  isAuthor = true;
  isInstructor = false;

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
      this.submissionId = params.get('submissionId') || '';
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
    // TODO: 수정 페이지 이동 또는 모달
  }

  onDelete(): void {
    this.closeMore();
    // TODO: 삭제 확인 모달
  }

  onRegisterFeedback(): void {
    this.closeMore();
    // TODO: 피드백 등록 페이지 이동
  }
}
