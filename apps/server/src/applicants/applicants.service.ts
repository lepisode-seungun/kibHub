import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ApplicantsService {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  findByBootcamp(bootcampId: number) {
    return this.prisma.applicant.findMany({
      where: { bootcampId },
      include: { user: { select: { id: true, name: true, email: true, phone: true, status: true } } },
      orderBy: { appliedAt: 'desc' },
    });
  }

  findByUser(userId: number) {
    return this.prisma.applicant.findMany({
      where: { userId },
      include: { bootcamp: { select: { id: true, name: true, status: true, startDate: true, endDate: true } } },
      orderBy: { appliedAt: 'desc' },
    });
  }

  async apply(
    bootcampId: number,
    data: {
      applicantName: string;
      phone?: string;
      email?: string;
      address?: string;
      portfolioUrl?: string;
      portfolioFiles?: { url: string; originalName: string; size: number }[];
      motivation?: string;
    },
    authenticatedUserId?: number,
  ) {
    let userId: number;

    if (authenticatedUserId) {
      // 로그인된 유저 → 직접 매핑
      userId = authenticatedUserId;
    } else {
      // 비로그인 → 이메일로 기존 유저 검색, 없으면 임시 생성
      let user = data.email
        ? await this.prisma.user.findUnique({ where: { email: data.email } })
        : null;

      if (!user) {
        user = await this.prisma.user.create({
          data: {
            name: data.applicantName,
            email: data.email || `applicant_${Date.now()}@temp.com`,
            phone: data.phone || '',
            password: '',
          },
        });
      }
      userId = user.id;
    }

    const iqData = {
      applicantName: data.applicantName,
      phone: data.phone,
      email: data.email,
      address: data.address,
      portfolioUrl: data.portfolioUrl,
      portfolioFiles: data.portfolioFiles || [],
      motivation: data.motivation,
    };

    return this.prisma.applicant.upsert({
      where: {
        userId_bootcampId: { userId, bootcampId },
      },
      update: {
        interviewQuestions: iqData,
        status: 'PENDING',
      },
      create: {
        bootcampId,
        userId,
        interviewQuestions: iqData,
      },
      include: { user: true },
    });
  }

  findOne(id: number) {
    return this.prisma.applicant.findUnique({
      where: { id },
      include: { user: true, bootcamp: true },
    });
  }

  async remove(id: number) {
    return this.prisma.applicant.delete({ where: { id } });
  }

  async updateStatus(id: number, status: 'PENDING' | 'ACCEPTED' | 'WAITING' | 'COMPLETED' | 'REJECTED') {
    return this.prisma.applicant.update({ where: { id }, data: { status } });
  }

  async bulkUpdateStatus(ids: number[], status: 'ACCEPTED' | 'WAITING' | 'COMPLETED' | 'REJECTED') {
    return this.prisma.applicant.updateMany({
      where: { id: { in: ids } },
      data: { status },
    });
  }

  /**
   * 관리자 초대: 이메일로 유저를 찾아 해당 부트캠프에 합격(ACCEPTED) 상태로 등록
   */
  async invite(bootcampId: number, email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new NotFoundException('해당 이메일로 등록된 유저가 없습니다.');
    }

    return this.prisma.applicant.upsert({
      where: {
        userId_bootcampId: { userId: user.id, bootcampId },
      },
      update: {
        status: 'ACCEPTED',
      },
      create: {
        bootcampId,
        userId: user.id,
        status: 'ACCEPTED',
        interviewQuestions: {
          applicantName: user.name || '',
          phone: user.phone || '',
          email: user.email,
        } as any,
      },
      include: { user: { select: { id: true, name: true, email: true, phone: true, role: true } } },
    });
  }
}
