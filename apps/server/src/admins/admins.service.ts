import { Inject, Injectable, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AdminsService {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.admin.findMany({ orderBy: { id: 'desc' } });
  }

  async findOne(id: number) {
    const admin = await this.prisma.admin.findUnique({ where: { id } });
    if (!admin) throw new NotFoundException('관리자를 찾을 수 없습니다.');
    return admin;
  }

  async create(data: { loginId: string; password: string; name: string; role?: string }) {
    if (!data.loginId || !data.password || !data.name) {
      throw new BadRequestException('아이디, 비밀번호, 이름은 필수입니다.');
    }

    const existing = await this.prisma.admin.findUnique({ where: { loginId: data.loginId } });
    if (existing) throw new ConflictException('이미 사용 중인 아이디입니다.');

    const hashedPassword = await bcrypt.hash(data.password, 10);
    return this.prisma.admin.create({
      data: {
        loginId: data.loginId,
        password: hashedPassword,
        name: data.name,
        role: data.role === 'SUPER' ? 'SUPER' : 'NORMAL',
      },
    });
  }

  async update(id: number, data: { name?: string; role?: string; password?: string; currentPassword?: string }) {
    const updateData: Record<string, string> = {
      ...(data.name && { name: data.name }),
      ...(data.role && { role: data.role === 'SUPER' ? 'SUPER' : 'NORMAL' }),
    };
    if (data.password) {
      if (!data.currentPassword) {
        throw new BadRequestException('기존 비밀번호를 입력해주세요.');
      }
      const admin = await this.prisma.admin.findUnique({ where: { id } });
      if (!admin) throw new NotFoundException('관리자를 찾을 수 없습니다.');
      const isValid = await bcrypt.compare(data.currentPassword, admin.password);
      if (!isValid) {
        throw new BadRequestException('기존 비밀번호가 일치하지 않습니다.');
      }
      updateData.password = await bcrypt.hash(data.password, 10);
    }
    return this.prisma.admin.update({ where: { id }, data: updateData });
  }

  async updateStatus(id: number, status: 'ACTIVE' | 'BLOCKED') {
    return this.prisma.admin.update({ where: { id }, data: { status } });
  }

  async delete(id: number) {
    return this.prisma.admin.delete({ where: { id } });
  }

  async checkLoginId(loginId: string): Promise<boolean> {
    if (!loginId) return false;
    const existing = await this.prisma.admin.findUnique({ where: { loginId } });
    return !existing;
  }

  async login(loginId: string, password: string) {
    const admin = await this.prisma.admin.findUnique({ where: { loginId } });
    if (!admin) throw new Error('아이디 또는 비밀번호가 올바르지 않습니다.');
    if (admin.status === 'BLOCKED') throw new Error('차단된 계정입니다.');

    const isValid = await bcrypt.compare(password, admin.password);
    if (!isValid) throw new Error('아이디 또는 비밀번호가 올바르지 않습니다.');

    return admin;
  }
}
