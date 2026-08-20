import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export interface BootcampCard {
  id: number;
  name: string;
  summary: string;
  status: 'recruiting' | 'closed';
  statusText: string;
  deadline: string | null;
  thumbnailGradient: string;
}

@Component({
  selector: 'app-k-digital',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './k-digital.page.html',
  styleUrls: ['./k-digital.page.css'],
})
export class KDigitalPage {
  heroTitle = '부트캠프';
  heroSubtitle = '전문가가 알려주는 실전 노하우!';
  bootcampCards: BootcampCard[] = [
    {
      id: 1, name: '케나즈 초급반 13기', summary: '기초부터 탄탄하게',
      status: 'recruiting', statusText: '모집중', deadline: '01.15 모집 마감',
      thumbnailGradient: 'linear-gradient(135deg, #5a3a8c, #2a1a50)',
    },
    {
      id: 2, name: '케나즈 중급반 8기', summary: '실전 웹툰 제작',
      status: 'recruiting', statusText: '모집중', deadline: '01.15 모집 마감',
      thumbnailGradient: 'linear-gradient(135deg, #667eea, #764ba2)',
    },
    {
      id: 3, name: '캐릭터 디자인 5기', summary: '매력적인 캐릭터 만들기',
      status: 'closed', statusText: '모집마감', deadline: null,
      thumbnailGradient: 'linear-gradient(135deg, #f093fb, #f5576c)',
    },
    {
      id: 4, name: '스토리텔링 마스터', summary: '이야기의 힘을 배우다',
      status: 'recruiting', statusText: '모집중', deadline: '01.15 모집 마감',
      thumbnailGradient: 'linear-gradient(135deg, #4facfe, #00f2fe)',
    },
    {
      id: 5, name: '배경 일러스트 3기', summary: '공간을 그리는 기술',
      status: 'recruiting', statusText: '모집중', deadline: '01.15 모집 마감',
      thumbnailGradient: 'linear-gradient(135deg, #43e97b, #38f9d7)',
    },
    {
      id: 6, name: '콘티 드로잉 7기', summary: '연출의 기본기',
      status: 'recruiting', statusText: '모집중', deadline: '01.15 모집 마감',
      thumbnailGradient: 'linear-gradient(135deg, #fa709a, #fee140)',
    },
    {
      id: 7, name: '디지털 채색 4기', summary: '색감으로 완성하기',
      status: 'closed', statusText: '모집마감', deadline: null,
      thumbnailGradient: 'linear-gradient(135deg, #a18cd1, #fbc2eb)',
    },
    {
      id: 8, name: '웹툰 기획 2기', summary: '플랫폼 데뷔 준비',
      status: 'recruiting', statusText: '모집중', deadline: '01.15 모집 마감',
      thumbnailGradient: 'linear-gradient(135deg, #ffecd2, #fcb69f)',
    },
    {
      id: 9, name: '케나즈 고급반 2기', summary: '프로 웹툰 작가 과정',
      status: 'recruiting', statusText: '모집중', deadline: '01.15 모집 마감',
      thumbnailGradient: 'linear-gradient(135deg, #a1c4fd, #c2e9fb)',
    },
    {
      id: 10, name: '연재 실전 1기', summary: '연재를 위한 모든 것',
      status: 'recruiting', statusText: '모집중', deadline: '01.15 모집 마감',
      thumbnailGradient: 'linear-gradient(135deg, #d4fc79, #96e6a1)',
    },
    {
      id: 11, name: '인체 드로잉 6기', summary: '해부학 기반 드로잉',
      status: 'closed', statusText: '모집마감', deadline: null,
      thumbnailGradient: 'linear-gradient(135deg, #84fab0, #8fd3f4)',
    },
    {
      id: 12, name: '포트폴리오 완성반', summary: '취업을 위한 포트폴리오',
      status: 'recruiting', statusText: '모집중', deadline: '01.15 모집 마감',
      thumbnailGradient: 'linear-gradient(135deg, #cfd9df, #e2ebf0)',
    },
  ];
}
