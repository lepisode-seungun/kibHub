import { Controller, Get, Post, Patch, Delete, Param, Body, Req, ParseIntPipe, UseGuards, Query, Inject } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { AuthGuard } from '../auth/auth.guard';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(@Inject(ReviewsService) private readonly reviewsService: ReviewsService) {}
  /** 전체 리뷰 목록 (어드민) */
  @Get()
  findAll() {
    return this.reviewsService.findAll();
  }

  /** 리뷰 목록 (공개: approved만, 내부: 전체) */
  @Get('bootcamp/:id')
  findByBootcamp(
    @Param('id', ParseIntPipe) id: number,
    @Query('approvedOnly') approvedOnly?: string,
  ) {
    return this.reviewsService.findByBootcamp(id, approvedOnly === 'true');
  }

  /** 내 리뷰 조회 */
  @Get('bootcamp/:id/mine')
  @UseGuards(AuthGuard)
  findMine(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.reviewsService.findMine(id, req.userId);
  }

  /** 리뷰 작성 */
  @Post('bootcamp/:id')
  @UseGuards(AuthGuard)
  create(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
    @Body() data: { rating: number; body: string; images?: string[] },
  ) {
    return this.reviewsService.create(id, req.userId, data);
  }

  /** 리뷰 수정 */
  @Patch(':id')
  @UseGuards(AuthGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
    @Body() data: { rating?: number; body?: string; images?: string[] },
  ) {
    return this.reviewsService.update(id, req.userId, data);
  }

  /** 리뷰 삭제 */
  @Delete(':id')
  @UseGuards(AuthGuard)
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.reviewsService.remove(id, req.userId);
  }

  /** 리뷰 읽음 처리 */
  @Patch(':id/read')
  markAsRead(@Param('id', ParseIntPipe) id: number) {
    return this.reviewsService.markAsRead(id);
  }

  /** 리뷰 일괄 읽음 처리 */
  @Patch('bulk/read')
  markManyAsRead(@Body() body: { ids: number[] }) {
    return this.reviewsService.markManyAsRead(body.ids);
  }
}
