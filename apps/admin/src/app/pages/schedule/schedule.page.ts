import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'adm-schedule',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './schedule.page.html',
  styleUrl: './schedule.page.css',
})
export class SchedulePage {
  activeTab = signal<'schedule' | 'management'>('schedule');

  setTab(tab: 'schedule' | 'management'): void {
    this.activeTab.set(tab);
  }

  // 에디터 내용
  editorContent = signal('');

  updateEditorContent(event: Event): void {
    const value = (event.target as HTMLTextAreaElement).value;
    this.editorContent.set(value);
  }
}
