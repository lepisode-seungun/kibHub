import { Controller, Get, Post, Patch, Delete, Param, Body, Req, ParseIntPipe, UseGuards, Inject } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SurveysService } from './surveys.service';
import { AuthGuard } from '../auth/auth.guard';

@ApiTags('surveys')
@Controller('surveys')
export class SurveysController {
  constructor(@Inject(SurveysService) private readonly surveysService: SurveysService) {}

  /** 활성 설문 조회 */
  @Get('bootcamp/:id')
  findActive(@Param('id', ParseIntPipe) id: number) {
    return this.surveysService.findActive(id);
  }

  /** 설문 생성/수정 (관리자) */
  @Post('bootcamp/:id')
  upsert(
    @Param('id', ParseIntPipe) bootcampId: number,
    @Body() body: { title?: string; questions: any[] },
  ) {
    return this.surveysService.upsert(bootcampId, body.title || '수료 설문', body.questions);
  }

  /** 설문 삭제 (관리자) */
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.surveysService.remove(id);
  }

  /** 설문 응답 제출 */
  @Post(':id/respond')
  @UseGuards(AuthGuard)
  respond(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
    @Body() body: { answers: any[] },
  ) {
    return this.surveysService.respond(id, req.userId, body.answers);
  }

  /** 설문 결과 조회 */
  @Get(':id/results')
  @UseGuards(AuthGuard)
  getResults(@Param('id', ParseIntPipe) id: number) {
    return this.surveysService.getResults(id);
  }

  /** 내 응답 여부 확인 */
  @Get(':id/check')
  @UseGuards(AuthGuard)
  checkResponse(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.surveysService.checkResponse(id, req.userId);
  }

  /** 특정 유저의 설문 응답 조회 (관리자) */
  @Get(':surveyId/user/:userId')
  findUserResponse(
    @Param('surveyId', ParseIntPipe) surveyId: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return this.surveysService.findUserResponse(surveyId, userId);
  }
}
