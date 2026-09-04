import { Inject, Controller, Get, Post, Patch, Delete, Param, Body, Query, ParseIntPipe, UseGuards, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ContentsService } from './contents.service';
import { AuthGuard } from '../auth/auth.guard';
import { Request } from 'express';
import { CreateContentDto, CreateReportDto } from '@kibhub/shared';

@ApiTags('contents')
@Controller()
export class ContentsController {
  constructor(@Inject(ContentsService) private contentsService: ContentsService) {}
  // deleteReport route added

  // ===== 콘텐츠 =====
  @Get('contents')
  findAll(@Query() query: { search?: string; status?: string; type?: string; showAll?: string; page?: string; limit?: string }) {
    return this.contentsService.findAll(query);
  }

  @Get('contents/:id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.contentsService.findOne(id);
  }

  @Post('contents')
  @UseGuards(AuthGuard)
  create(@Req() req: Request & { userId: number }, @Body() data: CreateContentDto) {
    return this.contentsService.create({ ...data, authorId: req.userId });
  }

  @Patch('contents/:id')
  @UseGuards(AuthGuard)
  update(@Param('id', ParseIntPipe) id: number, @Body() data: Partial<CreateContentDto>) {
    return this.contentsService.update(id, data);
  }

  @Delete('contents/:id')
  @UseGuards(AuthGuard)
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.contentsService.delete(id);
  }

  // ===== 카테고리 =====
  @Get('content-categories')
  findCategories() {
    return this.contentsService.findCategories();
  }

  @Post('content-categories')
  @UseGuards(AuthGuard)
  createCategory(@Body() data: { name: string; sortOrder?: number }) {
    return this.contentsService.createCategory(data);
  }

  @Patch('content-categories/:id')
  @UseGuards(AuthGuard)
  updateCategory(@Param('id', ParseIntPipe) id: number, @Body() data: { name?: string; sortOrder?: number }) {
    return this.contentsService.updateCategory(id, data);
  }

  @Delete('content-categories/:id')
  @UseGuards(AuthGuard)
  deleteCategory(@Param('id', ParseIntPipe) id: number) {
    return this.contentsService.deleteCategory(id);
  }

  // ===== 댓글 =====
  @Get('comments/recent')
  findRecentComments(@Query('take') take?: string) {
    return this.contentsService.findRecentComments(take ? parseInt(take) : 10);
  }

  @Get('comments/best')
  findBestComments(@Query('take') take?: string) {
    return this.contentsService.findBestComments(take ? parseInt(take) : 10);
  }

  @Get('contents/:contentId/comments')
  findComments(@Param('contentId', ParseIntPipe) contentId: number, @Req() req: Request, @Query('showAll') showAll?: string) {
    // 쿠키에서 userId를 optional로 추출 (인증 없이도 조회 가능)
    let userId: number | undefined;
    try {
      const token = req.cookies?.kiphub_token;
      if (token) {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env['JWT_SECRET'] || 'kiphub-jwt-secret-key-2026') as { userId: number };
        userId = decoded.userId;
      }
    } catch {}
    return this.contentsService.findComments(contentId, userId, showAll === 'true');
  }

  @Post('contents/:contentId/comments')
  @UseGuards(AuthGuard)
  createComment(@Param('contentId', ParseIntPipe) contentId: number, @Req() req: Request & { userId: number }, @Body() data: { body: string; images?: string[]; parentId?: number; type?: string; markerNum?: number; markerTop?: number; markerLeft?: number; markerImageIndex?: number }) {
    return this.contentsService.createComment(contentId, { body: data.body, images: data.images, authorId: req.userId, parentId: data.parentId, type: data.type, markerNum: data.markerNum, markerTop: data.markerTop, markerLeft: data.markerLeft, markerImageIndex: data.markerImageIndex });
  }

  @Patch('comments/:id')
  @UseGuards(AuthGuard)
  updateComment(@Param('id', ParseIntPipe) id: number, @Body() data: { body?: string; status?: string }) {
    return this.contentsService.updateComment(id, data);
  }

  @Delete('comments/:id')
  @UseGuards(AuthGuard)
  deleteComment(@Param('id', ParseIntPipe) id: number, @Query('hard') hard?: string) {
    return this.contentsService.deleteComment(id, hard === 'true');
  }

  @Post('comments/:id/like')
  @UseGuards(AuthGuard)
  toggleCommentLike(@Param('id', ParseIntPipe) id: number, @Req() req: Request & { userId: number }) {
    return this.contentsService.toggleCommentLike(id, req.userId);
  }

  // ===== 신고 =====
  @Get('reports')
  findReports(@Query() query: { type?: string; targetId?: string }) {
    return this.contentsService.findReports(query);
  }

  @Post('reports')
  @UseGuards(AuthGuard)
  createReport(@Req() req: Request & { userId: number }, @Body() data: CreateReportDto) {
    return this.contentsService.createReport({ ...data, reporterId: req.userId });
  }

  @Post('reports/:id/delete')
  @UseGuards(AuthGuard)
  deleteReport(@Param('id', ParseIntPipe) id: number) {
    return this.contentsService.deleteReport(id);
  }
}
