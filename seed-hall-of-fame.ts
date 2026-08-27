import { PrismaClient } from './prisma/generated/prisma/client';

const prisma = new PrismaClient();

async function main() {
  const portfolios = [
    {
      userName: '고예림',
      bootcampName: '케나즈 아카데미 초급반 13기',
      workTitle: '식혜의 모험',
      authorName: '고예림',
      genre: '웹툰',
      workIntro: '케나즈 아카데미 초급반 13기를 통해 제작한 식혜의 모험 웹툰입니다. 기획부터 원고까지 전 과정을 직접 진행하였습니다.',
      launchPlatform: '네이버 웹툰',
      launchUrl: 'https://comic.naver.com',
      isHallOfFame: true,
    },
    {
      userName: '김지훈',
      bootcampName: '케나즈 아카데미 중급반 5기',
      workTitle: '도시의 밤',
      authorName: '김지훈',
      genre: '드라마',
      workIntro: '현대 도시를 배경으로 한 청춘 드라마 웹툰입니다. 20대의 고민과 성장을 담았습니다.',
      launchPlatform: '카카오 웹툰',
      launchUrl: 'https://webtoon.kakao.com',
      isHallOfFame: true,
    },
    {
      userName: '박서연',
      bootcampName: '케나즈 아카데미 초급반 12기',
      workTitle: '별빛 아래에서',
      authorName: '박서연',
      genre: '판타지',
      workIntro: '마법 학교를 배경으로 한 판타지 웹툰입니다. 독특한 세계관과 캐릭터 디자인이 호평을 받았습니다.',
      launchPlatform: '레진코믹스',
      launchUrl: 'https://www.lezhin.com',
      isHallOfFame: true,
    },
    {
      userName: '이수민',
      bootcampName: '앙굴렘 아카데미 1기',
      workTitle: '파리의 고양이',
      authorName: '이수민',
      genre: '일상/에세이',
      workIntro: '프랑스 유학 중 만난 길고양이와의 일상을 그린 에세이 만화입니다. 따뜻한 그림체가 특징입니다.',
      launchPlatform: '네이버 웹툰',
      launchUrl: 'https://comic.naver.com',
      isHallOfFame: true,
    },
    {
      userName: '정우진',
      bootcampName: '케나즈 아카데미 중급반 4기',
      workTitle: '런어웨이',
      authorName: '정우진',
      genre: '액션',
      workIntro: '도시를 무대로 펼쳐지는 액션 웹툰입니다. 역동적인 연출과 치밀한 스토리가 강점입니다.',
      launchPlatform: '카카오페이지',
      launchUrl: 'https://page.kakao.com',
      isHallOfFame: true,
    },
    {
      userName: '최하은',
      bootcampName: '앙굴렘 아카데미 2기',
      workTitle: '꿈의 정원',
      authorName: '최하은',
      genre: '힐링',
      workIntro: '작은 마을의 정원을 가꾸는 소녀의 이야기입니다. 수채화풍의 아름다운 컬러가 돋보입니다.',
      launchPlatform: '봄툰',
      launchUrl: 'https://www.bomtoon.com',
      isHallOfFame: true,
    },
  ];

  for (const p of portfolios) {
    const created = await prisma.portfolio.create({ data: p });
    console.log(`✅ 생성: [${created.id}] ${created.workTitle} - ${created.userName}`);
  }

  const count = await prisma.portfolio.count({ where: { isHallOfFame: true } });
  console.log(`\n총 명예전당 포트폴리오: ${count}개`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
