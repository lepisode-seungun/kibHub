import { Component, signal, HostListener, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataGridComponent, GridColumn } from '../../components/data-grid/data-grid.component';
import { CONTENT_STATUS_BADGES } from '../../shared/badge-styles';
import { ToastService } from '../../shared/toast/toast.service';
import { ApiService } from '../../services/api.service';
import { Portfolio, PortfolioRow } from '../../shared/types';

function toPortfolioRow(p: Portfolio): PortfolioRow {
  return {
    id: p.id,
    status: p.status === 'HIDDEN' ? '숨김' : '노출',
    thumbnail: p.thumbnail || '',
    name: p.userName,
    bootcampName: p.bootcampName,
    createdAt: new Date(p.createdAt).toLocaleString('ko-KR'),
    launchPlatform: p.launchPlatform || '',
  };
}

@Component({
  selector: 'adm-portfolio',
  standalone: true,
  imports: [CommonModule, DataGridComponent],
  templateUrl: './portfolio.page.html',
  styleUrl: './portfolio.page.css',
})
export class PortfolioPage implements OnInit {
  private toast = inject(ToastService);
  private api = inject(ApiService);
  activeTab = signal<'portfolio' | 'hallOfFame'>('portfolio');
  viewMode = signal<'list' | 'form' | 'detail'>('list');

  ngOnInit(): void {
    this.loadPortfolios();
    this.loadHallOfFame();
  }

  async loadPortfolios(): Promise<void> {
    try {
      const data = await this.api.portfolios.findAll({ isHallOfFame: 'false' });
      this.portfolioData.set(data.map(toPortfolioRow));
    } catch (e) {
      console.error('포트폴리오 로드 실패:', e);
    }
  }

  async loadHallOfFame(): Promise<void> {
    try {
      const data = await this.api.portfolios.findHallOfFame();
      this.hallOfFameData.set(data.map(toPortfolioRow));
    } catch (e) {
      console.error('명예의 전당 로드 실패:', e);
    }
  }

  setTab(tab: 'portfolio' | 'hallOfFame'): void {
    this.activeTab.set(tab);
    this.viewMode.set('list');
  }

  openForm(): void {
    history.pushState({ view: 'form' }, '');
    this.viewMode.set('form');
  }

  openDetail(item: PortfolioRow): void {
    this.detailData.set(item);
    history.pushState({ view: 'detail' }, '');
    this.viewMode.set('detail');
  }

  backToList(): void { this.viewMode.set('list'); }

  @HostListener('window:popstate')
  onPopState(): void {
    if (this.viewMode() !== 'list') this.viewMode.set('list');
  }

  // ===== 상세 뷰 상태 =====
  detailData = signal<PortfolioRow | null>(null);
  detailDropdownOpen = signal(false);
  detailBasicInfoExpanded = signal(true);
  detailManuscriptExpanded = signal(true);
  detailPlanExpanded = signal(true);

  hidePortfolio(): void {
    this.detailDropdownOpen.set(false);
    this.toast.success('숨김 되었습니다.');
    this.viewMode.set('list');
  }

  async deletePortfolio(): Promise<void> {
    this.detailDropdownOpen.set(false);
    const detail = this.detailData();
    if (detail) {
      try {
        await this.api.portfolios.delete(detail.id);
        this.toast.success('삭제가 완료 되었습니다.');
        await this.loadPortfolios();
        await this.loadHallOfFame();
      } catch (e: unknown) {
        this.toast.error(e instanceof Error ? e.message : '삭제 실패');
      }
    }
    this.viewMode.set('list');
  }

  // ===== 컨텍스트 메뉴 핸들러 =====
  async onContextMenuSelect(event: { action: string; row: PortfolioRow }): Promise<void> {
    if (event.action === '삭제') {
      try {
        await this.api.portfolios.delete(event.row.id);
        this.toast.success('삭제가 완료 되었습니다.');
        await this.loadPortfolios();
        await this.loadHallOfFame();
      } catch (e: unknown) {
        this.toast.error(e instanceof Error ? e.message : '삭제 실패');
      }
    } else if (event.action === '수정') {
      this.openDetail(event.row);
    }
  }

  // ===== 명예의 전당 등록 드로어 =====
  hofDrawerOpen = signal(false);
  hofForm = signal({
    name: '', bootcampName: '', workTitle: '',
    workIntro: '', launchPlatform: '', launchUrl: '',
  });
  hofThumbnail = signal<{ name: string; size: string; preview: string; rawFile?: File } | null>(null);

  openHofDrawer(): void { this.hofDrawerOpen.set(true); }
  closeHofDrawer(): void { this.hofDrawerOpen.set(false); }

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
        name: file.name, size: `${Math.round(file.size / 1024)}KB`,
        preview: reader.result as string,
        rawFile: file,
      });
    };
    reader.readAsDataURL(file);
  }

  removeHofThumbnail(): void { this.hofThumbnail.set(null); }

  async registerHof(): Promise<void> {
    const form = this.hofForm();
    if (!form.name || !form.bootcampName) {
      this.toast.error('이름과 부트캠프명은 필수입니다.');
      return;
    }
    try {
      let thumbnailUrl = '';
      const thumb = this.hofThumbnail();
      if (thumb?.rawFile) {
        const uploadRes = await this.api.upload.single(thumb.rawFile, 'portfolios');
        thumbnailUrl = uploadRes.url;
      }

      await this.api.portfolios.create({
        userName: form.name,
        bootcampName: form.bootcampName,
        workTitle: form.workTitle,
        workIntro: form.workIntro,
        launchPlatform: form.launchPlatform,
        launchUrl: form.launchUrl,
        thumbnail: thumbnailUrl,
        isHallOfFame: true,
      });
      this.hofDrawerOpen.set(false);
      this.hofForm.set({ name: '', bootcampName: '', workTitle: '', workIntro: '', launchPlatform: '', launchUrl: '' });
      this.hofThumbnail.set(null);
      this.toast.success('등록 완료 되었습니다.');
      await this.loadHallOfFame();
    } catch (e: unknown) {
      this.toast.error(e instanceof Error ? e.message : '등록 실패');
    }
  }

  async submitPortfolio(): Promise<void> {
    const form = this.portfolioForm();
    if (!form.name || !form.bootcampName) {
      this.toast.error('이름과 부트캠프명은 필수입니다.');
      return;
    }
    try {
      let thumbnailUrl = '';
      const thumb = this.thumbnailFile();
      if (thumb?.rawFile) {
        const uploadRes = await this.api.upload.single(thumb.rawFile, 'portfolios');
        thumbnailUrl = uploadRes.url;
      }

      await this.api.portfolios.create({
        userName: form.name,
        bootcampName: form.bootcampName,
        workTitle: form.workTitle,
        authorName: form.authorName,
        genre: form.genre,
        workIntro: form.workIntro,
        thumbnail: thumbnailUrl,
        isHallOfFame: this.activeTab() === 'hallOfFame',
      });
      this.viewMode.set('list');
      this.toast.success('등록 완료 되었습니다.');
      await this.loadPortfolios();
      await this.loadHallOfFame();
    } catch (e: unknown) {
      this.toast.error(e instanceof Error ? e.message : '등록 실패');
    }
  }

  // ===== 담당자 설정 드로어 =====
  managerDrawerOpen = signal(false);
  managers = signal<{ name: string; email: string; editing: boolean }[]>([
    { name: '고식혜', email: 'yelim@lepisode.team', editing: false },
    { name: '고식혜', email: 'yelim@lepisode.team', editing: true },
    { name: '고식혜', email: 'yelim@lepisode.team', editing: false },
    { name: '고식혜', email: 'yelim@lepisode.team', editing: false },
  ]);

  openManagerDrawer(): void { this.managerDrawerOpen.set(true); }
  closeManagerDrawer(): void { this.managerDrawerOpen.set(false); }

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

  manuscriptFiles = signal<{ episode: number; name: string; size: string; preview: string }[]>([]);

  onManuscriptUpload(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const sizeKB = Math.round(file.size / 1024);
    const reader = new FileReader();
    reader.onload = () => {
      const current = this.manuscriptFiles();
      this.manuscriptFiles.set([...current, {
        episode: current.length + 1, name: file.name,
        size: `${sizeKB}KB`, preview: reader.result as string,
      }]);
    };
    reader.readAsDataURL(file);
  }

  removeManuscript(index: number): void {
    this.manuscriptFiles.update(files =>
      files.filter((_, i) => i !== index).map((f, i) => ({ ...f, episode: i + 1 }))
    );
  }

  thumbnailFile = signal<{ name: string; size: string; preview: string; rawFile?: File } | null>(null);
  planFile = signal<{ name: string; size: string; preview: string; rawFile?: File } | null>(null);

  onFileSelected(target: 'thumbnail' | 'plan', event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const sizeKB = Math.round(file.size / 1024);
    const reader = new FileReader();
    reader.onload = () => {
      const data = { name: file.name, size: `${sizeKB}KB`, preview: reader.result as string, rawFile: file };
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
    name: '', bootcampName: '', workTitle: '',
    authorName: '', genre: '', workIntro: '',
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

  portfolioData = signal<PortfolioRow[]>([]);
  hallOfFameData = signal<PortfolioRow[]>([]);
}
