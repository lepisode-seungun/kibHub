/**
 * 파일 관련 공통 유틸리티
 * - 다운로드, 이미지 판별, 사이즈 포맷 등
 */

/** 이미지 확장자 목록 */
const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico', 'avif'];

/**
 * mimeType 또는 파일 확장자로 이미지 파일인지 판별
 */
export function isImageFile(file: { name?: string; mimeType?: string }): boolean {
  if (file.mimeType?.startsWith('image/')) return true;
  const ext = file.name?.split('.').pop()?.toLowerCase() || '';
  return IMAGE_EXTENSIONS.includes(ext);
}

/**
 * 파일을 다운로드 — 크롬 다운로드 로그에 기록됨
 * fetch + blob + a[download] 방식 사용
 */
export async function downloadFile(url?: string, fileName?: string): Promise<void> {
  if (!url) return;

  const name = fileName || url.split('/').pop()?.split('?')[0] || 'download';

  // 1) fetch로 blob 가져오기 (CORS 우회를 위해 proxy 사용)
  try {
    const proxyUrl = `/api/upload/proxy?url=${encodeURIComponent(url)}`;
    const res = await fetch(proxyUrl);
    if (res.ok) {
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      return;
    }
  } catch {
    // fetch 실패 → fallback
  }

  // 2) fetch 실패 시 → a 태그로 직접 다운로드
  const downloadUrl = `${url}${url.includes('?') ? '&' : '?'}download=${encodeURIComponent(name)}`;
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = name;
  a.target = '_blank';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * 바이트 수를 사람이 읽기 쉬운 형태로 변환
 * 예: 1024 → '1KB', 1048576 → '1.0MB'
 */
export function formatFileSize(bytes: number): string {
  if (bytes <= 0) return '0KB';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}
