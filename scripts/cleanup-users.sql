-- ===== 유저 DB 정리 스크립트 =====
-- 보존: leesengun8823@naver.com, yelim@example.com

BEGIN;

-- 1. Follow
DELETE FROM "Follow" WHERE "followerId" IN (SELECT id FROM "User" WHERE email NOT IN ('leesengun8823@naver.com', 'yelim@example.com'))
   OR "followingId" IN (SELECT id FROM "User" WHERE email NOT IN ('leesengun8823@naver.com', 'yelim@example.com'));

-- 2. CommentLike
DELETE FROM "CommentLike" WHERE "userId" IN (SELECT id FROM "User" WHERE email NOT IN ('leesengun8823@naver.com', 'yelim@example.com'));
DELETE FROM "CommentLike" WHERE "commentId" IN (SELECT id FROM "Comment" WHERE "authorId" IN (SELECT id FROM "User" WHERE email NOT IN ('leesengun8823@naver.com', 'yelim@example.com')));
DELETE FROM "CommentLike" WHERE "commentId" IN (SELECT c.id FROM "Comment" c JOIN "Content" ct ON c."contentId" = ct.id WHERE ct."authorId" IN (SELECT id FROM "User" WHERE email NOT IN ('leesengun8823@naver.com', 'yelim@example.com')));

-- 3. Notification
DELETE FROM "Notification" WHERE "userId" IN (SELECT id FROM "User" WHERE email NOT IN ('leesengun8823@naver.com', 'yelim@example.com'))
   OR "actorId" IN (SELECT id FROM "User" WHERE email NOT IN ('leesengun8823@naver.com', 'yelim@example.com'));

-- 4. Report
DELETE FROM "Report" WHERE "reporterId" IN (SELECT id FROM "User" WHERE email NOT IN ('leesengun8823@naver.com', 'yelim@example.com'));

-- 5. Comment
DELETE FROM "Comment" WHERE "authorId" IN (SELECT id FROM "User" WHERE email NOT IN ('leesengun8823@naver.com', 'yelim@example.com'));
DELETE FROM "Comment" WHERE "contentId" IN (SELECT id FROM "Content" WHERE "authorId" IN (SELECT id FROM "User" WHERE email NOT IN ('leesengun8823@naver.com', 'yelim@example.com')));

-- 6. AlbumContent
DELETE FROM "AlbumContent" WHERE "albumId" IN (SELECT id FROM "Album" WHERE "ownerId" IN (SELECT id FROM "User" WHERE email NOT IN ('leesengun8823@naver.com', 'yelim@example.com')));
DELETE FROM "AlbumContent" WHERE "contentId" IN (SELECT id FROM "Content" WHERE "authorId" IN (SELECT id FROM "User" WHERE email NOT IN ('leesengun8823@naver.com', 'yelim@example.com')));

-- 7. Album
DELETE FROM "Album" WHERE "ownerId" IN (SELECT id FROM "User" WHERE email NOT IN ('leesengun8823@naver.com', 'yelim@example.com'));

-- 8. Content
DELETE FROM "Content" WHERE "authorId" IN (SELECT id FROM "User" WHERE email NOT IN ('leesengun8823@naver.com', 'yelim@example.com'));

-- 9. Faq
DELETE FROM "Faq" WHERE "authorId" IN (SELECT id FROM "User" WHERE email NOT IN ('leesengun8823@naver.com', 'yelim@example.com'));

-- 10. Notice
DELETE FROM "Notice" WHERE "authorId" IN (SELECT id FROM "User" WHERE email NOT IN ('leesengun8823@naver.com', 'yelim@example.com'));

-- 11. InquiryFile + Inquiry
DELETE FROM "InquiryFile" WHERE "inquiryId" IN (SELECT id FROM "Inquiry" WHERE "authorId" IN (SELECT id FROM "User" WHERE email NOT IN ('leesengun8823@naver.com', 'yelim@example.com')));
DELETE FROM "InquiryFile" WHERE "inquiryId" IN (SELECT id FROM "Inquiry" WHERE "repliedById" IN (SELECT id FROM "User" WHERE email NOT IN ('leesengun8823@naver.com', 'yelim@example.com')));
UPDATE "Inquiry" SET "repliedById" = NULL WHERE "repliedById" IN (SELECT id FROM "User" WHERE email NOT IN ('leesengun8823@naver.com', 'yelim@example.com'));
DELETE FROM "Inquiry" WHERE "authorId" IN (SELECT id FROM "User" WHERE email NOT IN ('leesengun8823@naver.com', 'yelim@example.com'));

-- 12. Applicant
DELETE FROM "Applicant" WHERE "userId" IN (SELECT id FROM "User" WHERE email NOT IN ('leesengun8823@naver.com', 'yelim@example.com'));

-- 13. BootcampInstructor
DELETE FROM "BootcampInstructor" WHERE "userId" IN (SELECT id FROM "User" WHERE email NOT IN ('leesengun8823@naver.com', 'yelim@example.com'));

-- 14. SubmissionComment + SubmissionFile + Submission
DELETE FROM "SubmissionComment" WHERE "authorId" IN (SELECT id FROM "User" WHERE email NOT IN ('leesengun8823@naver.com', 'yelim@example.com'));
DELETE FROM "SubmissionComment" WHERE "submissionId" IN (SELECT id FROM "Submission" WHERE "authorId" IN (SELECT id FROM "User" WHERE email NOT IN ('leesengun8823@naver.com', 'yelim@example.com')));
DELETE FROM "SubmissionFile" WHERE "submissionId" IN (SELECT id FROM "Submission" WHERE "authorId" IN (SELECT id FROM "User" WHERE email NOT IN ('leesengun8823@naver.com', 'yelim@example.com')));
DELETE FROM "Submission" WHERE "authorId" IN (SELECT id FROM "User" WHERE email NOT IN ('leesengun8823@naver.com', 'yelim@example.com'));

-- 15. UserSns
DELETE FROM "UserSns" WHERE "userId" IN (SELECT id FROM "User" WHERE email NOT IN ('leesengun8823@naver.com', 'yelim@example.com'));

-- 16. User 삭제
DELETE FROM "User" WHERE email NOT IN ('leesengun8823@naver.com', 'yelim@example.com');

COMMIT;

-- 결과 확인
SELECT id, email, nickname FROM "User" ORDER BY id;
