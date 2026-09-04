import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ApiService } from '../services/api.service';

/**
 * 부트캠프 하위 페이지 접근 가드
 * ACCEPTED(수강중) 상태인 수강생만 접근 허용
 * PENDING(신청완료), WAITING(수강대기), COMPLETED(수료), REJECTED(불합격)은 /my-bootcamp로 리다이렉트
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

  // 부트캠프 마감/종료 상태면 모든 사용자 진입 차단
  try {
    const bootcamp: any = await api.bootcamps.findOne(bootcampId);
    if (bootcamp.status === 'CLOSED' || bootcamp.status === 'ENDED') {
      router.navigate(['/my-bootcamp']);
      return false;
    }
  } catch {}

  // 강사/관리자는 마감/종료가 아니면 접근 허용
  if (user.role === 'INSTRUCTOR' || user.role === 'ADMIN') {
    return true;
  }

  try {
    const applicants = await api.applicants.findByUser(user.id);
    const myApp = applicants.find((a: any) => a.bootcampId === bootcampId);
    // ACCEPTED 상태만 진입 허용
    if (!myApp || myApp.status !== 'ACCEPTED') {
      router.navigate(['/my-bootcamp']);
      return false;
    }
    // 부트캠프가 마감/종료 상태면 진입 차단
    const bootcamp = myApp.bootcamp;
    if (bootcamp && (bootcamp.status === 'CLOSED' || bootcamp.status === 'ENDED')) {
      router.navigate(['/my-bootcamp']);
      return false;
    }
  } catch {
    // API 실패 시 접근 허용 (부트캠프 데이터 로드에서 다시 체크)
  }

  return true;
};
