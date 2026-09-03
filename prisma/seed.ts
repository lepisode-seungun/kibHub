import 'dotenv/config';
import { PrismaClient } from './generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL || 'postgresql://kiphub:kiphub1234@localhost:5440/kiphub';
const adapter = new PrismaPg(connectionString);
const prisma = new PrismaClient({ adapter });

const SEED_USERS = [
  { email: 'test@kiphub.com', password: '1234', nickname: 'Newon', phone: '010-1234-5678', intro: '테스트 계정입니다.' },
];

async function main() {
  console.log('🌱 Seeding...');

  for (const u of SEED_USERS) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (existing) {
      console.log(`  ⏭ ${u.email} already exists, skipping.`);
      continue;
    }

    const hashedPassword = await bcrypt.hash(u.password, 10);
    await prisma.user.create({
      data: {
        email: u.email,
        password: hashedPassword,
        nickname: u.nickname,
        phone: u.phone,
        intro: u.intro,
      },
    });
    console.log(`  ✅ ${u.email} created.`);
  }

  console.log(`  ✅ Contents: 3 created`);

  // ===== Additional Contents =====
  await prisma.content.upsert({ where: { id: 4 }, update: {}, create: { type: 'PORTFOLIO', title: '판타지 웹툰 캐릭터 시트', body: '다양한 캐릭터 디자인 시트를 공유합니다.', viewCount: 0, authorId: user2.id, categoryId: cat1.id } });
  await prisma.content.upsert({ where: { id: 5 }, update: {}, create: { type: 'REVIEW', title: '2기 아카데미 수강 후기', body: '처음 웹툰을 접했지만 체계적인 커리큘럼 덕분에 완성할 수 있었습니다.', viewCount: 0, authorId: user1.id, categoryId: cat2.id } });
  await prisma.content.upsert({ where: { id: 6 }, update: {}, create: { type: 'PORTFOLIO', title: '도시 풍경 일러스트 시리즈', body: '서울의 다양한 풍경을 그려보았습니다.', viewCount: 0, authorId: user2.id, categoryId: cat3.id } });
  await prisma.content.upsert({ where: { id: 7 }, update: {}, create: { type: 'PORTFOLIO', title: '미니 웹툰 - 일상 에피소드', body: '짧은 일상 에피소드를 웹툰으로 그려봤습니다.', viewCount: 0, authorId: user1.id, categoryId: cat1.id } });

  console.log(`  ✅ Additional Contents: 4 created`);

  // ===== Comments =====
  await prisma.comment.upsert({
    where: { id: 1 },
    update: {},
    create: { body: '정말 멋진 포트폴리오네요!', contentId: content1.id, authorId: user2.id },
  });
  await prisma.comment.upsert({
    where: { id: 2 },
    update: {},
    create: { body: '저도 이 부트캠프 수강하고 싶어요.', contentId: content2.id, authorId: user1.id },
  });
  await prisma.comment.upsert({ where: { id: 3 }, update: {}, create: { body: '색감이 정말 예쁘네요. 어떤 툴을 사용하시나요?', contentId: content3.id, authorId: user2.id } });
  await prisma.comment.upsert({ where: { id: 4 }, update: {}, create: { body: '캐릭터 표정이 살아있어요! 대단합니다.', contentId: content1.id, authorId: instructor.id } });
  await prisma.comment.upsert({ where: { id: 5 }, update: {}, create: { body: '배경 묘사가 인상적이에요. 참고하겠습니다.', contentId: content3.id, authorId: user1.id } });

  console.log(`  ✅ Comments: 5 created`);

  // ===== Reports =====
  await prisma.report.upsert({
    where: { id: 1 },
    update: {},
    create: { type: 'CONTENT', targetId: content2.id, reason: '부적절한 내용', reporterId: user1.id },
  });
  await prisma.report.upsert({
    where: { id: 2 },
    update: {},
    create: { type: 'COMMENT', targetId: 1, reason: '스팸 댓글', reporterId: user2.id },
  });

  console.log(`  ✅ Reports: 2 created`);

  // ===== Portfolios =====
  await prisma.portfolio.upsert({
    where: { id: 1 },
    update: {},
    create: { userName: '고예림', bootcampName: '웹툰 아카데미 1기', workTitle: '마법사의 여행', authorName: '고예림', genre: '판타지', workIntro: '마법 세계를 배경으로 한 판타지 웹툰입니다.' },
  });
  await prisma.portfolio.upsert({
    where: { id: 2 },
    update: {},
    create: { userName: '박지민', bootcampName: '웹툰 아카데미 1기', workTitle: '도시의 밤', authorName: '박지민', genre: '드라마', workIntro: '도시를 배경으로 한 감성 드라마입니다.', isHallOfFame: true },
  });
  await prisma.portfolio.upsert({
    where: { id: 3 },
    update: {},
    create: { userName: '이수진', bootcampName: '글로벌 웹툰 마스터 1기', workTitle: '별의 노래', authorName: '이수진', genre: 'SF', workIntro: '우주를 배경으로 한 SF 웹툰입니다.', isHallOfFame: true },
  });
  await prisma.portfolio.upsert({ where: { id: 4 }, update: {}, create: { userName: '이강사', bootcampName: '웹툰 아카데미 2기', workTitle: '달빛 아래 소년', authorName: '이강사', genre: '로맨스', workIntro: '달빛 아래에서 시작되는 첫사랑 이야기.', isHallOfFame: true } });
  await prisma.portfolio.upsert({ where: { id: 5 }, update: {}, create: { userName: '고예림', bootcampName: '웹툰 아카데미 2기', workTitle: '코드와 칼', authorName: '고예림', genre: '액션', workIntro: '프로그래머가 이세계에서 검사로 전생하는 이야기.' } });

  console.log(`  ✅ Portfolios: 5 created`);

  // ===== Notices =====
  await prisma.notice.upsert({
    where: { id: 1 },
    update: {},
    create: { type: 'SUPPORT', title: '서비스 이용약관 변경 안내', body: '2025년 3월 1일부터 이용약관이 변경됩니다.', pinned: true, authorId: admin1.id },
  });
  await prisma.notice.upsert({
    where: { id: 2 },
    update: {},
    create: { type: 'SUPPORT', title: '시스템 점검 안내', body: '2025년 3월 15일 새벽 2시~4시 시스템 점검이 예정되어 있습니다.', authorId: admin1.id },
  });
  await prisma.notice.upsert({
    where: { id: 3 },
    update: {},
    create: { type: 'BOOTCAMP', title: '1기 OT 일정 안내', body: '웹툰 아카데미 1기 OT는 3월 1일입니다.', bootcampId: bootcamp1.id, authorId: admin1.id },
  });
  await prisma.notice.upsert({ where: { id: 4 }, update: {}, create: { type: 'SUPPORT', title: '개인정보처리방침 개정 안내', body: '2025년 4월 1일부로 개인정보처리방침이 개정됩니다.', pinned: true, authorId: admin2.id } });
  await prisma.notice.upsert({ where: { id: 5 }, update: {}, create: { type: 'BOOTCAMP', title: '2기 모집 안내', body: '웹툰 아카데미 2기 모집이 시작되었습니다.', bootcampId: bootcamp2.id, authorId: admin1.id } });

  console.log(`  ✅ Notices: 5 created`);

  // ===== FAQs =====
  await prisma.faq.upsert({
    where: { id: 1 },
    update: {},
    create: { question: '부트캠프 수강료는 어떻게 되나요?', answer: 'K-Digital Training 과정으로 국비 지원을 받아 무료로 수강 가능합니다.', authorId: admin1.id },
  });
  await prisma.faq.upsert({
    where: { id: 2 },
    update: {},
    create: { question: '수료 기준이 어떻게 되나요?', answer: '출석률 80% 이상, 과제 제출률 70% 이상일 경우 수료 가능합니다.', authorId: admin1.id },
  });
  await prisma.faq.upsert({
    where: { id: 3 },
    update: {},
    create: { question: '포트폴리오 제출은 어떻게 하나요?', answer: '마이페이지 > 포트폴리오 메뉴에서 작품을 업로드할 수 있습니다.', authorId: admin1.id },
  });
  await prisma.faq.upsert({ where: { id: 4 }, update: {}, create: { question: '수업 방식은 어떻게 진행되나요?', answer: '온라인 실시간 강의와 오프라인 워크숍이 병행됩니다.', authorId: admin1.id } });
  await prisma.faq.upsert({ where: { id: 5 }, update: {}, create: { question: '수업 녹화본을 다시 볼 수 있나요?', answer: '네, 모든 수업은 녹화되어 수강생 전용 페이지에서 다시보기 가능합니다.', authorId: admin1.id } });
  await prisma.faq.upsert({ where: { id: 6 }, update: {}, create: { question: '명예의 전당에 올라가려면?', answer: '최종 포트폴리오 심사에서 우수 작품으로 선정되면 등록됩니다.', authorId: admin1.id } });

  console.log(`  ✅ FAQs: 6 created`);

  // ===== Inquiries =====
  await prisma.inquiry.upsert({
    where: { id: 1 },
    update: {},
    create: { title: '수강 신청 관련 문의', body: '수강 신청 방법을 알고 싶습니다.', authorId: user1.id, status: 'COMPLETED', reply: '홈페이지에서 직접 신청하실 수 있습니다.', repliedById: admin1.id, repliedAt: new Date() },
  });
  await prisma.inquiry.upsert({
    where: { id: 2 },
    update: {},
    create: { title: '비밀번호 변경 문의', body: '비밀번호를 변경하고 싶습니다.', authorId: user2.id },
  });
  await prisma.inquiry.upsert({ where: { id: 3 }, update: {}, create: { title: '포트폴리오 업로드 오류', body: '파일 용량 제한 오류가 발생합니다.', authorId: user1.id, status: 'ANSWERED', reply: '파일 용량 제한을 50MB로 상향 조정하였습니다.', repliedById: admin2.id, repliedAt: new Date() } });

  console.log(`  ✅ Inquiries: 3 created`);

  console.log('\n🎉 Seeding complete!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
