import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from './toast.service';

@Component({
  selector: 'adm-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center gap-2">
      @for (msg of toastService.messages(); track msg.id) {
        <div class="flex items-center p-3 gap-2 w-[328px] min-h-[44px] rounded-xl toast-slide-up"
             [style.background]="msg.type === 'warning' ? '#78350F' : '#323A47'">
          <!-- 아이콘 -->
          @switch (msg.type) {
            @case ('success') {
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" class="shrink-0">
                <path d="M10 0C4.48 0 0 4.48 0 10s4.48 10 10 10 10-4.48 10-10S15.52 0 10 0zm-2 15l-5-5 1.41-1.41L8 12.17l7.59-7.59L17 6l-9 9z" fill="#4ADE80"/>
              </svg>
            }
            @case ('error') {
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" class="shrink-0">
                <path d="M10 0C4.48 0 0 4.48 0 10s4.48 10 10 10 10-4.48 10-10S15.52 0 10 0zm1 15H9v-2h2v2zm0-4H9V5h2v6z" fill="#DC2626" opacity="0.5"/>
                <path d="M9.27 9.27L10.73 10.73M10.73 9.27L9.27 10.73" fill="#DC2626"/>
              </svg>
            }
            @case ('warning') {
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" class="shrink-0">
                <path d="M1 18h18L10 1 1 18zm10.5-2.5h-3v-1h3v1zm0-3h-3v-4h3v4z" fill="#FDE68A"/>
              </svg>
            }
            @case ('info') {
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" class="shrink-0">
                <path d="M10 0C4.48 0 0 4.48 0 10s4.48 10 10 10 10-4.48 10-10S15.52 0 10 0zm1 15H9V9h2v6zm0-8H9V5h2v2z" fill="#93C5FD"/>
              </svg>
            }
          }
          <!-- 텍스트 -->
          <span class="font-suit font-semibold text-sm leading-[17px] tracking-[-0.6px] text-white flex-1">
            {{ msg.text }}
          </span>
        </div>
      }
    </div>
  `,
  styles: [`
    @keyframes toastSlideUp {
      from {
        opacity: 0;
        transform: translateY(16px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    .toast-slide-up {
      animation: toastSlideUp 0.3s ease-out forwards;
    }
  `],
})
export class ToastComponent {
  toastService = inject(ToastService);
}
