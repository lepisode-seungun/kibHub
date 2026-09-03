import { formatDate } from '../../shared/format-date';
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataGridComponent, GridColumn } from '../../components/data-grid/data-grid.component';
import { ConfirmDialogComponent, DialogDetailRow } from '../../components/confirm-dialog/confirm-dialog.component';
import { CONTENT_STATUS_BADGES } from '../../shared/badge-styles';
import { ToastService } from '../../shared/toast/toast.service';
import { ApiService } from '../../services/api.service';
import { Faq, FaqRow } from '../../shared/types';

function toFaqRow(f: Faq): FaqRow {
  return {
    id: f.id,
    status: f.status === 'HIDDEN' ? '숨김' : '노출',
    question: f.question,
    answer: f.answer,
    author: f.author?.nickname || f.author?.name || '관리자',
    createdAt: formatDate(f.createdAt),
  };
}

@Component({
  selector: 'adm-support-faq',
  standalone: true,
  imports: [CommonModule, DataGridComponent, ConfirmDialogComponent],
  templateUrl: './support-faq.page.html',
  styleUrl: './support-faq.page.css',
})
export class SupportFaqPage implements OnInit {
  private toast = inject(ToastService);
  private api = inject(ApiService);

  columns: GridColumn[] = [
    { key: 'id', label: '순번', width: '72px' },
    { key: 'status', label: '상태', width: '80px', badge: 'status', badgeStyles: CONTENT_STATUS_BADGES },
    { key: 'question', label: '질문' },
    { key: 'author', label: '작성자', width: '120px' },
    { key: 'createdAt', label: '등록일시', width: '160px' },
  ];

  faqs = signal<FaqRow[]>([]);

  showDeleteDialog = signal(false);
  deleteTarget = signal<FaqRow | null>(null);
  deleteDialogDetails = signal<DialogDetailRow[]>([]);

  drawerOpen = signal(false);
  drawerMode = signal<'create' | 'edit'>('create');
  editingFaqId = signal<number | null>(null);
  drawerForm = signal({ question: '', answer: '' });

  ngOnInit(): void {
    this.loadFaqs();
  }

  async loadFaqs(): Promise<void> {
    try {
      const data = await this.api.faqs.findAll();
      this.faqs.set(data.map(toFaqRow));
    } catch (e) {
      console.error('FAQ 로드 실패:', e);
    }
  }

  getContextMenuItems = (row: FaqRow): string[] => {
    const statusLabel = row.status === '노출' ? '숨김' : '노출';
    return [statusLabel, '수정', '삭제'];
  };

  onRowClick(_row: FaqRow): void {}

  onRegister(): void {
    this.drawerMode.set('create');
    this.editingFaqId.set(null);
    this.drawerForm.set({ question: '', answer: '' });
    this.drawerOpen.set(true);
  }

  closeDrawer(): void { this.drawerOpen.set(false); }

  async onContextMenu(event: { action: string; row: FaqRow }): Promise<void> {
    const { action, row } = event;
    switch (action) {
      case '숨김':
      case '노출':
        try {
          await this.api.faqs.update(row.id, { status: row.status === '노출' ? 'HIDDEN' : 'VISIBLE' });
          this.toast.success(row.status === '노출' ? '숨김 처리 되었습니다.' : '노출 처리 되었습니다.');
          await this.loadFaqs();
        } catch (e: unknown) { this.toast.error(e instanceof Error ? e.message : '처리 실패'); }
        break;
      case '수정':
        this.openEditDrawer(row);
        break;
      case '삭제':
        this.openDeleteDialog(row);
        break;
    }
  }

  private openEditDrawer(row: FaqRow): void {
    this.drawerMode.set('edit');
    this.editingFaqId.set(row.id);
    this.drawerForm.set({ question: row.question, answer: row.answer });
    this.drawerOpen.set(true);
  }

  async submitDrawer(): Promise<void> {
    const form = this.drawerForm();
    if (!form.question.trim()) { this.toast.error('질문을 입력해주세요.'); return; }
    if (!form.answer.trim()) { this.toast.error('답변을 입력해주세요.'); return; }

    try {
      if (this.drawerMode() === 'create') {
        await this.api.faqs.create({ question: form.question, answer: form.answer });
        this.toast.success('등록 완료 되었습니다.');
      } else {
        await this.api.faqs.update(this.editingFaqId()!, { question: form.question, answer: form.answer });
        this.toast.success('수정 완료 되었습니다.');
      }
      this.drawerOpen.set(false);
      await this.loadFaqs();
    } catch (e: unknown) {
      this.toast.error(e instanceof Error ? e.message : '처리 실패');
    }
  }

  updateDrawerField(field: 'question' | 'answer', value: string): void {
    this.drawerForm.update(f => ({ ...f, [field]: value }));
  }

  private openDeleteDialog(row: FaqRow): void {
    this.deleteTarget.set(row);
    this.deleteDialogDetails.set([
      { label: '질문', value: row.question },
      { label: '작성자', value: row.author },
      { label: '등록일시', value: row.createdAt },
    ]);
    this.showDeleteDialog.set(true);
  }

  async onDeleteConfirm(): Promise<void> {
    const target = this.deleteTarget();
    if (target) {
      try {
        await this.api.faqs.delete(target.id);
        this.toast.success('삭제 완료 되었습니다.');
        await this.loadFaqs();
      } catch (e: unknown) { this.toast.error(e instanceof Error ? e.message : '삭제 실패'); }
    }
    this.showDeleteDialog.set(false);
    this.deleteTarget.set(null);
  }

  onDeleteCancel(): void {
    this.showDeleteDialog.set(false);
    this.deleteTarget.set(null);
  }
}
