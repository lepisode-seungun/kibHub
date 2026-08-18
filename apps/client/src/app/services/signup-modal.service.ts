import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SignupModalService {
  showModal = signal(false);
  nickname = signal('');
  intro = signal('');

  open(nickname: string, intro: string): void {
    this.nickname.set(nickname);
    this.intro.set(intro);
    this.showModal.set(true);
  }

  close(): void {
    this.showModal.set(false);
  }
}
