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
        // 탈퇴 계정 잔여 데이터 전체 정리
        await this.cleanupUserData(existing.id);
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
    const user = await this.prisma.user.findFirst({ where, select: { email: true } });
    if (!user) throw new Error('일치하는 회원 정보가 없습니다.');
    // 이메일 마스킹
    const [local, domain] = user.email.split('@');
    const masked = local.slice(0, 3) + '***@' + domain;
    return masked;
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

  // ===== 유저 관련 데이터 전체 삭제 =====
  private async cleanupUserData(userId: number) {
    await this.prisma.$transaction(async (tx) => {
      await tx.follow.deleteMany({ where: { OR: [{ followerId: userId }, { followingId: userId }] } });
      await tx.commentLike.deleteMany({ where: { userId } });
      await tx.report.deleteMany({ where: { reporterId: userId } });
      await tx.comment.deleteMany({ where: { authorId: userId } });

      const albums = await tx.album.findMany({ where: { ownerId: userId }, select: { id: true } });
      if (albums.length > 0) {
        await tx.albumContent.deleteMany({ where: { albumId: { in: albums.map(a => a.id) } } });
        await tx.album.deleteMany({ where: { ownerId: userId } });
      }

      const contents = await tx.content.findMany({ where: { authorId: userId }, select: { id: true } });
      if (contents.length > 0) {
        const contentIds = contents.map(c => c.id);
        const comments = await tx.comment.findMany({ where: { contentId: { in: contentIds } }, select: { id: true } });
        if (comments.length > 0) {
          await tx.commentLike.deleteMany({ where: { commentId: { in: comments.map(c => c.id) } } });
        }
        await tx.comment.deleteMany({ where: { contentId: { in: contentIds } } });
        await tx.albumContent.deleteMany({ where: { contentId: { in: contentIds } } });
        await tx.content.deleteMany({ where: { authorId: userId } });
      }

      const inquiries = await tx.inquiry.findMany({ where: { authorId: userId }, select: { id: true } });
      if (inquiries.length > 0) {
        await tx.inquiryFile.deleteMany({ where: { inquiryId: { in: inquiries.map(i => i.id) } } });
        await tx.inquiry.deleteMany({ where: { authorId: userId } });
      }

      await tx.applicant.deleteMany({ where: { userId } });
      await tx.bootcampInstructor.deleteMany({ where: { userId } });
      await tx.submissionComment.deleteMany({ where: { authorId: userId } });
      const submissions = await tx.submission.findMany({ where: { authorId: userId }, select: { id: true } });
      if (submissions.length > 0) {
        const subIds = submissions.map(s => s.id);
        await tx.submissionFile.deleteMany({ where: { submissionId: { in: subIds } } });
        await tx.submissionComment.deleteMany({ where: { submissionId: { in: subIds } } });
        await tx.submission.deleteMany({ where: { authorId: userId } });
      }

      await tx.user.delete({ where: { id: userId } });
    });
  }
}
