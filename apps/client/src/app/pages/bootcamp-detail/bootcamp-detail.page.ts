import { Component, inject, signal, computed, NgZone, ChangeDetectorRef, ApplicationRef, ViewChild, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Location } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

export interface Instructor {
  name: string;
  summary: string;
  photo: string;
  badge: string;
  work: string;
}

export interface PortfolioFile {
  name: string;
  type: 'url' | 'file';
  file?: File;
}

@Component({
  selector: 'app-bootcamp-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './bootcamp-detail.page.html',
  styleUrls: ['./bootcamp-detail.page.css'],
})
export class BootcampDetailPage implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private location = inject(Location);
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private zone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);
  private appRef = inject(ApplicationRef);
  private sanitizer = inject(DomSanitizer);


  ngOnDestroy(): void {
    document.body.classList.remove('page-bootcamp-detail');
    document.body.style.overflow = '';
  }

  goBack(): void {
    this.location.back();
  }

  bootcampId = '';
  title = signal('부트캠프');
  subtitle = signal('');
  cohort = signal('');
  recruitPeriod = signal('-');
  eduPeriod = signal('-');

  activeTab = '소개';
  tabs = ['소개', '커리큘럼', '강사소개', '부트캠프 후기'];

  private tabSectionMap: Record<string, string> = {
    '소개': 'bd-content',
    '커리큘럼': 'bd-curriculum',
    '강사소개': 'bd-instructors',
    '부트캠프 후기': 'bd-intro-section',
  };

  description = signal('');
  recruitIntro = signal('');
  recruitCurriculum = signal('');
  recruitReview = signal('');
  recruitReviewVisible = signal(false);

  /** sanitized HTML — 에디터 인라인 스타일(text-align 등) 유지 */
  safeIntroHtml = computed<SafeHtml>(() =>
    this.sanitizer.bypassSecurityTrustHtml(this.recruitIntro())
  );
  safeCurriculumHtml = computed<SafeHtml>(() =>
    this.sanitizer.bypassSecurityTrustHtml(this.recruitCurriculum())
  );
  safeReviewHtml = computed<SafeHtml>(() =>
    this.sanitizer.bypassSecurityTrustHtml(this.recruitReview())
  );

  instructors = signal<Instructor[]>([]);

  /* 사전인터뷰 질문 (관리자 설정) */
  interviewQuestions = signal<{ text: string }[]>([]);

  /* ── 수강 신청 모달 ── */
  isModalOpen = signal(false);

  form = {
    applicantName: '',
    countryCode: '',
    phone: '',
    email: '',
    address: '',
    addressDetail: '',
    portfolioUrl: '',
    portfolioNote: '',
    portfolioFiles: [] as PortfolioFile[],
    interviewAnswers: [] as string[],
    privacyAgreed: false,
  };

  ngOnInit(): void {
    document.body.classList.add('page-bootcamp-detail');
    this.route.paramMap.subscribe((params) => {
      this.bootcampId = params.get('id') || '';
      if (this.bootcampId) this.loadBootcamp(Number(this.bootcampId));
    });
  }

  private async loadBootcamp(id: number): Promise<void> {
    try {
      const bc = await this.api.bootcamps.findOne(id);
      this.title.set(bc.name);
      this.cohort.set(bc.name);
      this.subtitle.set(bc.instructorName
        ? `${bc.instructorName}가 알려주는, 실전 노하우!`
        : bc.description?.substring(0, 60) || '');
      this.description.set(bc.description || '');
      this.recruitIntro.set(bc.recruitIntro || '');
      this.recruitCurriculum.set(bc.recruitCurriculum || '');
      this.recruitReview.set(bc.recruitReview || '');
      this.recruitReviewVisible.set((bc as unknown as { recruitReviewVisibility?: string }).recruitReviewVisibility === 'show');
      if (bc.recruitInstructors && Array.isArray(bc.recruitInstructors)) {
        this.instructors.set(bc.recruitInstructors as Instructor[]);
      }
      if (bc.startDate && bc.endDate) {
        const fmt = (d: string) => d.substring(0, 10);
        this.recruitPeriod.set(`${fmt(bc.startDate)} ~ ${fmt(bc.endDate)}`);
        this.eduPeriod.set(`${fmt(bc.startDate)} ~ ${fmt(bc.endDate)}`);
      }
      // 사전인터뷰 질문 로드
      try {
        console.log('[클라이언트] 인터뷰 질문 로드 시작, bootcampId:', id);
        const questions = await this.api.bootcamps.getInterviewSettings(id);
        console.log('[클라이언트] 인터뷰 질문 로드 결과:', questions);
        this.interviewQuestions.set(questions);
        this.form.interviewAnswers = questions.map(() => '');
      } catch (err) {
        console.error('[클라이언트] 인터뷰 질문 로드 실패:', err);
        this.interviewQuestions.set([]);
      }
    } catch (e) {
      console.error('부트캠프 로드 실패:', e);
    }
  }

  selectTab(tab: string): void {
    this.activeTab = tab;
    const sectionId = this.tabSectionMap[tab];
    if (sectionId) {
      const el = document.getElementById(sectionId);
      if (el) {
        const offset = 80; // 탭 바 높이 + 여유
        const top = el.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    }
  }

  isLoginRequiredModalOpen = signal(false);

  onApply(): void {
    if (!this.auth.isLoggedIn()) {
      this.isLoginRequiredModalOpen.set(true);
      return;
    }
    this.isModalOpen.set(true);
    document.body.style.overflow = 'hidden';
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    document.body.style.overflow = '';
    this.resetForm();
  }

  private resetForm(): void {
    this.form = {
      applicantName: '',
      countryCode: '',
      phone: '',
      email: '',
      address: '',
      addressDetail: '',
      portfolioUrl: '',
      portfolioNote: '',
      portfolioFiles: [],
      interviewAnswers: this.interviewQuestions().map(() => ''),
      privacyAgreed: false,
    };
    this.isUrlFormOpen = false;
    this.urlInput = '';
    this.isFileFormOpen = false;
    this.pendingFiles = [];
  }

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('af-overlay')) {
      this.closeModal();
    }
  }

  /* 강사 슬라이더 */
  @ViewChild('instructorSlider') instructorSlider!: ElementRef<HTMLDivElement>;

  scrollInstructors(direction: 'left' | 'right'): void {
    const el = this.instructorSlider?.nativeElement;
    if (el) {
      const scrollAmount = 324; // 카드 너비(300) + gap(24)
      el.scrollBy({ left: direction === 'right' ? scrollAmount : -scrollAmount, behavior: 'smooth' });
    }
  }

  /** 강사 수에 따라 카드 너비 동적 계산 (최대 4장 기준) */
  get instructorCardWidth(): string {
    const count = Math.min(this.instructors().length || 1, 4);
    return `calc((100% - 24px * ${count - 1}) / ${count})`;
  }

  /* URL 추가 서브 폼 */
  isUrlFormOpen = false;
  urlInput = '';

  openUrlForm(): void {
    this.isUrlFormOpen = true;
    this.urlInput = '';
  }

  closeUrlForm(): void {
    this.isUrlFormOpen = false;
    this.urlInput = '';
  }

  submitUrl(): void {
    if (this.urlInput.trim()) {
      this.form.portfolioFiles = [
        ...this.form.portfolioFiles,
        { name: this.urlInput.trim(), type: 'url' },
      ];
      this.closeUrlForm();
    }
  }
  /* 파일 추가 서브 모달 */
  isFileFormOpen = false;
  pendingFiles: File[] = [];

  openFileForm(): void {
    this.isFileFormOpen = true;
    this.pendingFiles = [];
  }

  closeFileForm(): void {
    this.isFileFormOpen = false;
    this.pendingFiles = [];
  }

  onPendingFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.pendingFiles = [...this.pendingFiles, ...Array.from(input.files)];
      input.value = '';
    }
  }

  submitFiles(): void {
    if (this.pendingFiles.length > 0) {
      const newFiles: PortfolioFile[] = this.pendingFiles
        .slice(0, 10 - this.form.portfolioFiles.length)
        .map(file => ({ name: file.name, type: 'file' as const, file }));
      this.form.portfolioFiles = [...this.form.portfolioFiles, ...newFiles];
      this.closeFileForm();
    }
  }

  onFileUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const newFiles: PortfolioFile[] = Array.from(input.files)
        .slice(0, 10 - this.form.portfolioFiles.length)
        .map(file => ({ name: file.name, type: 'file' as const, file }));
      this.form.portfolioFiles = [...this.form.portfolioFiles, ...newFiles];
      input.value = '';
    }
  }

  removeFile(index: number): void {
    this.form.portfolioFiles = this.form.portfolioFiles.filter((_, i) => i !== index);
  }

  /** 다음 우편번호 서비스 팝업 */
  onSearchAddress(): void {
    const daum = (window as unknown as { daum?: { Postcode: new (opts: { oncomplete: (data: { roadAddress?: string; jibunAddress?: string }) => void }) => { open: () => void } } }).daum;
    if (!daum?.Postcode) {
      alert('주소 검색 서비스를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }
    new daum.Postcode({
      oncomplete: (data: { roadAddress?: string; jibunAddress?: string }) => {
        const addr = data.roadAddress || data.jibunAddress || '';
        this.form.address = addr;
        this.form.addressDetail = '';
        // DOM 직접 업데이트 (Angular zone 밖에서도 확실히 반영)
        const el = document.querySelector('input[name="address"]') as HTMLInputElement;
        if (el) el.value = addr;
      },
    }).open();
  }

  async onSubmit(): Promise<void> {
    if (!this.form.privacyAgreed) {
      alert('개인정보 수집 및 이용에 동의해주세요.');
      return;
    }
    try {
      // 1) URL 타입 포트폴리오 추출
      const portfolioUrls = this.form.portfolioFiles
        .filter(pf => pf.type === 'url')
        .map(pf => pf.name);

      // 2) 파일 타입 업로드
      let uploadedFiles: { url: string; originalName: string; size: number }[] = [];
      const rawFiles = this.form.portfolioFiles
        .filter(pf => pf.type === 'file' && pf.file)
        .map(pf => pf.file as File);
      if (rawFiles.length > 0) {
        const results = await this.api.upload.multiple(rawFiles, 'applicants');
        uploadedFiles = results.map(r => ({
          url: r.url,
          originalName: r.originalName,
          size: r.size,
        }));
      }

      // 3) 지원 데이터 전송
      // 동적 질문 답변을 interviewAnswers로 통합
      const interviewAnswers = this.interviewQuestions().map((q, i) => ({
        question: q.text,
        answer: this.form.interviewAnswers[i] || '',
      }));

      await this.api.applicants.apply(Number(this.bootcampId), {
        applicantName: this.form.applicantName,
        phone: this.form.phone,
        email: this.form.email,
        address: this.form.address + (this.form.addressDetail ? ' ' + this.form.addressDetail : ''),
        portfolioUrl: portfolioUrls.join(', '),
        portfolioFiles: uploadedFiles,
        motivation: interviewAnswers.map(a => `Q. ${a.question}\nA. ${a.answer}`).join('\n\n'),
      });
      alert('지원이 완료되었습니다!');
      this.closeModal();
    } catch (e) {
      alert('지원에 실패했습니다. 다시 시도해주세요.');
      console.error('지원 실패:', e);
    }
  }

  /* ── 개인정보 수집 동의 모달 ── */
  isPrivacyOpen = signal(false);

  onPrivacyClick(): void {
    if (this.form.privacyAgreed) {
      this.form.privacyAgreed = false;
    } else {
      this.isPrivacyOpen.set(true);
    }
  }

  agreePrivacy(): void {
    this.form.privacyAgreed = true;
    this.isPrivacyOpen.set(false);
  }

  closePrivacyModal(): void {
    this.isPrivacyOpen.set(false);
  }

  onPrivacyOverlayClick(event: Event): void {
    if ((event.target as HTMLElement).classList.contains('bd-prv-overlay')) {
      this.closePrivacyModal();
    }
  }
}
