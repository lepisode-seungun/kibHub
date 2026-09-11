import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';

const JWT_SECRET = process.env['JWT_SECRET'] || 'kiphub-jwt-secret-key-2026';

// 인증번호 저장 (메모리 기반)
const verificationCodes = new Map<string, { code: string; expiresAt: number }>();
// 비밀번호 재설정 토큰 저장 (메모리 기반)
const resetTokens = new Map<string, { userId: number; expiresAt: number }>();

@Injectable()
export class AuthService {
  constructor(
    @Inject(PrismaService) private prisma: PrismaService,
    @Inject(MailService) private mailService: MailService,
  ) {}

  generateToken(userId: number): string {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
  }

  verifyToken(token: string): { userId: number } | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as Record<string, number>;
      return { userId: decoded.userId || decoded.adminId };
    } catch {
      return null;
    }
  }

  async register(data: { email: string; password: string; name?: string; nickname: string; phone?: string; birthday?: string; intro?: string }) {
    const existing = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      if (existing.status === 'WITHDRAWN') {
        // 탈퇴 계정 재가입: 기존 WITHDRAWN 유저를 업데이트하여 재활성화
        const hashedPassword = await bcrypt.hash(data.password, 10);
        const user = await this.prisma.user.update({
          where: { id: existing.id },
          data: {
            password: hashedPassword,
            name: data.name || '',
            nickname: data.nickname,
            phone: data.phone || '',
            birthday: data.birthday || null,
            intro: data.intro || '',
            profileImage: null,
            coverImage: null,
            status: 'ACTIVE',
          },
        });
        return user;
      } else {
        throw new Error('이미 존재하는 이메일입니다.');
      }
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name || '',
        nickname: data.nickname,
        phone: data.phone || '',
        birthday: data.birthday || null,
        intro: data.intro || '',
      },
    });
    return user;
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.');
    if (user.status === 'BLOCKED') throw new Error('차단된 계정입니다. 관리자에게 문의하세요.');
    if (user.status === 'WITHDRAWN') throw new Error('탈퇴한 계정입니다.');

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.');

    return user;
  }

  async checkEmail(email: string): Promise<boolean> {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (!existing) return true;
    return existing.status === 'WITHDRAWN';
  }

  async findById(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true, email: true, nickname: true, name: true, phone: true,
        countryCode: true, birthday: true, intro: true, profileImage: true, coverImage: true,
        role: true, status: true, adminRole: true,
        sns: true,
      },
    });
  }

  // ===== 이메일 찾기 =====
  async findEmail(phone: string, birthday?: string) {
    const where: Record<string, string> = { phone };
    if (birthday) where.birthday = birthday;
    const users = await this.prisma.user.findMany({ where, select: { email: true } });
    if (users.length === 0) throw new Error('일치하는 회원 정보가 없습니다.');
    return users.map(u => u.email);
  }

  // ===== 인증번호 발송 =====
  async sendVerificationCode(email: string): Promise<void> {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    verificationCodes.set(email, {
      code,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5분
    });
    await this.mailService.sendVerificationCode(email, code);
  }

  // ===== 인증번호 검증 =====
  verifyCode(email: string, code: string): boolean {
    const stored = verificationCodes.get(email);
    if (!stored) return false;
    if (Date.now() > stored.expiresAt) {
      verificationCodes.delete(email);
      return false;
    }
    if (stored.code !== code) return false;
    verificationCodes.delete(email);
    return true;
  }

  // ===== 이메일 변경 =====
  async changeEmail(userId: number, newEmail: string) {
    const existing = await this.prisma.user.findUnique({ where: { email: newEmail } });
    if (existing) throw new Error('이미 사용 중인 이메일입니다.');
    await this.prisma.user.update({ where: { id: userId }, data: { email: newEmail } });
  }

  // ===== 비밀번호 변경 =====
  async changePassword(userId: number, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('사용자를 찾을 수 없습니다.');
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) throw new Error('현재 비밀번호가 올바르지 않습니다.');
    const hashed = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({ where: { id: userId }, data: { password: hashed } });
  }

  // ===== 비밀번호 재설정 (링크 발송) =====
  async resetPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('등록되지 않은 이메일입니다.');
    // 재설정 토큰 생성 (10분 유효)
    const token = crypto.randomBytes(32).toString('hex');
    resetTokens.set(token, {
      userId: user.id,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });
    const baseUrl = process.env['CLIENT_URL'] || 'http://localhost:4200';
    const resetLink = `${baseUrl}/reset-password?token=${token}`;
    await this.mailService.sendPasswordResetLink(email, resetLink);
  }

  // ===== 비밀번호 재설정 확인 (토큰 방식) =====
  async confirmResetPassword(token: string, newPassword: string) {
    const stored = resetTokens.get(token);
    if (!stored || Date.now() > stored.expiresAt) {
      resetTokens.delete(token);
      throw new Error('유효하지 않거나 만료된 토큰입니다.');
    }
    const hashed = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({ where: { id: stored.userId }, data: { password: hashed } });
    resetTokens.delete(token);
  }

  // ===== 회원 탈퇴 =====
  async withdraw(userId: number, password: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('사용자를 찾을 수 없습니다.');
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) throw new Error('비밀번호가 올바르지 않습니다.');
    await this.cleanupUserData(userId);
  }

  // ===== 유저 탈퇴 처리 (약관 준수) =====
  //
  // [즉시 삭제] 콘텐츠, 해당 콘텐츠의 모든 댓글, 앨범, 책갈피, 팔로우, 알림
  // [유지] 타 유저 콘텐츠 댓글, 1:1 문의, 부트캠프 과제/댓글
  // [소프트 삭제] User → status: WITHDRAWN + 개인정보 초기화
  //
  private async cleanupUserData(userId: number) {
    await this.prisma.$transaction(async (tx) => {
      // ── 1. 즉시 삭제 대상 ──

      // 팔로우 관계
      await tx.follow.deleteMany({ where: { OR: [{ followerId: userId }, { followingId: userId }] } });

      // 내가 누른 댓글 좋아요
      await tx.commentLike.deleteMany({ where: { userId } });

      // 내가 한 신고
      await tx.report.deleteMany({ where: { reporterId: userId } });

      // 알림
      await tx.notification.deleteMany({ where: { userId } });

      // SNS 연동 정보
      await tx.userSns.deleteMany({ where: { userId } });

      // 앨범 + 책갈피 (앨범 내 콘텐츠 연결도 삭제)
      const albums = await tx.album.findMany({ where: { ownerId: userId }, select: { id: true } });
      if (albums.length > 0) {
        await tx.albumContent.deleteMany({ where: { albumId: { in: albums.map(a => a.id) } } });
        await tx.album.deleteMany({ where: { ownerId: userId } });
      }

      // 내 콘텐츠 + 해당 콘텐츠의 모든 댓글/좋아요
      const contents = await tx.content.findMany({ where: { authorId: userId }, select: { id: true } });
      if (contents.length > 0) {
        const contentIds = contents.map(c => c.id);
        const commentsOnMyContent = await tx.comment.findMany({ where: { contentId: { in: contentIds } }, select: { id: true } });
        if (commentsOnMyContent.length > 0) {
          await tx.commentLike.deleteMany({ where: { commentId: { in: commentsOnMyContent.map(c => c.id) } } });
        }
        await tx.comment.deleteMany({ where: { contentId: { in: contentIds } } });
        await tx.albumContent.deleteMany({ where: { contentId: { in: contentIds } } });
        await tx.content.deleteMany({ where: { authorId: userId } });
      }

      // 지원서
      await tx.applicant.deleteMany({ where: { userId } });

      // 부트캠프 강사 관계
      await tx.bootcampInstructor.deleteMany({ where: { userId } });

      // ── 2. 유지 대상 (삭제하지 않음) ──
      // - 타 유저 콘텐츠에 남긴 댓글 (Comment) → User WITHDRAWN 상태로 "탈퇴한 사용자" 표시
      // - 1:1 문의 (Inquiry + InquiryFile) → 유지
      // - 부트캠프 과제 제출 (Submission + SubmissionFile) → 유지
      // - 부트캠프 과제 댓글 (SubmissionComment) → 유지

      // ── 3. User 소프트 삭제 (개인정보 초기화) ──
      await tx.user.update({
        where: { id: userId },
        data: {
          status: 'WITHDRAWN',
          nickname: '탈퇴한 사용자',
          name: '',
          phone: '',
          birthday: null,
          intro: '',
          profileImage: null,
          coverImage: null,
          password: '', // 빈 문자열 → 로그인 불가
        },
      });
    });
  }
}
