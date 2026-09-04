import { formatDate } from '../../shared/format-date';
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

  applicant = signal<any>({});

  private readonly STATUS_MAP: Record<string, string> = {
    PENDING: '대기', ACCEPTED: '합격', WAITING: '수강대기', COMPLETED: '수료', REJECTED: '불합격',
  };

  ngOnInit(): void {
    this.route.paramMap.subscribe(async (params) => {
      const id = params.get('id');
      if (id) {
        try {
          const raw = await this.api.applicants.findOne(Number(id));
          const iq = (raw as any).interviewQuestions as Record<string, any> | null;
          const files = iq?.['portfolioFiles'] as { url: string; originalName: string; size: number }[] || [];
          const firstFile = files.length > 0 ? files[0] : null;
          this.applicant.set({
            ...raw,
            status: this.STATUS_MAP[raw.status] || raw.status,
            name: iq?.['applicantName'] || raw.user?.name || '',
            phone: iq?.['phone'] || raw.user?.phone || '',
            email: iq?.['email'] || raw.user?.email || '',
            address: iq?.['address'] || '',
            portfolioLink: iq?.['portfolioUrl'] || '',
            portfolioFile: firstFile ? { name: firstFile.originalName, size: this.formatSize(firstFile.size), url: firstFile.url } : null,
            portfolioFiles: files,
            motivation: iq?.['motivation'] || '',
            member: raw.user?.name || '',
            appliedAt: formatDate((raw as any).appliedAt || raw.createdAt),
            lastUpdate: formatDate((raw as any).appliedAt || raw.createdAt),
          });

          // 사전 인터뷰 Q&A 파싱
          const motivation = iq?.['motivation'] || '';
          if (motivation) {
            const qaList = motivation.split('\n\n')
              .filter((block: string) => block.trim())
              .map((block: string) => {
                const lines = block.split('\n');
                const questionLine = lines.find((l: string) => l.startsWith('Q. ')) || '';
                const answerLine = lines.find((l: string) => l.startsWith('A. ')) || '';
                return {
                  question: questionLine.replace(/^Q\.\s*/, ''),
                  answer: answerLine.replace(/^A\.\s*/, ''),
                };
              })
              .filter((qa: any) => qa.question);
            this.interviewQA.set(qaList);
          }
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

  private readonly REVERSE_STATUS_MAP: Record<string, string> = {
    '합격': 'ACCEPTED', '불합격': 'REJECTED', '대기': 'PENDING', '수강대기': 'WAITING', '수료': 'COMPLETED',
  };

  async changeStatus(status: string): Promise<void> {
    const apiStatus = this.REVERSE_STATUS_MAP[status] || status;
    try {
      const updated = await this.api.applicants.updateStatus(this.applicant().id, apiStatus);
      this.applicant.update(a => ({ ...a, ...updated, status: this.STATUS_MAP[updated.status] || updated.status }));
    } catch (err) {
      console.error('상태 변경 실패:', err);
    }
    this.statusDropdownOpen.set(false);
  }

  getBadgeClass(status: string): string {
    return this.statusBadges[status] || '';
  }

  private formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  }

  async downloadFile(url: string, filename: string): Promise<void> {
    try {
      const response = await fetch(url);
      const blob = await response.blob();

      // 다른 이름으로 저장 (File System Access API)
      if ('showSaveFilePicker' in window) {
        const ext = filename.includes('.') ? filename.split('.').pop() || '' : '';
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: filename,
          types: ext ? [{ description: filename, accept: { [blob.type || 'application/octet-stream']: [`.${ext}`] } }] : [],
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
      } else {
        // fallback
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
      }
    } catch (e: any) {
      if (e?.name === 'AbortError') return; // 사용자가 취소
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
    }
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
