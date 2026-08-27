import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';

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
  private api = inject(ApiService);

  assignmentId = '';
  bootcampId = '';

  courseLabel = '';
  assignmentTitle = '';
  dateRange = '';
  description = '';

  isMaterialOpen = signal(true);

  detailTabs = ['학습목록', '강의', '과제', '공지사항'];
  activeDetailTab = signal('과제');

  /* 강의 섹션 */
  lectureType: '강의' | '과제' = '강의';
  category = '';
  lectureTitle = '';
  duration = '';
  lectureDescription = '';

  isPlaying = signal(false);
  currentTime = '0:00';
  totalTime = '0:00';
  progress = 0;
  volume = 73;

  learningFiles: LearningFile[] = [];
  submissions: Submission[] = [];

  ngOnInit(): void {
    this.route.paramMap.subscribe(async (params) => {
      this.bootcampId = params.get('bootcampId') || '';
      this.assignmentId = params.get('assignmentId') || '';
      if (this.assignmentId) {
        await this.loadAssignment(Number(this.assignmentId));
      }
    });
    this.route.queryParamMap.subscribe((qp) => {
      this.returnTab = qp.get('tab') || '';
    });
  }

  private async loadAssignment(id: number): Promise<void> {
    try {
      const assignment: any = await this.api.assignments.findOne(id);
      this.assignmentTitle = assignment.title || '';
      this.description = assignment.body || '';
      this.dateRange = assignment.deadlineStart && assignment.deadlineEnd
        ? `${assignment.deadlineStart} ~ ${assignment.deadlineEnd}` : '';
      if (assignment.course) {
        this.courseLabel = assignment.course.title || '';
      }
      if (assignment.files && assignment.files.length > 0) {
        this.learningFiles = assignment.files.map((f: any) => ({ name: f.name }));
      }
    } catch (err) {
      console.error('과제 로드 실패:', err);
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

  goNext(): void {
    const nextId = Number(this.assignmentId) + 1;
    this.router.navigate(
      ['/my-bootcamp', this.bootcampId, 'assignment', nextId],
      { queryParams: this.returnTab ? { tab: this.returnTab } : {} }
    );
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
