import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, Req,
  ParseIntPipe, UseGuards, Inject,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ChallengesService } from './challenges.service';
import { AuthGuard } from '../auth/auth.guard';
import { OptionalAuthGuard } from '../auth/optional-auth.guard';

@ApiTags('challenges')
@Controller('challenges')
export class ChallengesController {
  constructor(@Inject(ChallengesService) private readonly svc: ChallengesService) {}

  // ===== 클라이언트 =====

  /** 챌린지 목록 */
  @Get()
  findAll(@Query('status') status?: string) {
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
    @Req() req?: any,
  ) {
    return this.svc.findEntries(id, sort, req?.userId);
  }

  /** 내 출품작 */
  @Get(':id/my-entry')
  @UseGuards(AuthGuard)
  findMyEntry(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.svc.findMyEntry(id, req.userId);
  }

  /** 작품 제출 */
  @Post(':id/entries')
  @UseGuards(AuthGuard)
  submitEntry(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
    @Body() body: { title: string; description?: string; images?: string[] },
  ) {
    return this.svc.submitEntry(id, req.userId, body);
  }

  /** 작품 수정 */
  @Patch('entries/:entryId')
  @UseGuards(AuthGuard)
  updateEntry(
    @Param('entryId', ParseIntPipe) entryId: number,
    @Req() req: any,
    @Body() body: { title?: string; description?: string; images?: string[] },
  ) {
    return this.svc.updateEntry(entryId, req.userId, body);
  }

  /** 작품 삭제 */
  @Delete('entries/:entryId')
  @UseGuards(AuthGuard)
  deleteEntry(@Param('entryId', ParseIntPipe) entryId: number, @Req() req: any) {
    return this.svc.deleteEntry(entryId, req.userId);
  }

  /** 좋아요 토글 */
  @Post('entries/:entryId/like')
  @UseGuards(AuthGuard)
  toggleLike(@Param('entryId', ParseIntPipe) entryId: number, @Req() req: any) {
    return this.svc.toggleLike(entryId, req.userId);
  }

  /** 좋아요 여부 확인 */
  @Get('entries/:entryId/like')
  @UseGuards(AuthGuard)
  checkLike(@Param('entryId', ParseIntPipe) entryId: number, @Req() req: any) {
    return this.svc.checkLike(entryId, req.userId);
  }

  // ===== 어드민 =====

  /** 챌린지 생성 */
  @Post()
  create(@Body() body: any) {
    return this.svc.create(body);
  }

  /** 챌린지 수정 */
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.svc.update(id, body);
  }

  /** 챌린지 삭제 */
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.svc.remove(id);
  }

  /** 상태 변경 */
  @Patch(':id/status')
  updateStatus(@Param('id', ParseIntPipe) id: number, @Body() body: { status: string }) {
    return this.svc.updateStatus(id, body.status);
  }

  /** 수상작 선정 */
  @Patch(':id/winners')
  setWinners(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { winners: { entryId: number; rank: number }[] },
  ) {
    return this.svc.setWinners(id, body.winners);
  }

  /** 챌린지 통계 (어드민) */
  @Get(':id/stats')
  getStats(@Param('id', ParseIntPipe) id: number) {
    return this.svc.getStats(id);
  }
}
