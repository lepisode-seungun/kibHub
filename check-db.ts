import { PrismaClient } from './prisma/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env['DATABASE_URL'] || 'postgresql://kiphub:kiphub1234@localhost:5440/kiphub';
const adapter = new PrismaPg(connectionString);
const prisma = new PrismaClient({ adapter });

async function main() {
  const portfolios = await prisma.portfolio.findMany();
  console.log('TOTAL PORTFOLIOS IN DB:', portfolios.length);
  console.log(JSON.stringify(portfolios, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
