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
 * 파일을 실제 다운로드 — blob 변환 후 a[download]로 Chrome 다운로드 트리거
 * 서버 프록시를 통해 CORS 우회
 */
export async function downloadFile(url?: string, fileName?: string): Promise<void> {
  if (!url) return;

  const name = fileName || url.split('/').pop()?.split('?')[0] || 'download';

  // 1) 서버 프록시를 통해 blob 가져오기
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
      URL.revokeObjectURL(blobUrl);
      return;
    }
  } catch {
    // 프록시 실패 → 직접 fetch 시도
  }

  // 2) 직접 fetch fallback
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  } catch {
    // 최종 fallback: 새 탭으로 열기
    window.open(url, '_blank');
  }
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
