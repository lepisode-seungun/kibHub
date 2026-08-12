import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface BannerSlide {
  title: string;
  subtitle: string;
}

@Component({
  selector: 'app-home-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home-banner.component.html',
  styleUrl: './home-banner.component.css',
})
export class HomeBannerComponent {
  slides: BannerSlide[] = [
    {
      title: '크리에이터 강의, 네트워킹\n크리에이터 성장에 필요한 모든걸',
      subtitle:
        '지금 회원가입시 45% 할인 + 한정판 굿즈 증정! 지금 회원가입시 45% 할인 + 한정판 굿즈 증정!',
    },
    {
      title: '실무 중심 부트캠프\n현업 개발자와 함께 성장하세요',
      subtitle:
        '프론트엔드, 백엔드, AI 등 다양한 트랙에서 실력을 키워보세요.',
    },
    {
      title: '포트폴리오부터 취업까지\n한 곳에서 모두 해결',
      subtitle:
        '수료생 취업률 95% 이상! 실전 프로젝트와 멘토링을 경험하세요.',
    },
    {
      title: '당신의 커리어를 위한\n최고의 부트캠프를 찾아보세요',
      subtitle:
        '국내 유명 부트캠프 비교부터 수강 후기까지 모두 확인할 수 있습니다.',
    },
    {
      title: '함께 배우고, 함께 성장하는\n개발자 커뮤니티',
      subtitle:
        '동료 수강생들과 네트워킹하며 함께 도전하세요.',
    },
    {
      title: '무료 체험으로 시작하고\n나에게 맞는 과정을 선택하세요',
      subtitle:
        '다양한 무료 체험 코스와 프리코스를 미리 경험해보세요.',
    },
    {
      title: 'AI 시대, 새로운 기술을\n가장 빠르게 배우는 방법',
      subtitle:
        'ChatGPT, Copilot 활용법부터 AI 엔지니어링까지.',
    },
    {
      title: '현직 시니어 개발자에게\n직접 코드 리뷰를 받아보세요',
      subtitle:
        '1:1 멘토링과 코드 리뷰로 빠르게 실력을 키우세요.',
    },
    {
      title: '글로벌 기업이 원하는\n개발자로 성장하세요',
      subtitle:
        '해외 취업 지원 프로그램과 영어 면접 준비까지.',
    },
    {
      title: '데이터 사이언스부터\n풀스택 개발까지',
      subtitle:
        '트렌디한 기술 스택을 한 곳에서 배워보세요.',
    },
  ];

  currentSlide = signal(0);

  get totalSlides(): number {
    return this.slides.length;
  }

  get activeSlide(): BannerSlide {
    return this.slides[this.currentSlide()];
  }

  get progressPercent(): number {
    return ((this.currentSlide() + 1) / this.totalSlides) * 100;
  }

  prevSlide(): void {
    this.currentSlide.update((i) =>
      i === 0 ? this.totalSlides - 1 : i - 1
    );
  }

  nextSlide(): void {
    this.currentSlide.update((i) =>
      i === this.totalSlides - 1 ? 0 : i + 1
    );
  }
}
