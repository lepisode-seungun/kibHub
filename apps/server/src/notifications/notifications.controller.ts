import { Controller, Get, Patch, Delete, Body, Inject, UseGuards, Req } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { AuthGuard } from '../auth/auth.guard';
import { Request } from 'express';

@Controller('notifications')
export class NotificationsController {
  constructor(@Inject(NotificationsService) private notiService: NotificationsService) {}

  @Get()
  @UseGuards(AuthGuard)
  findAll(@Req() req: Request & { userId: number }) {
    return this.notiService.findByUser(req.userId);
  }

  @Get('unread-count')
  @UseGuards(AuthGuard)
  async unreadCount(@Req() req: Request & { userId: number }) {
    const count = await this.notiService.getUnreadCount(req.userId);
    return { count };
  }

  @Patch('read')
  @UseGuards(AuthGuard)
  markRead(@Req() req: Request & { userId: number }, @Body('ids') ids: number[]) {
    return this.notiService.markAsRead(ids, req.userId);
  }

  @Patch('read-all')
  @UseGuards(AuthGuard)
  markAllRead(@Req() req: Request & { userId: number }) {
    return this.notiService.markAllAsRead(req.userId);
  }

  @Delete()
  @UseGuards(AuthGuard)
  deleteMany(@Req() req: Request & { userId: number }, @Body('ids') ids: number[]) {
    return this.notiService.deleteMany(ids, req.userId);
  }
}
