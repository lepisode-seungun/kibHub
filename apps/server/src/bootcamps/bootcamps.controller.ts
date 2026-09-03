import { Inject, Controller, Get, Post, Patch, Delete, Param, Body, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BootcampsService } from './bootcamps.service';
import { AuthGuard } from '../auth/auth.guard';
import { CreateBootcampDto } from '@kibhub/shared';

@ApiTags('bootcamps')
@Controller('bootcamps')
export class BootcampsController {
  constructor(@Inject(BootcampsService) private bootcampsService: BootcampsService) {}

  @Get()
  findAll(@Query() query: { search?: string; status?: string; page?: string; limit?: string }) {
    return this.bootcampsService.findAll(query);
  }

  // 강사별 부트캠프 목록 (:id 보다 먼저 정의)
  @Get('instructor/:userId')
  findBootcampsByInstructor(@Param('userId', ParseIntPipe) userId: number) {
    return this.bootcampsService.findBootcampsByInstructor(userId);
  }

  // interview-settings 라우트를 :id 보다 먼저 정의 (라우트 우선순위)
  @Get(':id/interview-settings')
  getInterviewSettings(@Param('id', ParseIntPipe) id: number) {
    return this.bootcampsService.getInterviewSettings(id);
  }

  @Patch(':id/interview-settings')
  @UseGuards(AuthGuard)
  updateInterviewSettings(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { questions: { text: string }[] },
  ) {
    return this.bootcampsService.updateInterviewSettings(id, body.questions);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.bootcampsService.findOne(id);
  }

  @Post()
  @UseGuards(AuthGuard)
  create(@Body() data: CreateBootcampDto) {
    return this.bootcampsService.create(data);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  update(@Param('id', ParseIntPipe) id: number, @Body() data: Partial<CreateBootcampDto>) {
    return this.bootcampsService.update(id, data);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.bootcampsService.delete(id);
  }

  // ===== 강사 관리 =====

  @Get(':id/instructors')
  findInstructors(@Param('id', ParseIntPipe) id: number) {
    return this.bootcampsService.findInstructors(id);
  }

  @Post(':id/instructors')
  @UseGuards(AuthGuard)
  addInstructor(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { userId: number },
  ) {
    return this.bootcampsService.addInstructor(id, body.userId);
  }

  @Delete(':id/instructors/:userId')
  @UseGuards(AuthGuard)
  removeInstructor(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return this.bootcampsService.removeInstructor(id, userId);
  }
}
