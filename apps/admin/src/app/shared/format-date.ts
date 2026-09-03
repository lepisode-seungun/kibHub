/**
 * ISO 날짜 문자열을 한국어 로케일로 포맷합니다.
 * "오전/오후" 앞에서 줄바꿈되도록 날짜와 시간을 '\n'으로 분리합니다.
 * 예: "2026. 8. 27.\n오후 2:08:00"
 */
export function formatDate(dateStr: string | Date | undefined | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const str = d.toLocaleString('ko-KR');
  // "2026. 8. 27. 오후 2:08:00" → "2026. 8. 27\n오후 2:08"
  return str.replace(/\.\s+(오전|오후)/, '\n$1').replace(/:\d{2}$/, '');
}
