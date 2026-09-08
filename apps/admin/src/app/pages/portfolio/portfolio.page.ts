import { formatDate } from '../../shared/format-date';
import { Component, signal, HostListener, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataGridComponent, GridColumn, GridRow } from '../../components/data-grid/data-grid.component';
import { CONTENT_STATUS_BADGES } from '../../shared/badge-styles';
import { ToastService } from '../../shared/toast/toast.service';
import { ApiService } from '../../services/api.service';
import { Portfolio, PortfolioRow } from '../../shared/types';


interface PortfolioPayload {
  userName: string;
  bootcampName: string;
  workTitle?: string;
  authorName?: string;
  genre?: string;
  workIntro?: string;
  launchPlatform?: string;
  launchUrl?: string;
  thumbnail?: string;
  isHallOfFame?: boolean;
  files?: { name: string; url: string; size: number; mimeType: string; episode?: number }[];
}

function toPortfolioRow(p: Portfolio): PortfolioRow {
  return {
    id: p.id,
    status: p.status === 'HIDDEN' ? '숨김' : '노출',
    thumbnail: p.thumbnail || '',
    name: p.userName,
    bootcampName: p.bootcampName,
    createdAt: formatDate(p.createdAt),
    launchPlatform: p.launchPlatform || '',
    workTitle: p.workTitle || '',
    authorName: p.authorName || '',
    genre: p.genre || '',
    workIntro: p.workIntro || '',
    launchUrl: p.launchUrl || '',
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
    this.editingId.set(null);
    this.portfolioForm.set({ name: '', bootcampName: '', workTitle: '', authorName: '', genre: '', workIntro: '' });
    this.thumbnailFile.set(null);
    this.planFile.set(null);
    this.manuscriptFiles.set([]);
    history.pushState({ view: 'form' }, '');
    this.viewMode.set('form');
  }

  async openDetail(gridRow: GridRow): Promise<void> {
    const item = gridRow as unknown as PortfolioRow;
    this.detailData.set(item);
    history.pushState({ view: 'detail' }, '');
    this.viewMode.set('detail');
    // 파일 데이터 로드
    try {
      const p = await this.api.portfolios.findOne(item.id);
      if (p.files?.length) {
        const plan = p.files.find(f => !f.episode);
        const manuscripts = p.files
          .filter(f => f.episode)
          .sort((a, b) => (a.episode ?? 0) - (b.episode ?? 0));
        this.detailPlanUrl.set(plan?.url || '');
        this.detailManuscripts.set(manuscripts.map(f => ({ episode: f.episode ?? 0, url: f.url, name: f.name })));
      } else {
        this.detailPlanUrl.set('');
        this.detailManuscripts.set([]);
      }
    } catch {
      this.detailPlanUrl.set('');
      this.detailManuscripts.set([]);
    }
  }

  backToList(): void { this.viewMode.set('list'); }

  @HostListener('window:popstate')
  onPopState(): void {
    if (this.viewMode() !== 'list') this.viewMode.set('list');
  }

  @HostListener('document:click')
  onDocumentClick(): void { this.detailDropdownOpen.set(false); }

  // ===== 상세 뷰 상태 =====
  detailData = signal<PortfolioRow | null>(null);
  detailDropdownOpen = signal(false);
  detailBasicInfoExpanded = signal(true);
  detailManuscriptExpanded = signal(true);
  detailPlanExpanded = signal(true);
  detailPlanUrl = signal('');
  detailManuscripts = signal<{ episode: number; url: string; name: string }[]>([]);
  detailThumbnailExpanded = signal(true);

  async toggleVisibility(): Promise<void> {
    this.detailDropdownOpen.set(false);
    const detail = this.detailData();
    if (detail) {
      const isHidden = detail.status === '숨김';
      const newStatus = isHidden ? 'VISIBLE' : 'HIDDEN';
      try {
        await this.api.portfolios.update(detail.id, { status: newStatus } as Record<string, string>);
        this.detailData.set({ ...detail, status: isHidden ? '노출' : '숨김' });
        this.toast.success(isHidden ? '노출 처리 되었습니다.' : '숨김 처리 되었습니다.');
        await this.loadPortfolios();
        await this.loadHallOfFame();
      } catch (e: unknown) {
        this.toast.error(e instanceof Error ? e.message : '처리 실패');
      }
    }
  }

  async editFromDetail(): Promise<void> {
    this.detailDropdownOpen.set(false);
    const detail = this.detailData();
    if (detail) {
      if (this.activeTab() === 'hallOfFame') {
        await this.openHofEditDrawer(detail.id);
      } else {
        await this.openEditForm(detail);
      }
    }
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
  editingId = signal<number | null>(null);

  async onContextMenuSelect(event: { action: string; row: GridRow }): Promise<void> {
    const row = event.row as unknown as PortfolioRow;
    if (event.action === '삭제') {
      try {
        await this.api.portfolios.delete(row.id);
        this.toast.success('삭제가 완료 되었습니다.');
        await this.loadPortfolios();
        await this.loadHallOfFame();
      } catch (e: unknown) {
        this.toast.error(e instanceof Error ? e.message : '삭제 실패');
      }
    } else if (event.action === '수정') {
      if (this.activeTab() === 'hallOfFame') {
        await this.openHofEditDrawer(row.id);
      } else {
        await this.openEditForm(row);
      }
    }
  }

  async openEditForm(row: PortfolioRow): Promise<void> {
    try {
      const p = await this.api.portfolios.findOne(row.id);
      this.editingId.set(p.id);
      this.portfolioForm.set({
        name: p.userName || '',
        bootcampName: p.bootcampName || '',
        workTitle: p.workTitle || '',
        authorName: p.authorName || '',
        genre: p.genre || '',
        workIntro: p.workIntro || '',
      });
      if (p.thumbnail) {
        this.thumbnailFile.set({ name: '기존 썸네일', size: '', preview: p.thumbnail });
      } else {
        this.thumbnailFile.set(null);
      }
      // 기획서 로드
      if (p.files?.length) {
        const plan = p.files.find(f => !f.episode);
        if (plan) {
          this.planFile.set({ name: plan.name || '기존 기획서', size: '', preview: plan.url });
        } else {
          this.planFile.set(null);
        }
        // 원고 로드
        const manuscripts = p.files
          .filter(f => f.episode)
          .sort((a, b) => (a.episode ?? 0) - (b.episode ?? 0));
        this.manuscriptFiles.set(manuscripts.map(f => ({
          episode: f.episode ?? 0,
          name: f.name || `${f.episode}회 원고`,
          size: '',
          preview: f.url,
          url: f.url,
        })));
      } else {
        this.planFile.set(null);
        this.manuscriptFiles.set([]);
      }
      history.pushState({ view: 'form' }, '');
      this.viewMode.set('form');
    } catch (e: unknown) {
      this.toast.error(e instanceof Error ? e.message : '데이터 로드 실패');
    }
  }

  // ===== 명예의 전당 등록 드로어 =====
  hofDrawerOpen = signal(false);
  hofForm = signal({
    name: '', bootcampName: '', workTitle: '',
    workIntro: '', launchPlatform: '', launchUrl: '',
  });
  hofThumbnail = signal<{ name: string; size: string; preview: string; rawFile?: File } | null>(null);

  hofEditingId = signal<number | null>(null);

  openHofDrawer(): void {
    this.hofEditingId.set(null);
    this.hofForm.set({ name: '', bootcampName: '', workTitle: '', workIntro: '', launchPlatform: '', launchUrl: '' });
    this.hofThumbnail.set(null);
    this.hofDrawerOpen.set(true);
  }

  async openHofEditDrawer(id: number): Promise<void> {
    try {
      const p = await this.api.portfolios.findOne(id);
      this.hofEditingId.set(p.id);
      this.hofForm.set({
        name: p.userName || '',
        bootcampName: p.bootcampName || '',
        workTitle: p.workTitle || '',
        workIntro: p.workIntro || '',
        launchPlatform: p.launchPlatform || '',
        launchUrl: p.launchUrl || '',
      });
      if (p.thumbnail) {
        this.hofThumbnail.set({ name: '기존 썸네일', size: '', preview: p.thumbnail });
      } else {
        this.hofThumbnail.set(null);
      }
      this.hofDrawerOpen.set(true);
    } catch (e: unknown) {
      this.toast.error(e instanceof Error ? e.message : '데이터 로드 실패');
    }
  }

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
      } else if (thumb?.preview && !thumb.rawFile) {
        thumbnailUrl = thumb.preview;
      }

      const payload: PortfolioPayload = {
        userName: form.name,
        bootcampName: form.bootcampName,
        workTitle: form.workTitle,
        workIntro: form.workIntro,
        launchPlatform: form.launchPlatform,
        launchUrl: form.launchUrl,
        thumbnail: thumbnailUrl,
        isHallOfFame: true,
      };

      const eid = this.hofEditingId();
      if (eid) {
        await this.api.portfolios.update(eid, payload);
        this.toast.success('수정 완료 되었습니다.');
      } else {
        await this.api.portfolios.create(payload);
        this.toast.success('등록 완료 되었습니다.');
      }
      this.hofDrawerOpen.set(false);
      this.hofEditingId.set(null);
      this.hofForm.set({ name: '', bootcampName: '', workTitle: '', workIntro: '', launchPlatform: '', launchUrl: '' });
      this.hofThumbnail.set(null);
      await this.loadHallOfFame();
      if (this.viewMode() === 'detail') {
        const detail = this.detailData();
        if (detail && eid) {
          const updated = await this.api.portfolios.findOne(eid);
          this.detailData.set(toPortfolioRow(updated));
        }
      }
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
      } else if (thumb?.preview && !thumb.rawFile) {
        thumbnailUrl = thumb.preview; // 기존 썸네일 유지
      }

      // 기획서 업로드
      const files: { name: string; url: string; size: number; mimeType: string; episode?: number }[] = [];
      const plan = this.planFile();
      if (plan?.rawFile) {
        const uploadRes = await this.api.upload.single(plan.rawFile, 'portfolios');
        files.push({ name: plan.name, url: uploadRes.url, size: plan.rawFile.size, mimeType: plan.rawFile.type });
      }

      // 원고 업로드
      for (const ms of this.manuscriptFiles()) {
        if (ms.rawFile) {
          const uploadRes = await this.api.upload.single(ms.rawFile, 'portfolios');
          files.push({ name: ms.name, url: uploadRes.url, size: ms.rawFile.size, mimeType: ms.rawFile.type, episode: ms.episode });
        } else if (ms.url) {
          files.push({ name: ms.name, url: ms.url, size: 0, mimeType: '', episode: ms.episode });
        }
      }

      const payload: PortfolioPayload = {
        userName: form.name,
        bootcampName: form.bootcampName,
        workTitle: form.workTitle,
        authorName: form.authorName,
        genre: form.genre,
        workIntro: form.workIntro,
        thumbnail: thumbnailUrl,
        isHallOfFame: this.activeTab() === 'hallOfFame',
        files,
      };

      const eid = this.editingId();
      if (eid) {
        await this.api.portfolios.update(eid, payload);
        this.toast.success('수정 완료 되었습니다.');
      } else {
        await this.api.portfolios.create(payload);
        this.toast.success('등록 완료 되었습니다.');
      }
      this.editingId.set(null);
      this.portfolioForm.set({ name: '', bootcampName: '', workTitle: '', authorName: '', genre: '', workIntro: '' });
      this.thumbnailFile.set(null);
      this.planFile.set(null);
      this.manuscriptFiles.set([]);
      this.viewMode.set('list');
      await this.loadPortfolios();
      await this.loadHallOfFame();
    } catch (e: unknown) {
      this.toast.error(e instanceof Error ? e.message : '등록 실패');
    }
  }

  // ===== 담당자 설정 드로어 =====
  managerDrawerOpen = signal(false);
  managers = signal<{ name: string; email: string; editing: boolean }[]>([]);
  private managersLoaded = false;

  async openManagerDrawer(): Promise<void> {
    this.managerDrawerOpen.set(true);
    if (!this.managersLoaded) {
      await this.loadManagers();
      this.managersLoaded = true;
    }
  }
  closeManagerDrawer(): void { this.managerDrawerOpen.set(false); }

  private async loadManagers(): Promise<void> {
    try {
      const res = await this.api.siteSettings.get('portfolio_managers');
      if (res.value) {
        const parsed = JSON.parse(res.value) as { name: string; email: string }[];
        this.managers.set(parsed.map(m => ({ ...m, editing: false })));
      }
    } catch {
      // 키가 없으면 빈 배열
      this.managers.set([]);
    }
  }

  async saveManagers(): Promise<void> {
    try {
      const data = this.managers().map(m => ({ name: m.name, email: m.email }));
      await this.api.siteSettings.set('portfolio_managers', JSON.stringify(data));
      this.toast.success('담당자 설정이 저장되었습니다.');
      // 모든 항목 편집 모드 해제
      this.managers.update(m => m.map(item => ({ ...item, editing: false })));
    } catch {
      this.toast.error('담당자 설정 저장에 실패했습니다.');
    }
  }

  addManager(): void {
    this.managers.update(m => [...m, { name: '', email: '', editing: true }]);
  }

  managerError = signal<{ index: number; message: string } | null>(null);

  async saveManager(index: number): Promise<void> {
    const mgr = this.managers()[index];
    if (!mgr.name.trim() || !mgr.email.trim()) {
      this.managerError.set({ index, message: '이름과 이메일을 모두 입력해주세요.' });
      return;
    }
    this.managerError.set(null);
    this.managers.update(m => m.map((item, i) => i === index ? { ...item, editing: false } : item));
    await this.saveManagers();
  }

  editManager(index: number): void {
    this.managerError.set(null);
    this.managers.update(m => m.map((item, i) => i === index ? { ...item, editing: true } : item));
  }

  cancelEditManager(index: number): void {
    this.managerError.set(null);
    const mgr = this.managers()[index];
    // 새로 추가된 빈 항목이면 제거
    if (!mgr.name.trim() && !mgr.email.trim()) {
      this.managers.update(m => m.filter((_, i) => i !== index));
    } else {
      this.managers.update(m => m.map((item, i) => i === index ? { ...item, editing: false } : item));
    }
  }

  async deleteManager(index: number): Promise<void> {
    this.managers.update(m => m.filter((_, i) => i !== index));
    await this.saveManagers();
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

  manuscriptFiles = signal<{ episode: number; name: string; size: string; preview: string; rawFile?: File; url?: string }[]>([]);

  onManuscriptUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (!files || files.length === 0) return;

    const current = this.manuscriptFiles();
    const startEpisode = current.length + 1;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const sizeKB = Math.round(file.size / 1024);
      const episode = startEpisode + i;
      const reader = new FileReader();
      reader.onload = () => {
        this.manuscriptFiles.update(prev => [...prev, {
          episode,
          name: file.name,
          size: `${sizeKB}KB`,
          preview: reader.result as string,
          rawFile: file,
        }]);
      };
      reader.readAsDataURL(file);
    }

    // input 초기화 (같은 파일 재선택 가능)
    input.value = '';
  }

  removeManuscript(index: number): void {
    this.manuscriptFiles.update(files =>
      files.filter((_, i) => i !== index).map((f, i) => ({ ...f, episode: i + 1 }))
    );
  }

  // ===== 원고 드래그앤드롭 =====
  msDragIndex: number | null = null;

  onMsDragStart(index: number, event: DragEvent): void {
    this.msDragIndex = index;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', String(index));
    }
  }

  onMsDragOver(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  onMsDrop(targetIndex: number, event: DragEvent): void {
    event.preventDefault();
    if (this.msDragIndex === null || this.msDragIndex === targetIndex) {
      this.msDragIndex = null;
      return;
    }

    const files = [...this.manuscriptFiles()];
    const [moved] = files.splice(this.msDragIndex, 1);
    files.splice(targetIndex, 0, moved);

    // episode 번호 재배정
    this.manuscriptFiles.set(files.map((f, i) => ({ ...f, episode: i + 1 })));
    this.msDragIndex = null;
  }

  onMsDragEnd(): void {
    this.msDragIndex = null;
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
