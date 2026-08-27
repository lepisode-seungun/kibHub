import { Inject, Controller, Get, Post, Patch, Delete, Param, Body, Query, ParseIntPipe, UseGuards, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InquiriesService } from './inquiries.service';
import { AuthGuard } from '../auth/auth.guard';
import { Request } from 'express';
import { CreateInquiryDto, InquiryReplyDto } from '@kibhub/shared';

@ApiTags('inquiries')
@Controller('inquiries')
export class InquiriesController {
  constructor(@Inject(InquiriesService) private inquiriesService: InquiriesService) {}

  @Get()
  findAll(@Query() query: { search?: string; status?: string; page?: string; limit?: string }) {
    return this.inquiriesService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.inquiriesService.findOne(id);
  }

  @Post()
  @UseGuards(AuthGuard)
  create(@Req() req: Request & { userId: number }, @Body() data: CreateInquiryDto) {
    return this.inquiriesService.create({ ...data, authorId: req.userId });
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  update(@Param('id', ParseIntPipe) id: number, @Body() data: Partial<CreateInquiryDto>) {
    return this.inquiriesService.update(id, data);
  }

  @Post(':id/reply')
  @UseGuards(AuthGuard)
  reply(@Param('id', ParseIntPipe) id: number, @Body() data: InquiryReplyDto, @Req() req: Request & { userId: number }) {
    return this.inquiriesService.reply(id, { reply: data.reply, repliedById: req.userId });
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.inquiriesService.delete(id);
  }
}
