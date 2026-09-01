import { Component, signal, computed, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { TextEditorComponent } from '../../components/text-editor/text-editor.component';
import { DataGridComponent, GridColumn } from '../../components/data-grid/data-grid.component';
import { ImageUploadComponent, ImageUploadData } from '../../components/image-upload/image-upload.component';
import { CONTENT_STATUS_BADGES } from '../../shared/badge-styles';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'adm-bootcamp-intro',
  standalone: true,
  imports: [CommonModule, TextEditorComponent, DataGridComponent, ImageUploadComponent],
  templateUrl: './bootcamp-intro.page.html',
  styleUrl: './bootcamp-intro.page.css',
})
export class BootcampIntroPage implements OnInit {
  private api = inject(ApiService);
  private sanitizer = inject(DomSanitizer);
  activeTab = signal<'intro' | 'banner' | 'academy' | 'partner'>('intro');

  // ===== 소개 탭 =====
  academyIntroContent = signal('');
  private academyIntroDraft = '';

  ngOnInit(): void {
    this.loadBanners();
    this.loadAcademyIntro();
    this.loadVideoUrl();
    this.loadPosters();
    this.loadHistories();
    this.loadPartners();
  }

  async loadAcademyIntro(): Promise<void> {
    try {
      const result = await this.api.siteSettings.get('academy_intro');
      if (result.value) {
        this.academyIntroContent.set(result.value);
        this.academyIntroDraft = result.value;
      }
    } catch (e) {
      console.error('소개 콘텐츠 로드 실패:', e);
    }
  }

  onAcademyIntroChange(html: string): void {
    this.academyIntroDraft = html;
  }

  async saveAcademyIntro(): Promise<void> {
    try {
      await this.api.siteSettings.set('academy_intro', this.academyIntroDraft);
      alert('저장되었습니다.');
    } catch (e) {
      console.error('소개 콘텐츠 저장 실패:', e);
      alert('저장에 실패했습니다.');
    }
  }

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

  bannerData = signal<any[]>([]);

  async loadBanners(): Promise<void> {
    try {
      const data = await this.api.banners.findAll();
      this.bannerData.set(data.map(b => ({
        id: b.id,
        status: b.status === 'VISIBLE' ? '노출' : '숨김',
        image: b.pcImage || '',
        header: b.header,
        content: b.content,
        link: b.link || '',
        createdAt: new Date(b.createdAt).toLocaleString('ko-KR'),
        _raw: b,
      })));
    } catch (e) {
      console.error('배너 로드 실패:', e);
    }
  }

  // ===== 영상 관리 =====
  videoSectionExpanded = signal(true);
  vimeoLink = signal('');
  vimeoEmbedUrl = signal<SafeResourceUrl | null>(null);

  toggleVideoSection(): void {
    this.videoSectionExpanded.update(v => !v);
  }

  onVimeoLinkInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.vimeoLink.set(val);
  }

  async loadVideoUrl(): Promise<void> {
    try {
      const result = await this.api.siteSettings.get('video_url');
      if (result.value) {
        this.vimeoLink.set(result.value);
        this.vimeoEmbedUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(this.toVideoEmbed(result.value)));
      }
    } catch (e) {
      console.error('영상 URL 로드 실패:', e);
    }
  }

  async registerVimeoLink(): Promise<void> {
    const url = this.vimeoLink();
    if (!url.trim()) { alert('비메오 링크를 입력하세요.'); return; }
    try {
      await this.api.siteSettings.set('video_url', url);
      this.vimeoEmbedUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(this.toVideoEmbed(url)));
      alert('영상이 등록되었습니다.');
    } catch (e) {
      console.error('영상 등록 실패:', e);
      alert('영상 등록에 실패했습니다.');
    }
  }

  private toVideoEmbed(url: string): string {
    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    if (url.includes('player.vimeo.com')) return url;
    // YouTube
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]+)/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
    if (url.includes('youtube.com/embed')) return url;
    return url;
  }

  // ===== 아카데미 현역 - 포스터 관리 =====
  posterSectionExpanded = signal(true);

  togglePosterSection(): void {
    this.posterSectionExpanded.update(v => !v);
  }

  posterColumns: GridColumn[] = [
    { key: 'id', label: '순번', width: '80px' },
    { key: 'image', label: '이미지', width: '200px', type: 'image' },
    { key: 'createdAt', label: '등록일시', headerColor: 'text-gray-600' },
  ];

  posterData = signal<any[]>([]);

  async loadPosters(): Promise<void> {
    try {
      const data = await this.api.posters.findAll();
      this.posterData.set(data.map(p => ({
        id: p.id,
        image: p.imageUrl || '',
        createdAt: new Date(p.createdAt).toLocaleString('ko-KR'),
        _raw: p,
      })));
    } catch (e) {
      console.error('포스터 로드 실패:', e);
    }
  }

  // ===== 파트너 탭 =====
  partnerColumns: GridColumn[] = [
    { key: 'id', label: '순번', width: '80px' },
    { key: 'logo', label: '로고', width: '200px', type: 'image' },
    { key: 'name', label: '이름' },
    { key: 'link', label: '링크' },
    { key: 'createdAt', label: '등록일시', headerColor: 'text-gray-600' },
  ];

  partnerData = signal<any[]>([]);

  async loadPartners(): Promise<void> {
    try {
      const data = await this.api.partners.findAll();
      this.partnerData.set(data.map(p => ({
        id: p.id,
        logo: p.logoUrl || '',
        name: p.name,
        link: p.link || '',
        createdAt: new Date(p.createdAt).toLocaleString('ko-KR'),
        _raw: p,
      })));
    } catch (e) {
      console.error('파트너 로드 실패:', e);
    }
  }

  // ===== 포스터 드로어 =====
  showPosterDrawer = signal(false);
  posterDrawerMode = signal<'add' | 'edit'>('add');
  posterImage = signal<{ name: string; size: string; preview: string; file?: File } | null>(null);
  private editingPosterId: number | null = null;

  openPosterDrawer(mode: 'add' | 'edit', row?: any): void {
    this.posterDrawerMode.set(mode);
    this.editingPosterId = mode === 'edit' && row ? (row._raw?.id || row.id) : null;
    this.posterImage.set(null);
    this.showPosterDrawer.set(true);
  }

  closePosterDrawer(): void {
    this.showPosterDrawer.set(false);
  }

  onPosterImageSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const sizeKB = Math.round(file.size / 1024);
    const reader = new FileReader();
    reader.onload = () => {
      this.posterImage.set({
        name: file.name,
        size: `${sizeKB}KB`,
        preview: reader.result as string,
        file,
      });
    };
    reader.readAsDataURL(file);
  }

  removePosterImage(): void {
    this.posterImage.set(null);
  }

  async submitPosterDrawer(): Promise<void> {
    const img = this.posterImage();
    if (!img?.file) { alert('이미지를 업로드하세요.'); return; }
    try {
      const uploaded = await this.api.upload.single(img.file, 'posters');
      await this.api.posters.create({ imageUrl: uploaded.url });
      this.showPosterDrawer.set(false);
      await this.loadPosters();
      alert('포스터가 등록되었습니다.');
    } catch (e) {
      console.error('포스터 등록 실패:', e);
      alert('등록에 실패했습니다.');
    }
  }

  async onPosterContextMenu(event: { action: string; row: any }): Promise<void> {
    if (event.action === '삭제') {
      const id = event.row._raw?.id || event.row.id;
      if (!confirm('포스터를 삭제하시겠습니까?')) return;
      try {
        await this.api.posters.delete(id);
        await this.loadPosters();
      } catch (e) {
        console.error('포스터 삭제 실패:', e);
        alert('삭제에 실패했습니다.');
      }
    }
  }

  // ===== 파트너 드로어 =====
  showPartnerDrawer = signal(false);
  partnerDrawerMode = signal<'add' | 'edit'>('add');
  partnerForm = signal({ name: '', link: '' });
  partnerImage = signal<{ name: string; size: string; preview: string; file?: File } | null>(null);
  private editingPartnerId: number | null = null;

  openPartnerDrawer(mode: 'add' | 'edit', row?: any): void {
    this.partnerDrawerMode.set(mode);
    this.editingPartnerId = mode === 'edit' && row ? (row._raw?.id || row.id) : null;
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
        file,
      });
    };
    reader.readAsDataURL(file);
  }

  removePartnerImage(): void {
    this.partnerImage.set(null);
  }

  async submitPartnerDrawer(): Promise<void> {
    const form = this.partnerForm();
    if (!form.name.trim()) { alert('이름을 입력하세요.'); return; }
    try {
      if (this.partnerDrawerMode() === 'add') {
        let logoUrl = '';
        const img = this.partnerImage();
        if (img?.file) {
          const uploaded = await this.api.upload.single(img.file, 'partners');
          logoUrl = uploaded.url;
        }
        await this.api.partners.create({ name: form.name, logoUrl, link: form.link });
      } else if (this.editingPartnerId) {
        const updateData: any = { name: form.name, link: form.link };
        const img = this.partnerImage();
        if (img?.file) {
          const uploaded = await this.api.upload.single(img.file, 'partners');
          updateData.logoUrl = uploaded.url;
        }
        await this.api.partners.update(this.editingPartnerId, updateData);
      }
      this.showPartnerDrawer.set(false);
      await this.loadPartners();
    } catch (e) {
      console.error('파트너 저장 실패:', e);
      alert('저장에 실패했습니다.');
    }
  }

  async onPartnerContextMenu(event: { action: string; row: any }): Promise<void> {
    if (event.action === '수정') {
      this.openPartnerDrawer('edit', event.row);
    } else if (event.action === '삭제') {
      const id = event.row._raw?.id || event.row.id;
      if (!confirm('파트너를 삭제하시겠습니까?')) return;
      try {
        await this.api.partners.delete(id);
        await this.loadPartners();
      } catch (e) {
        console.error('파트너 삭제 실패:', e);
        alert('삭제에 실패했습니다.');
      }
    }
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

  async submitYearDrawer(): Promise<void> {
    const year = this.yearDrawerValue();
    if (!year.trim()) { alert('연도를 입력하세요.'); return; }
    // 이미 존재하는 연도인지 체크
    const existing = this.historyData().find(g => g.year === year.trim());
    if (existing) { alert(`${year}년은 이미 존재합니다.`); return; }
    // 빈 연도 폴더를 추가 (정렬: 내림차순)
    const current = [...this.historyData(), { year: year.trim(), items: [] }];
    current.sort((a, b) => parseInt(b.year) - parseInt(a.year));
    this.historyData.set(current);
    this.showYearDrawer.set(false);
  }

  async onYearAction(year: string, action: string): Promise<void> {
    this.activeYearMenu.set(null);
    if (action === '수정') {
      this.openYearDrawer('edit', year);
    } else if (action === '삭제') {
      if (!confirm(`${year}년의 모든 히스토리를 삭제하시겠습니까?`)) return;
      try {
        await this.api.histories.deleteByYear(year);
        // 로컬에서도 즉시 제거
        this.historyData.update(data => data.filter(g => g.year !== year));
      } catch (e) {
        // DB에 항목이 없었던 빈 폴더면 로컬에서만 제거
        this.historyData.update(data => data.filter(g => g.year !== year));
      }
    }
  }

  // ===== 히스토리 항목 우클릭 메뉴 =====
  activeHistoryItemMenu = signal<{ year: string; index: number } | null>(null);

  toggleHistoryItemMenu(year: string, index: number, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const current = this.activeHistoryItemMenu();
    if (current && current.year === year && current.index === index) {
      this.activeHistoryItemMenu.set(null);
    } else {
      this.activeHistoryItemMenu.set({ year, index });
    }
  }

  async onHistoryItemAction(year: string, item: any, action: string): Promise<void> {
    this.activeHistoryItemMenu.set(null);
    if (action === '수정') {
      this.openHistoryItemDrawer('edit', item, year);
    } else if (action === '삭제') {
      if (!confirm('이 항목을 삭제하시겠습니까?')) return;
      try {
        await this.api.histories.delete(item.id);
        await this.loadHistories();
      } catch (e) {
        console.error('항목 삭제 실패:', e);
        alert('삭제에 실패했습니다.');
      }
    }
  }

  // ===== 히스토리 항목 드로어 =====
  showHistoryItemDrawer = signal(false);
  historyItemMode = signal<'add' | 'edit'>('add');
  historyItemForm = signal({ title: '', content: '', date: '', year: '' });
  private editingHistoryItemId: number | null = null;

  openHistoryItemDrawer(mode: 'add' | 'edit', item?: any, year?: string): void {
    this.historyItemMode.set(mode);
    this.editingHistoryItemId = mode === 'edit' && item ? item.id : null;
    this.historyItemForm.set({
      title: mode === 'edit' && item ? item.title : '',
      content: mode === 'edit' && item ? (item.description || '') : '',
      date: mode === 'edit' && item ? item.period : '',
      year: year || '',
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

  async submitHistoryItemDrawer(): Promise<void> {
    const form = this.historyItemForm();
    if (!form.year.trim() || !form.title.trim() || !form.date.trim()) {
      alert('연도, 제목, 상세날짜를 입력하세요.');
      return;
    }
    try {
      if (this.historyItemMode() === 'add') {
        await this.api.histories.create({
          year: form.year,
          title: form.title,
          description: form.content || undefined,
          period: form.date,
        });
      } else if (this.editingHistoryItemId) {
        await this.api.histories.update(this.editingHistoryItemId, {
          title: form.title,
          description: form.content || undefined,
          period: form.date,
        });
      }
      this.showHistoryItemDrawer.set(false);
      await this.loadHistories();
    } catch (e) {
      console.error('히스토리 항목 저장 실패:', e);
      alert('저장에 실패했습니다.');
    }
  }

  historyData = signal<{ year: string; items: any[] }[]>([]);

  async loadHistories(): Promise<void> {
    try {
      const data = await this.api.histories.findAll();
      this.historyData.set(data);
    } catch (e) {
      console.error('히스토리 로드 실패:', e);
    }
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

  onBannerContextMenu(event: { action: string; row: any }): void {
    if (event.action === '수정') {
      this.openBannerDrawer(event.row);
    } else if (event.action === '삭제') {
      this.deleteBanner(event.row._raw?.id || event.row.id);
    } else if (event.action === '숨김') {
      this.toggleBannerStatus(event.row._raw?.id || event.row.id, 'HIDDEN');
    }
  }

  async deleteBanner(id: number): Promise<void> {
    try {
      await this.api.banners.delete(id);
      await this.loadBanners();
    } catch (e) {
      console.error('배너 삭제 실패:', e);
    }
  }

  async toggleBannerStatus(id: number, status: string): Promise<void> {
    try {
      await this.api.banners.update(id, { status });
      await this.loadBanners();
    } catch (e) {
      console.error('배너 상태 변경 실패:', e);
    }
  }

  openBannerDrawer(row?: any): void {
    if (row) {
      const raw = row._raw;
      this.bannerDrawerRow.set(raw || row);
      this.bannerForm.set({
        status: row.status || '노출',
        vimeoLink: raw?.vimeoLink || '',
        header: raw?.header || row.header || '',
        content: raw?.content || row.content || '',
        link: raw?.link || row.link || '',
      });
    } else {
      this.bannerDrawerRow.set(null);
      this.bannerForm.set({ status: '노출', vimeoLink: '', header: '', content: '', link: '' });
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

  triggerFileInput(inputId: string): void {
    (document.getElementById(inputId) as HTMLInputElement)?.click();
  }

  // ===== 이미지 업로드 =====
  @ViewChild('pcUpload') pcUploadRef!: ImageUploadComponent;
  @ViewChild('mobileUpload') mobileUploadRef!: ImageUploadComponent;

  pcImageData = signal<ImageUploadData | null>(null);
  mobileImageData = signal<ImageUploadData | null>(null);

  onPcImageChange(data: ImageUploadData | null): void {
    this.pcImageData.set(data);
  }

  onMobileImageChange(data: ImageUploadData | null): void {
    this.mobileImageData.set(data);
  }

  async submitBannerForm(): Promise<void> {
    const form = this.bannerForm();
    const editRow = this.bannerDrawerRow();
    const status = form.status === '숨김' ? 'HIDDEN' : 'VISIBLE';

    try {
      // 이미지 업로드
      let pcImageUrl: string | undefined;
      let mobileImageUrl: string | undefined;

      const pc = this.pcImageData();
      const mobile = this.mobileImageData();

      if (pc) {
        const result = await this.api.upload.single(pc.file, 'banners');
        pcImageUrl = result.url;
      }
      if (mobile) {
        const result = await this.api.upload.single(mobile.file, 'banners');
        mobileImageUrl = result.url;
      }

      const bannerData: any = {
        status,
        header: form.header,
        content: form.content,
        link: form.link || undefined,
        vimeoLink: form.vimeoLink || undefined,
      };
      if (pcImageUrl) bannerData.pcImage = pcImageUrl;
      if (mobileImageUrl) bannerData.mobileImage = mobileImageUrl;

      if (editRow) {
        await this.api.banners.update(editRow.id, bannerData);
      } else {
        await this.api.banners.create(bannerData);
      }
      this.showBannerDrawer.set(false);
      this.pcImageData.set(null);
      this.mobileImageData.set(null);
      this.pcUploadRef?.reset();
      this.mobileUploadRef?.reset();
      await this.loadBanners();
    } catch (e) {
      console.error('배너 저장 실패:', e);
    }
  }
}
