import { Component, Input, Output, EventEmitter, signal, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ViewerImage {
  gradient: string;
  url?: string;
  markers?: { rank: number; top: number; left: number }[];
}

@Component({
  selector: 'app-image-viewer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './image-viewer.component.html',
  styleUrl: './image-viewer.component.css',
})
export class ImageViewerComponent implements OnChanges {
  @Input() images: ViewerImage[] = [];
  @Input() isOpen = false;
  @Input() startPage = 1;
  @Input() pageLabel = '회';
  @Output() closed = new EventEmitter<void>();

  currentPage = signal(1);

  get totalPages(): number {
    return this.images.length;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen) {
      this.currentPage.set(this.startPage || 1);
      document.body.style.overflow = 'hidden';
    }
    if (changes['isOpen'] && !this.isOpen) {
      document.body.style.overflow = '';
    }
  }

  close(): void {
    this.closed.emit();
  }

  prevPage(): void {
    this.currentPage.update(p => p > 1 ? p - 1 : this.totalPages);
  }

  nextPage(): void {
    this.currentPage.update(p => p < this.totalPages ? p + 1 : 1);
  }

  onOverlayClick(event: Event): void {
    if ((event.target as HTMLElement).classList.contains('iv-overlay')) {
      this.close();
    }
  }
}
