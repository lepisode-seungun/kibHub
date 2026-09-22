import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, Req,
  ParseIntPipe, UseGuards, Inject,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ChallengesService } from './challenges.service';
import { AuthGuard } from '../auth/auth.guard';
import { OptionalAuthGuard } from '../auth/optional-auth.guard';
import { ChallengeStatus } from '@prisma/generated';
import { Request } from 'express';

interface AuthReq extends Request { userId: number; }

@ApiTags('challenges')
@Controller('challenges')
export class ChallengesController {
  constructor(@Inject(ChallengesService) private readonly svc: ChallengesService) {}

  // ===== 클라이언트 =====

  /** 챌린지 목록 (어드민: 숨김 포함 전체) — :id 보다 먼저 정의 */
  @Get('admin/list')
  findAllAdmin(@Query('status') status?: ChallengeStatus) {
    return this.svc.findAll(status, true);
  }

  /** 챌린지 목록 */
  @Get()
  findAll(@Query('status') status?: ChallengeStatus) {
    return this.svc.findAll(status);
  }

  /** 챌린지 상세 */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.svc.findOne(id);
  }

  /** 출품작 목록 */
  @Get(':id/entries')
  @UseGuards(OptionalAuthGuard)
  findEntries(
    @Param('id', ParseIntPipe) id: number,
    @Query('sort') sort?: string,
    @Req() req?: AuthReq,
  ) {
    return this.svc.findEntries(id, sort, req?.userId);
  }

  /** 내 출품작 */
  @Get(':id/my-entry')
  @UseGuards(AuthGuard)
  findMyEntry(@Param('id', ParseIntPipe) id: number, @Req() req: AuthReq) {
    return this.svc.findMyEntry(id, req.userId);
  }

  /** 작품 제출 */
  @Post(':id/entries')
  @UseGuards(AuthGuard)
  submitEntry(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthReq,
    @Body() body: { title: string; description?: string; images?: string[] },
  ) {
    return this.svc.submitEntry(id, req.userId, body);
  }

  /** 작품 수정 */
  @Patch('entries/:entryId')
  @UseGuards(AuthGuard)
  updateEntry(
    @Param('entryId', ParseIntPipe) entryId: number,
    @Req() req: AuthReq,
    @Body() body: { title?: string; description?: string; images?: string[] },
  ) {
    return this.svc.updateEntry(entryId, req.userId, body);
  }

  /** 작품 삭제 */
  @Delete('entries/:entryId')
  @UseGuards(AuthGuard)
  deleteEntry(@Param('entryId', ParseIntPipe) entryId: number, @Req() req: AuthReq) {
    return this.svc.deleteEntry(entryId, req.userId);
  }

  /** 좋아요 토글 */
  @Post('entries/:entryId/like')
  @UseGuards(AuthGuard)
  toggleLike(@Param('entryId', ParseIntPipe) entryId: number, @Req() req: AuthReq) {
    return this.svc.toggleLike(entryId, req.userId);
  }

  /** 좋아요 여부 확인 */
  @Get('entries/:entryId/like')
  @UseGuards(AuthGuard)
  checkLike(@Param('entryId', ParseIntPipe) entryId: number, @Req() req: AuthReq) {
    return this.svc.checkLike(entryId, req.userId);
  }

  // ===== 어드민 =====

  /** 챌린지 생성 */
  @Post()
  create(@Body() body: {
    title: string;
    description?: string;
    thumbnail?: string;
    referenceImages?: string[];
    category: string;
    difficulty?: string;
    startDate: string;
    endDate: string;
    maxSubmissions?: number;
    isBootcampOnly?: boolean;
    bootcampId?: number;
    prize?: string;
  }) {
    return this.svc.create(body);
  }

  /** 상태 변경 — :id 보다 먼저 정의 */
  @Patch(':id/status')
  updateStatus(@Param('id', ParseIntPipe) id: number, @Body() body: { status: ChallengeStatus }) {
    return this.svc.updateStatus(id, body.status);
  }

  /** 노출/숨김 토글 */
  @Patch(':id/visibility')
  toggleVisibility(@Param('id', ParseIntPipe) id: number, @Body() body: { isVisible: boolean }) {
    return this.svc.updateVisibility(id, body.isVisible);
  }

  /** 수상작 선정 */
  @Patch(':id/winners')
  setWinners(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { winners: { entryId: number; rank: number }[] },
  ) {
    return this.svc.setWinners(id, body.winners);
  }

  /** 챌린지 수정 */
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: Record<string, unknown>) {
    return this.svc.update(id, body);
  }

  /** 출품작 삭제 (어드민) — :id 보다 먼저 정의 */
  @Delete('entries/:entryId')
  removeEntry(@Param('entryId', ParseIntPipe) entryId: number) {
    return this.svc.removeEntry(entryId);
  }

  /** 챌린지 삭제 */
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.svc.remove(id);
  }

  /** 챌린지 통계 (어드민) */
  @Get(':id/stats')
  getStats(@Param('id', ParseIntPipe) id: number) {
    return this.svc.getStats(id);
  }
}
