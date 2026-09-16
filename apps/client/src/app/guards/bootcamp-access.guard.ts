import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ApiService } from '../services/api.service';

/**
 * 부트캠프 하위 페이지 접근 가드
 * 
 * 부트캠프 상태별 수강생 접근 제어:
 * - PREPARING / RECRUITING: 수강생 진입 차단 (아직 운영 전)
 * - OPERATING / CLOSED(모집마감): ACCEPTED 수강생만 진입 허용
 * - ENDED(종료): ACCEPTED 또는 COMPLETED 수강생 진입 허용 (설문조사)
 * 
 * 강사/관리자는 항상 접근 허용
 */
export const bootcampAccessGuard: CanActivateFn = async (route) => {
  const authService = inject(AuthService);
  const api = inject(ApiService);
  const router = inject(Router);

  // auth 체크 대기 (최대 5초)
  for (let i = 0; i < 50; i++) {
    if (authService.authChecked()) break;
    await new Promise(r => setTimeout(r, 100));
  }

  const user = authService.currentUser();
  if (!user) {
    router.navigate(['/login']);
    return false;
  }

  // bootcampId 추출 (라우트 파라미터: 'id' 또는 'bootcampId')
  const bootcampId = Number(route.paramMap.get('bootcampId') || route.paramMap.get('id'));
  if (!bootcampId) return true;

  // 강사/관리자는 항상 접근 허용
  if (user.role === 'INSTRUCTOR' || user.role === 'ADMIN') {
    return true;
  }

  try {
    // 부트캠프 상태 확인
    const bootcamp = await api.bootcamps.findOne(bootcampId);
    const bcStatus = bootcamp?.status || '';

    // 준비/모집 상태 → 수강생 진입 차단
    if (bcStatus === 'PREPARING' || bcStatus === 'RECRUITING') {
      router.navigate(['/my-bootcamp']);
      return false;
    }

    // 수강생 지원 상태 확인
    const applicants = await api.applicants.findByUser(user.id);
    const myApp = applicants.find((a) => a.bootcampId === bootcampId);

    if (!myApp) {
      router.navigate(['/my-bootcamp']);
      return false;
    }

    // ENDED(종료) → ACCEPTED 또는 COMPLETED 허용 (설문조사 접근)
    if (bcStatus === 'ENDED') {
      if (myApp.status === 'ACCEPTED' || myApp.status === 'COMPLETED') {
        return true;
      }
      router.navigate(['/my-bootcamp']);
      return false;
    }

    // OPERATING / CLOSED(모집마감) → ACCEPTED만 허용
    if (myApp.status !== 'ACCEPTED') {
      router.navigate(['/my-bootcamp']);
      return false;
    }
  } catch {
    // API 실패 시 접근 허용 (부트캠프 데이터 로드에서 다시 체크)
  }

  return true;
};
