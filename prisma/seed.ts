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

  console.log('🌱 Seed complete!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
