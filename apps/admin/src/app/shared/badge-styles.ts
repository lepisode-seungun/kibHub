/**
 * 관리자 페이지 공통 뱃지 스타일 설정
 * DataGridComponent의 badgeStyles에 직접 사용 가능
 */

// ===== 콘텐츠 상태 =====
export const CONTENT_STATUS_BADGES: Record<string, string> = {
  '노출': 'bg-emerald-50 border-emerald-300 text-emerald-600',
  '숨김': 'bg-zinc-50 border-zinc-200 text-zinc-500',
};

// ===== 부트캠프 상태 =====
export const BOOTCAMP_STATUS_BADGES: Record<string, string> = {
  '준비': 'bg-emerald-50 border-emerald-300 text-emerald-600',
  '모집': 'bg-amber-50 border-amber-300 text-amber-600',
  '운영': 'bg-blue-50 border-blue-300 text-blue-600',
  '마감': 'bg-zinc-50 border-zinc-200 text-zinc-500',
  '종료': 'bg-red-50 border-red-300 text-red-500',
};

// ===== 지원자 상태 =====
export const APPLICANT_STATUS_BADGES: Record<string, string> = {
  '대기': 'bg-orange-50 border-orange-300 text-orange-600',
  '합격': 'bg-emerald-50 border-emerald-300 text-emerald-600',
  '불합격': 'bg-zinc-50 border-zinc-200 text-zinc-500',
};

// ===== 권한 =====
export const ROLE_BADGES: Record<string, string> = {
  '일반': 'bg-zinc-50 border-zinc-200 text-zinc-500',
  '강사': 'bg-amber-50 border-amber-300 text-amber-600',
  '관리자': 'bg-blue-50 border-blue-300 text-blue-600',
};

// ===== 회원 상태 =====
export const MEMBER_STATUS_BADGES: Record<string, string> = {
  '정상': 'bg-emerald-50 border-emerald-300 text-emerald-600',
  '차단': 'bg-red-50 border-red-300 text-red-500',
  '탈퇴': 'bg-zinc-50 border-zinc-200 text-zinc-500',
};
