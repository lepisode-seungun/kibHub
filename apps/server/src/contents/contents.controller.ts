import { Controller, Get, Post, Patch, Delete, Param, Body, Query, ParseIntPipe, UseGuards, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ContentsService } from './contents.service';
import { AuthGuard } from '../auth/auth.guard';
import { Request } from 'express';
import { CreateContentDto, CreateReportDto } from '@kibhub/shared';

@ApiTags('contents')
@Controller()
export class ContentsController {
  constructor(private contentsService: ContentsService) {}

  // ===== 콘텐츠 =====
  @Get('contents')
  findAll(@Query() query: { search?: string; status?: string; type?: string }) {
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
  @Get('contents/:contentId/comments')
  findComments(@Param('contentId', ParseIntPipe) contentId: number) {
    return this.contentsService.findComments(contentId);
  }

  @Post('contents/:contentId/comments')
  @UseGuards(AuthGuard)
  createComment(@Param('contentId', ParseIntPipe) contentId: number, @Req() req: Request & { userId: number }, @Body() data: { body: string }) {
    return this.contentsService.createComment(contentId, { body: data.body, authorId: req.userId });
  }

  @Patch('comments/:id')
  @UseGuards(AuthGuard)
  updateComment(@Param('id', ParseIntPipe) id: number, @Body() data: { body?: string }) {
    return this.contentsService.updateComment(id, data);
  }

  @Delete('comments/:id')
  @UseGuards(AuthGuard)
  deleteComment(@Param('id', ParseIntPipe) id: number) {
    return this.contentsService.deleteComment(id);
  }

  // ===== 신고 =====
  @Get('reports')
  findReports(@Query() query: { type?: string }) {
    return this.contentsService.findReports(query);
  }

  @Post('reports')
  @UseGuards(AuthGuard)
  createReport(@Req() req: Request & { userId: number }, @Body() data: CreateReportDto) {
    return this.contentsService.createReport({ ...data, reporterId: req.userId });
  }
}
