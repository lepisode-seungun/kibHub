const { PrismaClient } = require('./node_modules/@prisma/generated');
const p = new PrismaClient();

(async () => {
  const u29 = await p.user.findUnique({ where: { id: 29 }, select: { nickname: true } });
  console.log('User 29 nickname:', u29.nickname);

  const all = await p.user.findMany({
    where: { nickname: u29.nickname },
    select: { id: true, email: true, nickname: true, status: true },
  });
  console.log('Same nickname users:', JSON.stringify(all, null, 2));

  const contents = await p.content.findMany({
    where: { author: { nickname: u29.nickname } },
    select: { id: true, authorId: true, title: true },
    take: 5,
  });
  console.log('Contents:', JSON.stringify(contents, null, 2));

  await p.$disconnect();
})();
