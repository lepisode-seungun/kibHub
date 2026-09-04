import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env['JWT_SECRET'] || 'kiphub-jwt-secret-key-2026';

@Injectable()
export class AuthService {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  generateToken(userId: number): string {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
  }

  verifyToken(token: string): { userId: number } | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      return { userId: decoded.userId || decoded.adminId };
    } catch {
      return null;
    }
  }

  async register(data: { email: string; password: string; nickname: string; phone?: string; intro?: string }) {
    const existing = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new Error('이미 존재하는 이메일입니다.');

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        nickname: data.nickname,
        phone: data.phone || '',
        intro: data.intro || '',
      },
    });
    return user;
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.');
    if (user.status === 'BLOCKED') throw new Error('차단된 계정입니다. 관리자에게 문의하세요.');

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.');

    return user;
  }

  async checkEmail(email: string): Promise<boolean> {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    return !existing;
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
}
