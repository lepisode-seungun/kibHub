import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';

interface UploadFile {
  name: string;
  ext: string;
  size: string;
  status: 'uploading' | 'done';
}

@Component({
  selector: 'app-inquiry-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './inquiry-form.page.html',
  styleUrls: ['./inquiry-form.page.css'],
})
export class InquiryFormPage implements OnInit {
  title = '';
  content = '';
  maxFiles = 10;
  isEditMode = signal(false);
  private editId = '';

  // 더미 첨부파일
  files: UploadFile[] = [];
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);

  ngOnInit(): void {
    this.route.paramMap.subscribe(async (params) => {
      const id = params.get('id');
      if (id && id !== 'new') {
        this.isEditMode.set(true);
        this.editId = id;
        try {
          const q = await this.api.inquiries.findOne(Number(id));
          this.title = q.title || '';
          this.content = q.body || '';
        } catch (e) {
          console.error('문의 로드 실패:', e);
        }
      } else {
        this.isEditMode.set(false);
      }
    });
  }

  removeFile(index: number): void {
    this.files.splice(index, 1);
  }

  removeAllFiles(): void {
    this.files = [];
  }

  onFileSelect(): void {
    // TODO: 파일 선택 다이얼로그
  }

  goToList(): void {
    this.router.navigate(['/customer-center']);
  }

  async onSubmit(): Promise<void> {
    if (!this.title.trim() || !this.content.trim()) return;
    try {
      await this.api.inquiries.create({ title: this.title, body: this.content });
      this.router.navigate(['/customer-center']);
    } catch (e) {
      console.error('문의 등록 실패:', e);
    }
  }
}
