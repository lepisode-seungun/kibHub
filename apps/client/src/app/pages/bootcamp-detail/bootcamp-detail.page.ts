import { Component, inject, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';

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
}

@Component({
  selector: 'app-bootcamp-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './bootcamp-detail.page.html',
  styleUrls: ['./bootcamp-detail.page.css'],
})
export class BootcampDetailPage {
  private route = inject(ActivatedRoute);

  bootcampId = '';
  title = '케나즈 아카데미 초급반 13기';
  subtitle = '킵허브 아티스트가 알려주는, 실무를 위한 실전 노하우';
  cohort = '케나즈 아카데미 초급반 13기';
  recruitPeriod = '2025-01-16 ~ 2025-08-07';
  eduPeriod = '2025-01-16 ~ 2025-08-07';

  activeTab = '소개';
  tabs = ['소개', '커리큘럼', '강사소개', '부트캠프 후기'];

  private tabSectionMap: Record<string, string> = {
    '소개': 'bd-content',
    '커리큘럼': 'bd-curriculum',
    '강사소개': 'bd-instructors',
    '부트캠프 후기': 'bd-intro-section',
  };

  description = `" 상상하는 모든 이야기를 현실로 "\n\n글로벌 웹툰 작가에 도전하세요!\n\n상상으로만 펼쳐나가던 나의 세상.\n어디서 부터 어떻게 기획을 하고 만들어나갈지 막막했던 이야기 -\n\n진학을 고민하는 학생, 비전을 고민하는 직장인,\n마음 속에 꿈을 품었던 그 누구라도 도전할 수 있습니다.\n\n웹툰의 기초, 프로그램 사용법부터 기획, 제작, 완성까지 !\n모듈화로 진행되는 코스를 통해 반복 학습은 물론\n단계를 밟아 차근차근 배워나갑니다.\n\n국내 정식 연재부터 글로벌 연재의 기회를 잡아보세요.\n케나즈와 함께 성장해나갈 미래의 작가님을 모십니다.\n\n온라인 기초 CLASS ㆍ 개인 맞춤 교육 커리큘럼 ㆍ 웹툰 아티스트 데뷔 기회`;

  instructors: Instructor[] = [
    { name: '고식혜', summary: '요약설명', photo: '', badge: '대표작', work: '대표작 내용' },
    { name: '김민수', summary: '요약설명 길게', photo: '', badge: '대표작', work: '대표작 내용' },
    { name: '이지현', summary: '요약설명 길게', photo: '', badge: '대표작', work: '대표작 내용' },
    { name: '박준호', summary: '요약설명 길게', photo: '', badge: '대표작', work: '대표작 내용' },
    { name: '최서연', summary: '요약설명', photo: '', badge: '대표작', work: '대표작 내용' },
    { name: '정하윤', summary: '요약설명 길게', photo: '', badge: '대표작', work: '대표작 내용' },
  ];

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
    motivation: '',
    agreement: '',
    privacyAgreed: false,
  };

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.bootcampId = params.get('id') || '';
    });
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

  onApply(): void {
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
      motivation: '',
      agreement: '',
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

  onSearchAddress(): void {
    // TODO: 주소 검색 API (카카오/다음 우편번호 등) 연동
    alert('주소검색 기능은 API 연동 후 사용 가능합니다.');
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
        .map(file => ({ name: file.name, type: 'file' as const }));
      this.form.portfolioFiles = [...this.form.portfolioFiles, ...newFiles];
      this.closeFileForm();
    }
  }

  onFileUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const newFiles: PortfolioFile[] = Array.from(input.files)
        .slice(0, 10 - this.form.portfolioFiles.length)
        .map(file => ({ name: file.name, type: 'file' as const }));
      this.form.portfolioFiles = [...this.form.portfolioFiles, ...newFiles];
      input.value = '';
    }
  }

  removeFile(index: number): void {
    this.form.portfolioFiles = this.form.portfolioFiles.filter((_, i) => i !== index);
  }

  onSubmit(): void {
    if (!this.form.privacyAgreed) {
      alert('개인정보 수집 및 이용에 동의해주세요.');
      return;
    }
    console.log('지원하기 제출:', this.form);
    alert('지원이 완료되었습니다!');
    this.closeModal();
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
