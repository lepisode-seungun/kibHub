import { Injectable, signal } from '@angular/core';

/**
 * 현재 선택된 부트캠프 컨텍스트를 관리하는 서비스.
 * 부트캠프 목록에서 특정 부트캠프 진입 시 ID/이름을 저장하고,
 * 지원자 관리 등 하위 페이지에서 이를 참조합니다.
 * sessionStorage로 새로고침 시에도 상태를 유지합니다.
 */
@Injectable({ providedIn: 'root' })
export class BootcampContextService {
  private readonly STORAGE_KEY = 'bootcamp_context';

  /** 현재 선택된 부트캠프 ID */
  readonly currentBootcampId = signal<number | null>(this.loadFromStorage()?.id ?? null);

  /** 현재 선택된 부트캠프 이름 (사이드바 타이틀 표시용) */
  readonly currentBootcampName = signal<string>(this.loadFromStorage()?.name ?? '');

  /** 부트캠프 선택 */
  setBootcamp(id: number, name: string): void {
    this.currentBootcampId.set(id);
    this.currentBootcampName.set(name);
    this.saveToStorage(id, name);
  }

  /** 컨텍스트 초기화 (메인 모드 복귀 시) */
  clear(): void {
    this.currentBootcampId.set(null);
    this.currentBootcampName.set('');
    sessionStorage.removeItem(this.STORAGE_KEY);
  }

  private saveToStorage(id: number, name: string): void {
    sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify({ id, name }));
  }

  private loadFromStorage(): { id: number; name: string } | null {
    try {
      const raw = sessionStorage.getItem(this.STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
}
