import { PrismaClient } from './generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const connectionString = process.env['DATABASE_URL'] || 'postgresql://kiphub:kiphub1234@localhost:5440/kiphub';
const adapter = new PrismaPg(connectionString);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 관리자 시드 데이터 생성 시작...\n');

  const adminAccounts = [
    {
      email: 'admin@kiphub.com',
      password: 'admin1234!',
      nickname: '최고관리자',
      role: 'ADMIN',
      phone: '',
      intro: '시스템 최고관리자',
    },
    {
      email: 'manager@kiphub.com',
      password: 'manager1234!',
      nickname: '운영관리자',
      role: 'ADMIN',
      phone: '',
      intro: '운영 관리자',
    },
    {
      email: 'agency@kiphub.com',
      password: 'agency1234!',
      nickname: '채용대행사',
      role: 'AGENCY',
      phone: '',
      intro: '채용대행사 계정',
    },
  ];

  for (const account of adminAccounts) {
    const existing = await prisma.user.findUnique({
      where: { email: account.email },
    });

    if (existing) {
      console.log(`  ⏭️  이미 존재: ${account.email} (${account.nickname})`);
      continue;
    }

    const hashedPassword = await bcrypt.hash(account.password, 10);

    const user = await prisma.user.create({
      data: {
        email: account.email,
        password: hashedPassword,
        nickname: account.nickname,
        role: account.role,
        phone: account.phone,
        intro: account.intro,
      },
    });

    console.log(`  ✅ 생성 완료: ${user.email} (${account.nickname}) [${account.role}]`);
  }

  console.log('\n🎉 관리자 시드 완료!\n');
  console.log('  📋 로그인 정보:');
  console.log('  ─────────────────────────────────────');
  for (const account of adminAccounts) {
    console.log(`  이메일: ${account.email}`);
    console.log(`  비밀번호: ${account.password}`);
    console.log(`  권한: ${account.role} (${account.nickname})`);
    console.log('  ─────────────────────────────────────');
  }
}

main()
  .catch((e) => {
    console.error('❌ 시드 에러:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
