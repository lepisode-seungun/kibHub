import { Component, signal, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ToastService } from '../../shared/toast/toast.service';
import { DataGridComponent, GridColumn } from '../../components/data-grid/data-grid.component';
import { ROLE_BADGES } from '../../shared/badge-styles';

@Component({
  selector: 'adm-assignment-detail',
  standalone: true,
  imports: [CommonModule, DataGridComponent],
  templateUrl: './assignment-detail.page.html',
  styleUrl: './assignment-detail.page.css',
})
export class AssignmentDetailPage {
  private location = inject(Location);
  private toast = inject(ToastService);

  // 아코디언 상태
  courseInfoOpen = signal(true);
  assignmentInfoOpen = signal(true);
  assignmentContentOpen = signal(true);
  boardOpen = signal(true);

  toggleCourseInfo(): void { this.courseInfoOpen.update(v => !v); }
  toggleAssignmentInfo(): void { this.assignmentInfoOpen.update(v => !v); }
  toggleAssignmentContent(): void { this.assignmentContentOpen.update(v => !v); }
  toggleBoard(): void { this.boardOpen.update(v => !v); }

  // 과제 기본 정보 드롭다운
  assignmentInfoMenuOpen = signal(false);
  toggleAssignmentInfoMenu(): void { this.assignmentInfoMenuOpen.update(v => !v); }
  onAssignmentInfoMenuAction(action: string): void {
    this.assignmentInfoMenuOpen.set(false);
    if (action === 'delete') {
      this.showDeleteModal.set(true);
    }
  }

  // 삭제 확인 모달
  showDeleteModal = signal(false);
  confirmDelete(): void {
    this.showDeleteModal.set(false);
    this.toast.success('삭제 완료 되었습니다.');
    this.location.back();
  }
  cancelDelete(): void {
    this.showDeleteModal.set(false);
  }

  // 샘플 데이터
  courseData = {
    id: 1,
    status: '노출',
    name: '웹툰의 기초',
    createdAt: '2025-01-20 13:11',
  };

  assignmentData = {
    id: 1,
    name: '얼굴 그리기',
    createdAt: '2025-01-20 13:11',
    deadlineStart: '2025-01-20',
    deadlineEnd: '2025-01-31',
    videoUrl: 'https://vimeo.com/1048803857/8709552d2e',
    videoDuration: '12:30',
    content: '얼굴 그리기얼굴 그리기얼굴 그리기얼굴 그리기얼굴 그리기 얼굴 그리기얼굴 그리기얼굴 그리기얼굴 그리기얼굴 그리기얼굴 그리기얼굴 그리기얼굴 그리기얼굴 그리기얼굴 그리기얼굴 그리기얼굴 그리기얼굴 그리기얼굴 그리기얼굴 그리기얼굴 그리기얼굴 그리기얼굴 그리기얼굴 그리기얼굴 그리기얼굴 그리기얼굴 그리기얼굴 그리기얼굴 그리기얼굴 그리기',
    materials: [
      { name: '학습자료학습자료학습자료학습자료학습자료학습자료학습자료', size: '10.2MB' },
      { name: '학습자료.pdf', size: '10.2MB' },
    ],
  };

  // 게시판 그리드
  boardColumns: GridColumn[] = [
    { key: 'id', label: '순번', width: '60px' },
    { key: 'type', label: '유형', width: '80px' },
    { key: 'title', label: '제목' },
    { key: 'comments', label: '댓글', width: '80px' },
    { key: 'permission', label: '권한', width: '100px', badge: 'permission', badgeStyles: ROLE_BADGES },
    { key: 'author', label: '작성자', width: '120px' },
    { key: 'createdAt', label: '등록일시', width: '160px' },
  ];

  boardData = [
    { id: 1, type: '공지', title: '과제 제출 안내', comments: 3, permission: '관리자', author: '관리자', createdAt: '2025-01-20 13:11' },
    { id: 2, type: '질문', title: '과제 제출 기한 연장 가능한가요?', comments: 1, permission: '일반', author: '홍길동', createdAt: '2025-01-21 09:30' },
    { id: 3, type: '질문', title: '참고자료 관련 질문드립니다', comments: 0, permission: '일반', author: '김민수', createdAt: '2025-01-22 14:20' },
    { id: 4, type: '공지', title: '과제 평가 기준 안내', comments: 5, permission: '강사', author: '관리자', createdAt: '2025-01-23 10:00' },
    { id: 5, type: '질문', title: '파일 형식 관련 문의', comments: 2, permission: '일반', author: '이영희', createdAt: '2025-01-24 16:45' },
  ];

  // 제출 과제 삭제 다이얼로그
  showBoardDeleteModal = signal(false);
  boardDeleteRow = signal<any>(null);

  onBoardContextMenu(event: { action: string; row: any }): void {
    if (event.action === '삭제') {
      this.boardDeleteRow.set(event.row);
      this.showBoardDeleteModal.set(true);
    }
  }

  confirmBoardDelete(): void {
    const row = this.boardDeleteRow();
    if (row) {
      this.boardData = this.boardData.filter(r => r.id !== row.id);
      this.toast.success('삭제 완료 되었습니다.');
    }
    this.showBoardDeleteModal.set(false);
    this.boardDeleteRow.set(null);
  }

  cancelBoardDelete(): void {
    this.showBoardDeleteModal.set(false);
    this.boardDeleteRow.set(null);
  }

  // 제출 과제 상세 사이드 드로어
  submissionDrawerOpen = signal(false);
  selectedSubmission = signal<any>(null);

  openSubmissionDrawer(row: any): void {
    this.selectedSubmission.set({
      ...row,
      content: '얼굴 그리기얼굴 그리기얼굴 그리기얼굴 그리기얼굴 그리기 얼굴 그리기얼굴 그리기얼굴 그리기얼굴 그리기얼굴 그리기얼굴 그리기얼굴 그리기얼굴 그리기얼굴 그리기얼굴 그리기얼굴 그리기얼굴 그리기얼굴 그리기얼굴 그리기얼굴 그리기얼굴 그리기얼굴 그리기얼굴 그리기얼굴 그리기얼굴 그리기얼굴 그리기얼굴 그리기얼굴 그리기얼굴 그리기얼굴 그리기',
      files: [
        { name: '학습자료학습자료학습자료학습자료학습자료학습자료학습자료', size: '10.2MB' },
        { name: '학습자료.pdf', size: '10.2MB' },
      ],
    });
    this.submissionDrawerOpen.set(true);
  }

  closeSubmissionDrawer(): void {
    this.submissionDrawerOpen.set(false);
  }

  goBack(): void {
    this.location.back();
  }
}
