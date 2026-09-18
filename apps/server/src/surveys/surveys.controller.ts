import { Controller, Get, Post, Delete, Param, Body, Req, Res, ParseIntPipe, UseGuards, Inject } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { SurveysService } from './surveys.service';
import { AuthGuard } from '../auth/auth.guard';

/** 설문 질문 (요청 Body용) */
interface SurveyQuestionDto {
  id?: string;
  title: string;
  text?: string;
  type: 'SINGLE' | 'MULTIPLE' | 'RATING' | 'TEXT';
  options?: string[];
  required?: boolean;
}

/** 설문 응답 항목 (요청 Body용) */
interface SurveyAnswerDto {
  questionId?: string;
  questionIndex?: number;
  answer: string | number | string[];
}

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
    @Body() body: { title?: string; questions: SurveyQuestionDto[] },
  ) {
    return this.surveysService.upsert(bootcampId, body.title || '수료 설문', body.questions);
  }

  /** 설문 삭제 (관리자) */
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.surveysService.remove(id);
  }

  /** 설문 응답 초기화 (관리자) */
  @Delete(':id/responses')
  resetResponses(@Param('id', ParseIntPipe) id: number) {
    return this.surveysService.resetResponses(id);
  }

  /** 설문 응답 제출 */
  @Post(':id/respond')
  @UseGuards(AuthGuard)
  respond(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request & { userId: number },
    @Body() body: { answers: SurveyAnswerDto[] },
  ) {
    return this.surveysService.respond(id, req.userId, body.answers);
  }

  /** 설문 결과 조회 */
  @Get(':id/results')
  @UseGuards(AuthGuard)
  getResults(@Param('id', ParseIntPipe) id: number) {
    return this.surveysService.getResults(id);
  }

  /** 설문 통계 조회 (관리자) */
  @Get(':id/stats')
  getStats(@Param('id', ParseIntPipe) id: number) {
    return this.surveysService.getStats(id);
  }

  /** 설문 CSV 내보내기 (관리자) */
  @Get(':id/export')
  async exportCsv(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const csv = await this.surveysService.exportCsv(id);
    res.set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="survey-${id}.csv"`,
    });
    res.send(csv);
  }

  /** 내 응답 여부 확인 */
  @Get(':id/check')
  @UseGuards(AuthGuard)
  checkResponse(@Param('id', ParseIntPipe) id: number, @Req() req: Request & { userId: number }) {
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
