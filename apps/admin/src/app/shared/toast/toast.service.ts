import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: number;
  text: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 0;
  messages = signal<ToastMessage[]>([]);

  show(text: string, type: ToastMessage['type'] = 'info', duration = 3000): void {
    const id = this.nextId++;
    this.messages.update(list => [...list, { id, text, type }]);

    setTimeout(() => {
      this.messages.update(list => list.filter(m => m.id !== id));
    }, duration);
  }

  success(text: string, duration = 3000): void {
    this.show(text, 'success', duration);
  }

  error(text: string, duration = 4000): void {
    this.show(text, 'error', duration);
  }

  info(text: string, duration = 3000): void {
    this.show(text, 'info', duration);
  }

  warning(text: string, duration = 3500): void {
    this.show(text, 'warning', duration);
  }
}
