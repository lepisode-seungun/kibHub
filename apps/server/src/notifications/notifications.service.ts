import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  async create(data: {
    userId: number;
    type: 'COMMENT' | 'REPLY' | 'FOLLOW' | 'BOOTCAMP_APPLY' | 'BOOTCAMP_ACCEPT' | 'BOOTCAMP_REJECT';
    message: string;
    actorId?: number;
    targetId?: number;
    targetType?: string;
  }) {
    // 자기 자신에게는 알림 안 보냄
    if (data.actorId && data.actorId === data.userId) return null;

    return this.prisma.notification.create({
      data: {
        type: data.type,
        message: data.message,
        userId: data.userId,
        actorId: data.actorId,
        targetId: data.targetId,
        targetType: data.targetType,
      },
    });
  }

  async findByUser(userId: number) {
    return this.prisma.notification.findMany({
      where: {
        userId,
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
      include: {
        actor: { select: { id: true, nickname: true, profileImage: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async getUnreadCount(userId: number) {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  async markAsRead(ids: number[], userId: number) {
    return this.prisma.notification.updateMany({
      where: { id: { in: ids }, userId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: number) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async deleteMany(ids: number[], userId: number) {
    return this.prisma.notification.deleteMany({
      where: { id: { in: ids }, userId },
    });
  }
}
