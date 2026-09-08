/**
 * 지정된 이메일을 제외한 모든 유저와 관련 데이터를 삭제하는 스크립트
 * 실행: npx ts-node scripts/cleanup-users.ts
 */
import { PrismaClient } from '../prisma/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env['DATABASE_URL'] || 'postgresql://kiphub:kiphub1234@localhost:5440/kiphub';
const adapter = new PrismaPg(connectionString);
const prisma = new PrismaClient({ adapter });

const KEEP_EMAILS = [
  'leesengun8823@naver.com',
  'yelim@example.com',
];

async function main(): Promise<void> {
  // 삭제 대상 유저 조회
  const usersToDelete = await prisma.user.findMany({
    where: {
      email: { notIn: KEEP_EMAILS },
    },
    select: { id: true, email: true, nickname: true },
  });

  console.log(`\n=== 유저 DB 정리 ===`);
  console.log(`보존 계정: ${KEEP_EMAILS.join(', ')}`);
  console.log(`삭제 대상: ${usersToDelete.length}명`);
  usersToDelete.forEach((u: any) => console.log(`  - [${u.id}] ${u.email} (${u.nickname})`));

  if (usersToDelete.length === 0) {
    console.log('\n삭제할 유저가 없습니다.');
    return;
  }

  const userIds = usersToDelete.map((u: any) => u.id);

  await prisma.$transaction(async (tx: any) => {
    // 1. Follow
    const followDel = await tx.follow.deleteMany({
      where: { OR: [{ followerId: { in: userIds } }, { followingId: { in: userIds } }] },
    });
    console.log(`Follow 삭제: ${followDel.count}`);

    // 2. CommentLike (유저가 누른 좋아요)
    const likeDel = await tx.commentLike.deleteMany({ where: { userId: { in: userIds } } });
    console.log(`CommentLike(유저) 삭제: ${likeDel.count}`);

    // 3. Report
    const reportDel = await tx.report.deleteMany({ where: { reporterId: { in: userIds } } });
    console.log(`Report 삭제: ${reportDel.count}`);

    // 4. Notification (유저의 알림)
    const notiDel = await tx.notification.deleteMany({
      where: { OR: [{ userId: { in: userIds } }, { actorId: { in: userIds } }] },
    });
    console.log(`Notification 삭제: ${notiDel.count}`);

    // 5. 유저가 작성한 댓글 삭제 (먼저 댓글의 좋아요 삭제)
    const userComments = await tx.comment.findMany({
      where: { authorId: { in: userIds } },
      select: { id: true },
    });
    if (userComments.length > 0) {
      const commentIds = userComments.map((c: any) => c.id);
      await tx.commentLike.deleteMany({ where: { commentId: { in: commentIds } } });
    }
    const commentDel = await tx.comment.deleteMany({ where: { authorId: { in: userIds } } });
    console.log(`Comment(작성) 삭제: ${commentDel.count}`);

    // 6. Album + AlbumContent
    const albums = await tx.album.findMany({ where: { ownerId: { in: userIds } }, select: { id: true } });
    if (albums.length > 0) {
      const albumIds = albums.map((a: any) => a.id);
      const acDel = await tx.albumContent.deleteMany({ where: { albumId: { in: albumIds } } });
      console.log(`AlbumContent 삭제: ${acDel.count}`);
      const albumDel = await tx.album.deleteMany({ where: { ownerId: { in: userIds } } });
      console.log(`Album 삭제: ${albumDel.count}`);
    }

    // 7. Content (유저의 콘텐츠 + 해당 콘텐츠의 댓글/좋아요/앨범콘텐츠)
    const contents = await tx.content.findMany({ where: { authorId: { in: userIds } }, select: { id: true } });
    if (contents.length > 0) {
      const contentIds = contents.map((c: any) => c.id);
      // 콘텐츠에 달린 댓글의 좋아요
      const cComments = await tx.comment.findMany({ where: { contentId: { in: contentIds } }, select: { id: true } });
      if (cComments.length > 0) {
        await tx.commentLike.deleteMany({ where: { commentId: { in: cComments.map((c: any) => c.id) } } });
      }
      await tx.comment.deleteMany({ where: { contentId: { in: contentIds } } });
      await tx.albumContent.deleteMany({ where: { contentId: { in: contentIds } } });
      const contentDel = await tx.content.deleteMany({ where: { authorId: { in: userIds } } });
      console.log(`Content 삭제: ${contentDel.count}`);
    }

    // 8. Inquiry + InquiryFile
    const inquiries = await tx.inquiry.findMany({ where: { authorId: { in: userIds } }, select: { id: true } });
    if (inquiries.length > 0) {
      await tx.inquiryFile.deleteMany({ where: { inquiryId: { in: inquiries.map((i: any) => i.id) } } });
      const inqDel = await tx.inquiry.deleteMany({ where: { authorId: { in: userIds } } });
      console.log(`Inquiry 삭제: ${inqDel.count}`);
    }

    // 9. Applicant
    const appDel = await tx.applicant.deleteMany({ where: { userId: { in: userIds } } });
    console.log(`Applicant 삭제: ${appDel.count}`);

    // 10. BootcampInstructor
    const instrDel = await tx.bootcampInstructor.deleteMany({ where: { userId: { in: userIds } } });
    console.log(`BootcampInstructor 삭제: ${instrDel.count}`);

    // 11. Submission + SubmissionFile + SubmissionComment
    await tx.submissionComment.deleteMany({ where: { authorId: { in: userIds } } });
    const submissions = await tx.submission.findMany({ where: { authorId: { in: userIds } }, select: { id: true } });
    if (submissions.length > 0) {
      const subIds = submissions.map((s: any) => s.id);
      await tx.submissionFile.deleteMany({ where: { submissionId: { in: subIds } } });
      await tx.submissionComment.deleteMany({ where: { submissionId: { in: subIds } } });
      const subDel = await tx.submission.deleteMany({ where: { authorId: { in: userIds } } });
      console.log(`Submission 삭제: ${subDel.count}`);
    }

    // 12. SNS
    const snsDel = await tx.sns.deleteMany({ where: { userId: { in: userIds } } });
    console.log(`SNS 삭제: ${snsDel.count}`);

    // 13. 최종: User 삭제
    const userDel = await tx.user.deleteMany({ where: { id: { in: userIds } } });
    console.log(`\n✅ User 삭제 완료: ${userDel.count}명`);
  }, { timeout: 60000 });

  // 결과 확인
  const remaining = await prisma.user.findMany({ select: { id: true, email: true, nickname: true } });
  console.log(`\n=== 남은 계정 ===`);
  remaining.forEach((u: any) => console.log(`  - [${u.id}] ${u.email} (${u.nickname})`));
}

main()
  .catch((e: any) => { console.error('❌ 에러:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
