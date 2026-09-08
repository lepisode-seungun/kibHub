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
 * 파일을 실제 다운로드 — "다른 이름으로 저장" 다이얼로그 표시
 * showSaveFilePicker 지원 시 저장 경로 선택 가능 (Chrome/Edge)
 * 미지원 시 fetch+blob 방식으로 fallback
 */
export async function downloadFile(url?: string, fileName?: string): Promise<void> {
  if (!url) return;

  const name = fileName || url.split('/').pop()?.split('?')[0] || 'download';

  let blob: Blob | null = null;

  // 1) fetch로 blob 가져오기
  try {
    const res = await fetch(url);
    if (res.ok) {
      blob = await res.blob();
    }
  } catch {
    // CORS 등 fetch 실패 → fallback
  }

  // 2) blob 성공 시 showSaveFilePicker 시도
  if (blob) {
    if ('showSaveFilePicker' in window) {
      try {
        const ext = name.includes('.') ? (name.split('.').pop() ?? '') : '';
        const handle = await (window as unknown as { showSaveFilePicker: (opts: { suggestedName: string; types: { description: string; accept: Record<string, string[]> }[] }) => Promise<FileSystemFileHandle> }).showSaveFilePicker({
          suggestedName: name,
          types: ext ? [{
            description: `${ext.toUpperCase()} 파일`,
            accept: { [blob.type || 'application/octet-stream']: [`.${ext}`] },
          }] : [],
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        return;
      } catch (pickerErr: unknown) {
        if (pickerErr instanceof DOMException && pickerErr.name === 'AbortError') return;
        // picker 실패 시 a[download] fallback
      }
    }

    // 3) a[download] fallback
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

  // 4) fetch 자체가 실패한 경우 → 새 탭 열기
  window.open(url, '_blank');
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
