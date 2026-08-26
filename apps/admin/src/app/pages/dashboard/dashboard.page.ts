import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'adm-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col gap-6">
      <div class="grid grid-cols-4 gap-6">
        @for (card of statsCards; track card.label) {
          <div class="flex flex-col gap-2 p-6 bg-white border border-zinc-200 rounded-xl">
            <span class="font-suit font-medium text-sm tracking-[-0.04em] text-zinc-400">{{ card.label }}</span>
            <span class="font-suit font-bold text-2xl tracking-[-0.04em] text-gray-700">{{ card.value }}</span>
            <span class="font-suit font-medium text-xs tracking-[-0.04em]"
                  [ngClass]="card.change > 0 ? 'text-green-500' : 'text-red-500'">
              {{ card.change > 0 ? '+' : '' }}{{ card.change }}%
            </span>
          </div>
        }
      </div>
    </div>
  `,
  styles: [':host { display: block; }'],
})
export class DashboardPage {
  statsCards = [
    { label: '전체 수강생', value: '1,234', change: 12 },
    { label: '활성 부트캠프', value: '8', change: 3 },
    { label: '이번 달 수익', value: '₩45.2M', change: -2 },
    { label: '완료율', value: '87%', change: 5 },
  ];
}
