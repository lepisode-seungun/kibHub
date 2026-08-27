import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TextEditorComponent } from '../../components/text-editor/text-editor.component';
import { DataGridComponent, GridColumn } from '../../components/data-grid/data-grid.component';
import { CONTENT_STATUS_BADGES } from '../../shared/badge-styles';

@Component({
  selector: 'adm-bootcamp-intro',
  standalone: true,
  imports: [CommonModule, TextEditorComponent, DataGridComponent],
  templateUrl: './bootcamp-intro.page.html',
  styleUrl: './bootcamp-intro.page.css',
})
export class BootcampIntroPage {
  activeTab = signal<'intro' | 'banner' | 'academy' | 'partner'>('intro');

  setTab(tab: 'intro' | 'banner' | 'academy' | 'partner'): void {
    this.activeTab.set(tab);
  }

  // ===== 메인 배너 탭 =====
  bannerSectionExpanded = signal(true);

  toggleBannerSection(): void {
    this.bannerSectionExpanded.update(v => !v);
  }

  bannerColumns: GridColumn[] = [
    { key: 'id', label: '순번', width: '80px' },
    {
      key: 'status', label: '상태', width: '72px',
      badge: 'status',
      badgeStyles: CONTENT_STATUS_BADGES,
    },
    { key: 'image', label: '이미지', width: '125px', type: 'image' },
    { key: 'header', label: '헤더' },
    { key: 'content', label: '내용' },
    { key: 'link', label: '링크' },
    { key: 'createdAt', label: '등록일시', width: '150px', headerColor: 'text-gray-600' },
  ];

  bannerData = [
    { id: 1, status: '노출', image: '', header: '프로모션 배너', content: '프로모션 배너프로모션 배너프로모션 배너프로모션 배너프로모션 배너', link: 'https://www.naver.com', createdAt: '2023-01-01 16:10' },
    { id: 2, status: '노출', image: '', header: '프로모션 배너', content: '프로모션 배너프로모션 배너프로모션 배너프로모션 배너프로모션 배너', link: 'https://www.naver.com', createdAt: '2023-01-01 16:10' },
    { id: 3, status: '숨김', image: '', header: '프로모션 배너', content: '프로모션 배너프로모션 배너프로모션 배너프로모션 배너프로모션 배너', link: 'https://www.naver.com', createdAt: '2023-01-01 16:10' },
  ];

  // ===== 영상 관리 =====
  videoSectionExpanded = signal(true);
  vimeoLink = signal('');

  toggleVideoSection(): void {
    this.videoSectionExpanded.update(v => !v);
  }

  // ===== 아카데미 현역 - 포스터 관리 =====
  posterSectionExpanded = signal(true);

  togglePosterSection(): void {
    this.posterSectionExpanded.update(v => !v);
  }

  posterColumns: GridColumn[] = [
    { key: 'id', label: '순번', width: '80px' },
    { key: 'image', label: '이미지', width: '200px', type: 'image' },
    { key: 'title', label: '제목' },
    { key: 'createdAt', label: '등록일시', headerColor: 'text-gray-600' },
  ];

  posterData = [
    { id: 1, image: '', title: '프로모션 배너', createdAt: '2023-01-01 16:10' },
    { id: 2, image: '', title: '프로모션 배너', createdAt: '2023-01-01 16:10' },
  ];

  // ===== 파트너 탭 =====
  partnerColumns: GridColumn[] = [
    { key: 'id', label: '순번', width: '80px' },
    { key: 'logo', label: '로고', width: '200px', type: 'image' },
    { key: 'name', label: '이름' },
    { key: 'link', label: '링크' },
  ];

  partnerData = [
    { id: 1, logo: '', name: 'Apple Books', link: 'https://apple.com' },
    { id: 2, logo: '', name: 'Kakao Page', link: 'https://kakaopage.com' },
    { id: 3, logo: '', name: 'Naver Webtoon', link: 'https://webtoon.naver.com' },
  ];

  // ===== 파트너 드로어 =====
  showPartnerDrawer = signal(false);
  partnerDrawerMode = signal<'add' | 'edit'>('add');
  partnerForm = signal({ name: '', link: '' });
  partnerImage = signal<{ name: string; size: string; preview: string } | null>(null);

  openPartnerDrawer(mode: 'add' | 'edit', row?: { name: string; link: string }): void {
    this.partnerDrawerMode.set(mode);
    this.partnerForm.set({
      name: mode === 'edit' && row ? row.name : '',
      link: mode === 'edit' && row ? row.link : '',
    });
    this.partnerImage.set(null);
    this.showPartnerDrawer.set(true);
  }

  closePartnerDrawer(): void {
    this.showPartnerDrawer.set(false);
  }

  updatePartnerField(field: string, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.partnerForm.update(f => ({ ...f, [field]: value }));
  }

  onPartnerImageSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const sizeKB = Math.round(file.size / 1024);
    const reader = new FileReader();
    reader.onload = () => {
      this.partnerImage.set({
        name: file.name,
        size: `${sizeKB}KB`,
        preview: reader.result as string,
      });
    };
    reader.readAsDataURL(file);
  }

  removePartnerImage(): void {
    this.partnerImage.set(null);
  }

  submitPartnerDrawer(): void {
    this.showPartnerDrawer.set(false);
    // TODO: 파트너 등록/수정 로직
  }

  onPartnerContextMenu(event: { action: string; row: { name: string; link: string } }): void {
    if (event.action === '수정') {
      this.openPartnerDrawer('edit', event.row);
    }
    // TODO: 삭제 로직
  }

  // ===== 아카데미 현역 - 히스토리 관리 =====
  historySectionExpanded = signal(true);
  activeYearMenu = signal<string | null>(null);
  historyPage = signal(1);
  historyPageSize = signal(10);
  historyPageSizeOpen = signal(false);
  historyTotalPages = computed(() => Math.max(1, Math.ceil(this.historyData.length / this.historyPageSize())));
  historyPageNumbers = computed(() => {
    const total = this.historyTotalPages();
    const current = this.historyPage();
    const maxVisible = 5;
    let start = Math.max(1, current - Math.floor(maxVisible / 2));
    const end = Math.min(total, start + maxVisible - 1);
    start = Math.max(1, end - maxVisible + 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  });

  goToHistoryPage(page: number): void {
    if (page >= 1 && page <= this.historyTotalPages()) {
      this.historyPage.set(page);
    }
  }

  toggleHistorySection(): void {
    this.historySectionExpanded.update(v => !v);
  }

  toggleYearMenu(year: string, event: Event): void {
    event.stopPropagation();
    this.activeYearMenu.update(v => v === year ? null : year);
  }

  closeYearMenu(): void {
    this.activeYearMenu.set(null);
  }

  // ===== 히스토리 연도 드로어 =====
  showYearDrawer = signal(false);
  yearDrawerMode = signal<'add' | 'edit'>('add');
  yearDrawerValue = signal('');

  openYearDrawer(mode: 'add' | 'edit', year?: string): void {
    this.yearDrawerMode.set(mode);
    this.yearDrawerValue.set(mode === 'edit' && year ? year : '');
    this.showYearDrawer.set(true);
  }

  closeYearDrawer(): void {
    this.showYearDrawer.set(false);
  }

  submitYearDrawer(): void {
    this.showYearDrawer.set(false);
    // TODO: 연도 등록/수정 로직
  }

  onYearAction(year: string, action: string): void {
    this.activeYearMenu.set(null);
    if (action === '수정') {
      this.openYearDrawer('edit', year);
    }
    // TODO: 삭제 로직
  }

  // ===== 히스토리 항목 드로어 =====
  showHistoryItemDrawer = signal(false);
  historyItemMode = signal<'add' | 'edit'>('add');
  historyItemForm = signal({ title: '', content: '', date: '' });

  openHistoryItemDrawer(mode: 'add' | 'edit', item?: { title: string; description: string; period: string }): void {
    this.historyItemMode.set(mode);
    this.historyItemForm.set({
      title: mode === 'edit' && item ? item.title : '',
      content: mode === 'edit' && item ? item.description : '',
      date: mode === 'edit' && item ? item.period : '',
    });
    this.showHistoryItemDrawer.set(true);
  }

  closeHistoryItemDrawer(): void {
    this.showHistoryItemDrawer.set(false);
  }

  updateHistoryItemField(field: string, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.historyItemForm.update(f => ({ ...f, [field]: value }));
  }

  submitHistoryItemDrawer(): void {
    this.showHistoryItemDrawer.set(false);
    // TODO: 항목 등록/수정 로직
  }

  historyData = [
    {
      year: '2024',
      items: [
        { title: 'KENAZ X APPLE BOOKS', description: '글로벌 진출 웹툰 아카데미', period: '2023.10~2023.12' },
        { title: 'KENAZ X APPLE BOOKS', description: '글로벌 진출 웹툰 아카데미', period: '2023.10~2023.12' },
        { title: 'KENAZ X APPLE BOOKS', description: '글로벌 진출 웹툰 아카데미', period: '2023.10~2023.12' },
      ],
    },
    {
      year: '2023',
      items: [
        { title: 'KENAZ X APPLE BOOKS', description: '글로벌 진출 웹툰 아카데미', period: '2023.10~2023.12' },
        { title: 'KENAZ X APPLE BOOKS', description: '글로벌 진출 웹툰 아카데미', period: '2023.10~2023.12' },
        { title: 'KENAZ X APPLE BOOKS', description: '글로벌 진출 웹툰 아카데미', period: '2023.10~2023.12' },
      ],
    },
  ];

  onVimeoLinkInput(event: Event): void {
    this.vimeoLink.set((event.target as HTMLInputElement).value);
  }

  registerVimeoLink(): void {
    // TODO: 비메오 링크 등록 로직
  }

  // ===== 메인배너 수정 드로어 =====
  showBannerDrawer = signal(false);
  bannerDrawerRow = signal<{ id: number; status: string; link: string } | null>(null);
  bannerForm = signal({
    status: '',
    vimeoLink: '',
    header: '',
    content: '',
    link: '',
  });

  onBannerContextMenu(event: { action: string; row: { id: number; status: string; link: string } }): void {
    if (event.action === '수정') {
      this.openBannerDrawer(event.row);
    }
  }

  openBannerDrawer(row?: { id: number; status: string; link: string }): void {
    if (row) {
      this.bannerDrawerRow.set(row);
      this.bannerForm.set({
        status: row.status || '',
        vimeoLink: row.link || '',
        header: '',
        content: '',
        link: '',
      });
    } else {
      this.bannerDrawerRow.set(null);
      this.bannerForm.set({ status: '', vimeoLink: '', header: '', content: '', link: '' });
    }
    this.showBannerDrawer.set(true);
  }

  closeBannerDrawer(): void {
    this.showBannerDrawer.set(false);
  }

  updateBannerField(field: string, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.bannerForm.update(f => ({ ...f, [field]: value }));
  }

  // ===== 이미지 업로드 =====
  pcImage = signal<{ name: string; size: string; preview: string } | null>(null);
  mobileImage = signal<{ name: string; size: string; preview: string } | null>(null);

  triggerFileInput(inputId: string): void {
    const input = document.getElementById(inputId) as HTMLInputElement;
    input?.click();
  }

  onImageSelected(event: Event, type: 'pc' | 'mobile'): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const sizeKB = Math.round(file.size / 1024);
    const reader = new FileReader();
    reader.onload = () => {
      const imageData = {
        name: file.name,
        size: `${sizeKB}KB`,
        preview: reader.result as string,
      };
      if (type === 'pc') {
        this.pcImage.set(imageData);
      } else {
        this.mobileImage.set(imageData);
      }
    };
    reader.readAsDataURL(file);
  }

  removeImage(type: 'pc' | 'mobile'): void {
    if (type === 'pc') {
      this.pcImage.set(null);
    } else {
      this.mobileImage.set(null);
    }
  }

  submitBannerForm(): void {
    this.showBannerDrawer.set(false);
    this.pcImage.set(null);
    this.mobileImage.set(null);
    // TODO: 배너 등록/수정 로직
  }
}
