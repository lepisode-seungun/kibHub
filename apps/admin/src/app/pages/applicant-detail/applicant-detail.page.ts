import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { APPLICANT_STATUS_BADGES } from '../../shared/badge-styles';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'adm-applicant-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './applicant-detail.page.html',
  styleUrl: './applicant-detail.page.css',
})
export class ApplicantDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);

  sectionOpen = signal(true);
  interviewOpen = signal(true);
  statusDropdownOpen = signal(false);

  interviewQA = signal<{ question: string; answer: string }[]>([]);

  statusBadges = APPLICANT_STATUS_BADGES;

  applicant: any = {};

  ngOnInit(): void {
    this.route.paramMap.subscribe(async (params) => {
      const id = params.get('id');
      if (id) {
        try {
          this.applicant = await this.api.applicants.findOne(Number(id));
        } catch (err) {
          console.error('지원자 로드 실패:', err);
        }
      }
    });
  }

  toggleSection(): void {
    this.sectionOpen.update(v => !v);
  }

  toggleInterview(): void {
    this.interviewOpen.update(v => !v);
  }

  toggleStatusDropdown(): void {
    this.statusDropdownOpen.update(v => !v);
  }

  closeStatusDropdown(): void {
    this.statusDropdownOpen.set(false);
  }

  async changeStatus(status: string): Promise<void> {
    try {
      this.applicant = await this.api.applicants.updateStatus(this.applicant.id, status);
    } catch (err) {
      console.error('상태 변경 실패:', err);
      this.applicant = { ...this.applicant, status };
    }
    this.statusDropdownOpen.set(false);
  }

  getBadgeClass(status: string): string {
    return this.statusBadges[status] || '';
  }

  // ===== 사전인터뷰 설정 드로어 =====
  interviewDrawerOpen = signal(false);
  drawerQuestions = signal<{ text: string; editing: boolean }[]>([
    { text: 'yelim@lepisode.team', editing: false },
    { text: '앙굴렘 아카데미는 프랑스 앙굴렘에서 8~9월까지 진행되며, 합격자는 본인의 금액으로 숙식을 해결하여 오프라인 현장 강의에 참석해야합니다. 이에 동의하십니까?', editing: true },
    { text: 'yelim@lepisode.team', editing: false },
  ]);

  openInterviewDrawer(): void {
    this.interviewDrawerOpen.set(true);
  }

  closeInterviewDrawer(): void {
    this.interviewDrawerOpen.set(false);
  }

  addDrawerQuestion(): void {
    this.drawerQuestions.update(qs => [...qs, { text: '', editing: true }]);
  }

  removeDrawerQuestion(index: number): void {
    this.drawerQuestions.update(qs => qs.filter((_, i) => i !== index));
  }

  updateDrawerQuestion(index: number, value: string): void {
    this.drawerQuestions.update(qs =>
      qs.map((q, i) => i === index ? { ...q, text: value } : q)
    );
  }

  editDrawerQuestion(index: number): void {
    this.drawerQuestions.update(qs =>
      qs.map((q, i) => i === index ? { ...q, editing: true } : q)
    );
  }

  saveDrawerQuestion(index: number): void {
    this.drawerQuestions.update(qs =>
      qs.map((q, i) => i === index ? { ...q, editing: false } : q)
    );
  }

  submitInterviewDrawer(): void {
    // 드로어 질문 순서대로 사전인터뷰 QA 동기화
    const currentQA = this.interviewQA();
    const answerMap = new Map(currentQA.map(qa => [qa.question, qa.answer]));

    const newQA = this.drawerQuestions()
      .filter(q => q.text.trim())
      .map(q => ({
        question: q.text,
        answer: answerMap.get(q.text) || '',
      }));

    this.interviewQA.set(newQA);
    this.interviewDrawerOpen.set(false);
  }
}
