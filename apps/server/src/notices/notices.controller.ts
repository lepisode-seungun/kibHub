import { Controller, Get, Post, Patch, Delete, Param, Body, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { NoticesService } from './notices.service';
import { AuthGuard } from '../auth/auth.guard';
import { CreateNoticeDto } from '@kibhub/shared';

@ApiTags('notices')
@Controller()
export class NoticesController {
  constructor(private noticesService: NoticesService) {}

  @Get('notices')
  findAll(@Query() query: { search?: string; type?: string }) {
    return this.noticesService.findAll(query);
  }

  @Get('notices/:id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.noticesService.findOne(id);
  }

  @Post('notices')
  @UseGuards(AuthGuard)
  create(@Body() data: CreateNoticeDto) {
    return this.noticesService.create(data);
  }

  @Patch('notices/:id')
  @UseGuards(AuthGuard)
  update(@Param('id', ParseIntPipe) id: number, @Body() data: Partial<CreateNoticeDto>) {
    return this.noticesService.update(id, data);
  }

  @Delete('notices/:id')
  @UseGuards(AuthGuard)
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.noticesService.delete(id);
  }

  // 부트캠프 공지
  @Get('bootcamps/:bootcampId/notices')
  findByBootcamp(@Param('bootcampId', ParseIntPipe) bootcampId: number, @Query() query: { search?: string }) {
    return this.noticesService.findAll({ ...query, type: 'BOOTCAMP', bootcampId });
  }

  @Post('bootcamps/:bootcampId/notices')
  @UseGuards(AuthGuard)
  createForBootcamp(@Param('bootcampId', ParseIntPipe) bootcampId: number, @Body() data: CreateNoticeDto) {
    return this.noticesService.create({ ...data, type: 'BOOTCAMP', bootcampId });
  }
}
