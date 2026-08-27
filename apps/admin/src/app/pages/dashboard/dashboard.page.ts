import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'adm-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col gap-6">
      <div class="grid grid-cols-4 gap-6">
        @for (card of statsCards(); track card.label) {
          <div class="flex flex-col gap-2 p-6 bg-white border border-zinc-200 rounded-xl">
            <span class="font-suit font-medium text-sm tracking-[-0.04em] text-zinc-400">{{ card.label }}</span>
            <span class="font-suit font-bold text-2xl tracking-[-0.04em] text-gray-700">{{ card.value }}</span>
          </div>
        }
      </div>
    </div>
  `,
  styles: [':host { display: block; }'],
})
export class DashboardPage implements OnInit {
  private api = inject(ApiService);

  statsCards = signal([
    { label: '전체 회원', value: '-' },
    { label: '부트캠프', value: '-' },
    { label: '콘텐츠', value: '-' },
    { label: '문의', value: '-' },
  ]);

  async ngOnInit(): Promise<void> {
    try {
      const [users, bootcamps, contents, inquiries] = await Promise.all([
        this.api.users.findAll(),
        this.api.bootcamps.findAll(),
        this.api.contents.findAll(),
        this.api.inquiries.findAll(),
      ]);
      this.statsCards.set([
        { label: '전체 회원', value: String(users.length) },
        { label: '부트캠프', value: String(bootcamps.length) },
        { label: '콘텐츠', value: String(contents.length) },
        { label: '문의', value: String(inquiries.length) },
      ]);
    } catch {
      // API 미연결 시 기본값 유지
    }
  }
}
