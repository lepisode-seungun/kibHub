import { Component, signal, inject, computed, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';

/** 허용 이미지 타입 */
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
/** 최대 파일 크기 5MB */
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export interface ProfileFormData {
  nickname: string;
  phonePrefix: string;
  phone: string;
  email: string;
  password: string;
  snsLink: string;
  snsInstagram: string;
  snsTwitter: string;
  snsYoutube: string;
  bio: string;
}

@Component({
  selector: 'app-profile-edit',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './profile-edit.page.html',
  styleUrls: ['./profile-edit.page.css'],
})
export class ProfileEditPage implements OnInit {
  private router = inject(Router);
  private authService = inject(AuthService);
  private api = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);

  private userId = 0;

  ngOnInit(): void { this.loadProfile(); }

  private async loadProfile(): Promise<void> {
    try {
      const user = await this.api.users.me();
      this.userId = user.id;
      this.editName = user.name || '';
      this.nickname = user.nickname || '';
      this.email = user.email;
      this.phone = user.phone || '';
      this.birthday = user.birthday || '';
      this.bio = user.intro || '';

      // 국가코드 매핑
      if (user.countryCode) {
        const code = '+' + user.countryCode;
        const found = this.countryCodes.find(c => c.code === code);
        if (found) {
          this.selectedCountry = found;
          this.phonePrefix = found.code;
        }
      }

      // 프로필 이미지
      if (user.profileImage) {
        this.avatarPreviewUrl.set(user.profileImage);
      }

      // SNS
      if (user.sns && user.sns.length > 0) {
        for (const s of user.sns) {
          if (s.type === 'LINK') this.snsLink = s.url;
          else if (s.type === 'INSTAGRAM') this.snsInstagram = s.url;
          else if (s.type === 'TWITTER') this.snsTwitter = s.url;
          else if (s.type === 'YOUTUBE') this.snsYoutube = s.url;
        }
      }
    } catch (e) {
      console.error('프로필 로드 실패:', e);
    } finally {
      this.cdr.detectChanges();
    }
  }

  readonly userInitial = computed(() => this.authService.currentUser()?.initial ?? '');
  readonly userName = computed(() => this.authService.currentUser()?.nickname ?? '');

  /* ===== 국가 코드 드롭다운 ===== */
  readonly defaultCountry = { code: '', label: '국가선택', flag: '🌐' };
  countryCodes = [
    { code: '+82', label: '대한민국 (+82)', flag: '🇰🇷' },
    { code: '+1', label: '미국/캐나다 (+1)', flag: '🇺🇸' },
    { code: '+81', label: '일본 (+81)', flag: '🇯🇵' },
    { code: '+86', label: '중국 (+86)', flag: '🇨🇳' },
    { code: '+44', label: '영국 (+44)', flag: '🇬🇧' },
    { code: '+49', label: '독일 (+49)', flag: '🇩🇪' },
    { code: '+33', label: '프랑스 (+33)', flag: '🇫🇷' },
    { code: '+61', label: '호주 (+61)', flag: '🇦🇺' },
    { code: '+65', label: '싱가포르 (+65)', flag: '🇸🇬' },
    { code: '+84', label: '베트남 (+84)', flag: '🇻🇳' },
  ];
  selectedCountry: { code: string; label: string; flag: string } = this.defaultCountry;
  isCountryDropdownOpen = signal(false);

  toggleCountryDropdown(): void {
    this.isCountryDropdownOpen.update(v => !v);
  }

  selectCountry(country: { code: string; label: string; flag: string }): void {
    this.selectedCountry = country;
    this.phonePrefix = country.code;
    this.isCountryDropdownOpen.set(false);
  }

  resetCountry(): void {
    this.selectedCountry = this.defaultCountry;
    this.phonePrefix = '';
    this.isCountryDropdownOpen.set(false);
  }

  /* ===== 폼 필드 ===== */
  editName = '';
  nickname = '';
  phonePrefix = '';
  phone = '';
  birthday = '';
  email = '';
  password = '';
  snsLink = '';
  snsInstagram = '';
  snsTwitter = '';
  snsYoutube = '';
  bio = '';

  /* ===== 아바타 ===== */
  /** 미리보기용 Data URL */
  avatarPreviewUrl = signal<string | null>(null);
  /** API 전송용 원본 File 객체 */
  private avatarFile: File | null = null;
  /** 업로드 상태 */
  avatarUploading = signal(false);
  avatarError = signal<string | null>(null);

  /**
   * 파일 선택 핸들러
   * - 타입/크기 검증 후 미리보기 생성
   * - 원본 File은 avatarFile에 보관 (onSave 시 API 전송)
   */
  onAvatarFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.avatarError.set(null);

    if (!input.files || !input.files[0]) return;
    const file = input.files[0];

    // 타입 검증
    if (!ALLOWED_TYPES.includes(file.type)) {
      this.avatarError.set('JPG, PNG, WebP, GIF 파일만 업로드 가능합니다.');
      input.value = '';
      return;
    }

    // 크기 검증
    if (file.size > MAX_FILE_SIZE) {
      this.avatarError.set('파일 크기는 5MB 이하만 가능합니다.');
      input.value = '';
      return;
    }

    // File 보관
    this.avatarFile = file;

    // 미리보기 생성
    const reader = new FileReader();
    reader.onload = (e) => {
      this.avatarPreviewUrl.set(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // input 리셋 (같은 파일 재선택 가능하도록)
    input.value = '';
  }

  /* ===== 네비게이션 ===== */
  goBack(): void {
    this.router.navigate(['/']);
  }

  onCancel(): void {
    this.router.navigate(['/']);
  }

  saveSuccess = signal(false);
  saveError = signal<string | null>(null);

  /**
   * 저장 핸들러
   * - avatarFile이 있으면 upload API로 이미지 업로드 후 URL 획득
   * - 모든 폼 데이터를 users.update로 전송
   */
  async onSave(): Promise<void> {
    if (!this.userId) {
      this.saveError.set('로그인이 필요합니다. 다시 로그인해주세요.');
      return;
    }
    this.saveError.set(null);
    try {
      this.avatarUploading.set(true);

      // 프로필 이미지 업로드
      let profileImageUrl: string | undefined;
      if (this.avatarFile) {
        const result = await this.api.upload.single(this.avatarFile, 'profiles');
        profileImageUrl = result.url;
      }

      // 국가코드 ('+82' → '82')
      const countryCode = this.phonePrefix ? this.phonePrefix.replace('+', '') : undefined;

      const snsData: { type: string; label: string; url: string }[] = [];
      if (this.snsLink) snsData.push({ type: 'LINK', label: '링크', url: this.snsLink });
      if (this.snsInstagram) snsData.push({ type: 'INSTAGRAM', label: '인스타그램', url: this.snsInstagram });
      if (this.snsTwitter) snsData.push({ type: 'TWITTER', label: 'X (Twitter)', url: this.snsTwitter });
      if (this.snsYoutube) snsData.push({ type: 'YOUTUBE', label: '유튜브', url: this.snsYoutube });

      const updateData = {
        name: this.editName || undefined,
        nickname: this.nickname || undefined,
        phone: this.phone || undefined,
        countryCode: countryCode,
        birthday: this.birthday || undefined,
        intro: this.bio || undefined,
        profileImage: profileImageUrl || undefined,
        sns: snsData,
      };

      console.log('프로필 저장 요청:', { userId: this.userId, data: updateData });

      // 사용자 정보 업데이트
      await this.api.users.update(this.userId, updateData);

      // 인증 사용자 정보 갱신
      await this.authService.refreshUser();

      // 성공 표시 후 프로필 페이지로 이동
      this.saveSuccess.set(true);
      setTimeout(() => this.router.navigate(['/profile']), 800);
    } catch (e: unknown) {
      console.error('프로필 저장 실패:', e);
      const msg = e instanceof Error ? e.message : '프로필 저장에 실패했습니다.';
      this.saveError.set(msg);
    } finally {
      this.avatarUploading.set(false);
    }
  }

  onWithdraw(): void {
    this.router.navigate(['/withdraw']);
  }
}
