import { Component, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

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
export class ProfileEditPage {
  private router = inject(Router);
  private authService = inject(AuthService);

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
  nickname = '';
  phonePrefix = '';
  phone = '';
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

  /**
   * 저장 핸들러
   * - avatarFile이 있으면 FormData로 API 전송
   * - 나머지 폼 데이터도 함께 전송
   */
  async onSave(): Promise<void> {
    const formData = this.buildFormData();

    // 아바타 파일이 있으면 FormData에 추가
    if (this.avatarFile) {
      formData.append('avatar', this.avatarFile, this.avatarFile.name);
    }

    // TODO: API 연동
    // try {
    //   this.avatarUploading.set(true);
    //   const res = await fetch('/api/user/profile', {
    //     method: 'PUT',
    //     credentials: 'include',
    //     body: formData,
    //   });
    //   if (!res.ok) throw new Error('프로필 저장 실패');
    //   const data = await res.json();
    //   // authService에 유저 정보 갱신
    // } catch (err) {
    //   console.error(err);
    // } finally {
    //   this.avatarUploading.set(false);
    // }

    this.router.navigate(['/']);
  }

  onWithdraw(): void {
    this.router.navigate(['/withdraw']);
  }

  /* ===== 헬퍼 ===== */
  /**
   * 폼 필드를 FormData로 변환
   * - multipart/form-data로 아바타 + 텍스트 필드 한번에 전송 가능
   */
  private buildFormData(): FormData {
    const fd = new FormData();
    fd.append('nickname', this.nickname);
    fd.append('phonePrefix', this.phonePrefix);
    fd.append('phone', this.phone);
    fd.append('email', this.email);
    if (this.password) fd.append('password', this.password);
    fd.append('snsLink', this.snsLink);
    fd.append('snsInstagram', this.snsInstagram);
    fd.append('snsTwitter', this.snsTwitter);
    fd.append('snsYoutube', this.snsYoutube);
    fd.append('bio', this.bio);
    return fd;
  }
}
