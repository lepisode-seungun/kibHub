import { Component, signal, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataGridComponent, GridColumn } from '../../components/data-grid/data-grid.component';
import { CONTENT_STATUS_BADGES } from '../../shared/badge-styles';
import { ToastService } from '../../shared/toast/toast.service';

export interface PortfolioItem {
  id: number;
  status?: string;
  thumbnail: string;
  name: string;
  bootcampName: string;
  createdAt: string;
  launchPlatform?: string;
}

@Component({
  selector: 'adm-portfolio',
  standalone: true,
  imports: [CommonModule, DataGridComponent],
  templateUrl: './portfolio.page.html',
  styleUrl: './portfolio.page.css',
})
export class PortfolioPage {
  private toast = inject(ToastService);
  activeTab = signal<'portfolio' | 'hallOfFame'>('portfolio');
  viewMode = signal<'list' | 'form' | 'detail'>('list');

  setTab(tab: 'portfolio' | 'hallOfFame'): void {
    this.activeTab.set(tab);
    this.viewMode.set('list');
  }

  openForm(): void {
    history.pushState({ view: 'form' }, '');
    this.viewMode.set('form');
  }

  openDetail(item: PortfolioItem): void {
    this.detailData.set(item);
    history.pushState({ view: 'detail' }, '');
    this.viewMode.set('detail');
  }

  backToList(): void {
    this.viewMode.set('list');
  }

  @HostListener('window:popstate')
  onPopState(): void {
    if (this.viewMode() !== 'list') {
      this.viewMode.set('list');
    }
  }

  // ===== 상세 뷰 상태 =====
  detailData = signal<PortfolioItem | null>(null);
  detailDropdownOpen = signal(false);
  detailBasicInfoExpanded = signal(true);
  detailManuscriptExpanded = signal(true);
  detailPlanExpanded = signal(true);

  hidePortfolio(): void {
    this.detailDropdownOpen.set(false);
    this.toast.success('숨김 되었습니다.');
    this.viewMode.set('list');
  }

  deletePortfolio(): void {
    this.detailDropdownOpen.set(false);
    this.toast.success('삭제가 완료 되었습니다.');
    this.viewMode.set('list');
  }

  // ===== 명예의 전당 등록 드로어 =====
  hofDrawerOpen = signal(false);
  hofForm = signal({
    name: '',
    bootcampName: '',
    workTitle: '',
    workIntro: '',
    launchPlatform: '',
    launchUrl: '',
  });
  hofThumbnail = signal<{ name: string; size: string; preview: string } | null>(null);

  openHofDrawer(): void {
    this.hofDrawerOpen.set(true);
  }

  closeHofDrawer(): void {
    this.hofDrawerOpen.set(false);
  }

  updateHofField(field: string, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.hofForm.update(f => ({ ...f, [field]: value }));
  }

  onHofThumbnailSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      this.hofThumbnail.set({
        name: file.name,
        size: `${Math.round(file.size / 1024)}KB`,
        preview: reader.result as string,
      });
    };
    reader.readAsDataURL(file);
  }

  removeHofThumbnail(): void {
    this.hofThumbnail.set(null);
  }

  registerHof(): void {
    this.hofDrawerOpen.set(false);
    this.toast.success('등록 완료 되었습니다.');
  }

  // ===== 담당자 설정 드로어 =====
  managerDrawerOpen = signal(false);
  managers = signal<{ name: string; email: string; editing: boolean }[]>([
    { name: '고식혜', email: 'yelim@lepisode.team', editing: false },
    { name: '고식혜', email: 'yelim@lepisode.team', editing: true },
    { name: '고식혜', email: 'yelim@lepisode.team', editing: false },
    { name: '고식혜', email: 'yelim@lepisode.team', editing: false },
  ]);

  openManagerDrawer(): void {
    this.managerDrawerOpen.set(true);
  }

  closeManagerDrawer(): void {
    this.managerDrawerOpen.set(false);
  }

  addManager(): void {
    this.managers.update(m => [...m, { name: '', email: '', editing: true }]);
  }

  saveManager(index: number): void {
    this.managers.update(m => m.map((item, i) => i === index ? { ...item, editing: false } : item));
  }

  editManager(index: number): void {
    this.managers.update(m => m.map((item, i) => i === index ? { ...item, editing: true } : item));
  }

  deleteManager(index: number): void {
    this.managers.update(m => m.filter((_, i) => i !== index));
  }

  updateManager(index: number, field: 'name' | 'email', event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.managers.update(m => m.map((item, i) => i === index ? { ...item, [field]: value } : item));
  }

  // ===== 폼 상태 =====
  studentInfoExpanded = signal(true);
  workInfoExpanded = signal(true);
  fileUploadExpanded = signal(true);
  manuscriptExpanded = signal(true);

  manuscriptFiles = signal<{ episode: number; name: string; size: string; preview: string }[]>([
    { episode: 1, name: '1회차.png', size: '10KB', preview: '' },
    { episode: 2, name: '2회차.png', size: '10KB', preview: '' },
    { episode: 3, name: '3회차.png', size: '10KB', preview: '' },
    { episode: 4, name: '4회차.png', size: '10KB', preview: '' },
    { episode: 5, name: '5회차.png', size: '10KB', preview: '' },
  ]);

  onManuscriptUpload(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const sizeKB = Math.round(file.size / 1024);
    const reader = new FileReader();
    reader.onload = () => {
      const current = this.manuscriptFiles();
      this.manuscriptFiles.set([...current, {
        episode: current.length + 1,
        name: file.name,
        size: `${sizeKB}KB`,
        preview: reader.result as string,
      }]);
    };
    reader.readAsDataURL(file);
  }

  removeManuscript(index: number): void {
    this.manuscriptFiles.update(files =>
      files.filter((_, i) => i !== index).map((f, i) => ({ ...f, episode: i + 1 }))
    );
  }

  thumbnailFile = signal<{ name: string; size: string; preview: string } | null>(null);
  planFile = signal<{ name: string; size: string; preview: string } | null>(null);

  onFileSelected(target: 'thumbnail' | 'plan', event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const sizeKB = Math.round(file.size / 1024);
    const reader = new FileReader();
    reader.onload = () => {
      const data = { name: file.name, size: `${sizeKB}KB`, preview: reader.result as string };
      if (target === 'thumbnail') this.thumbnailFile.set(data);
      else this.planFile.set(data);
    };
    reader.readAsDataURL(file);
  }

  removeFile(target: 'thumbnail' | 'plan'): void {
    if (target === 'thumbnail') this.thumbnailFile.set(null);
    else this.planFile.set(null);
  }

  triggerFileInput(id: string): void {
    document.getElementById(id)?.click();
  }

  portfolioForm = signal({
    name: '',
    bootcampName: '',
    workTitle: '',
    authorName: '',
    genre: '',
    workIntro: '',
  });

  updateFormField(field: string, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.portfolioForm.update(f => ({ ...f, [field]: value }));
  }

  // ===== 공통 그리드 =====
  gridColumns: GridColumn[] = [
    { key: 'id', label: '순번', width: '80px' },
    { key: 'status', label: '상태', width: '100px', badge: 'status', badgeStyles: CONTENT_STATUS_BADGES },
    { key: 'thumbnail', label: '썸네일', width: '120px', type: 'image' },
    { key: 'name', label: '이름' },
    { key: 'bootcampName', label: '부트캠프명' },
    { key: 'createdAt', label: '등록일시', width: '160px' },
  ];

  hallOfFameColumns: GridColumn[] = [
    { key: 'id', label: '순번', width: '80px' },
    { key: 'thumbnail', label: '썸네일', width: '120px', type: 'image' },
    { key: 'name', label: '이름' },
    { key: 'bootcampName', label: '부트캠프명' },
    { key: 'launchPlatform', label: '런칭 플랫폼' },
    { key: 'createdAt', label: '등록일시', width: '160px' },
  ];

  portfolioData = [
    { id: 1, status: '노출', thumbnail: '', name: '홍길동', bootcampName: '웹툰 아카데미 1기', createdAt: '2024-01-15 14:30' },
    { id: 2, status: '숨김', thumbnail: '', name: '김철수', bootcampName: '웹툰 아카데미 2기', createdAt: '2024-02-20 10:00' },
    { id: 3, status: '노출', thumbnail: '', name: '이영희', bootcampName: '글로벌 웹툰 1기', createdAt: '2024-03-10 09:15' },
  ];

  hallOfFameData = [
    { id: 1, thumbnail: '', name: '박지민', bootcampName: '웹툰 아카데미 1기', launchPlatform: '네이버 웹툰', createdAt: '2024-01-20 16:00' },
    { id: 2, thumbnail: '', name: '최수현', bootcampName: '글로벌 웹툰 2기', launchPlatform: '카카오페이지', createdAt: '2024-03-05 11:30' },
    { id: 3, thumbnail: '', name: '정다은', bootcampName: '웹툰 아카데미 3기', launchPlatform: '레진코믹스', createdAt: '2024-04-12 13:45' },
  ];
}
