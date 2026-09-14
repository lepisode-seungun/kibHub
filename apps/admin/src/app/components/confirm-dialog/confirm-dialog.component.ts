import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface DialogDetailRow {
  label: string;
  value: string;
}

@Component({
  selector: 'adm-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.css',
})
export class ConfirmDialogComponent {
  /** 다이얼로그 표시 여부 */
  visible = input<boolean>(true);

  /** 제목 (예: '공지사항 삭제') */
  title = input<string>('');

  /** 상세 정보 행 목록 */
  details = input<DialogDetailRow[]>([]);

  /** 경고 메시지 */
  message = input<string>('');

  /** 취소 버튼 텍스트 */
  cancelText = input<string>('취소');

  /** 확인 버튼 텍스트 */
  confirmText = input<string>('삭제');

  /** 취소 이벤트 */
  cancel = output<void>();

  /** 확인 이벤트 */
  confirm = output<void>();

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('dialog-overlay')) {
      this.cancel.emit();
    }
  }

  onCancel(): void {
    this.cancel.emit();
  }

  onConfirm(): void {
    this.confirm.emit();
  }
}
