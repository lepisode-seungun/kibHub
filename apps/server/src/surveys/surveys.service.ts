import { Injectable, ForbiddenException, NotFoundException, ConflictException, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SurveysService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  /** 부트캠프의 활성 설문 조회 */
  async findActive(bootcampId: number) {
    return this.prisma.survey.findFirst({
      where: { bootcampId, isActive: true },
    });
  }

  /** 설문 생성/수정 (upsert) */
  async upsert(bootcampId: number, title: string, questions: any[]) {
    const existing = await this.prisma.survey.findFirst({ where: { bootcampId } });
    if (existing) {
      return this.prisma.survey.update({
        where: { id: existing.id },
        data: { title, questions, isActive: true },
      });
    }
    return this.prisma.survey.create({
      data: { bootcampId, title, questions, isActive: true },
    });
  }

  /** 설문 삭제 */
  async remove(id: number) {
    return this.prisma.survey.delete({ where: { id } });
  }

  /** 설문 응답 제출 */
  async respond(surveyId: number, userId: number, answers: any[]) {
    // 중복 체크
    const existing = await this.prisma.surveyResponse.findUnique({
      where: { surveyId_userId: { surveyId, userId } },
    });
    if (existing) {
      throw new ConflictException('이미 설문에 응답하셨습니다.');
    }

    return this.prisma.surveyResponse.create({
      data: { surveyId, userId, answers },
    });
  }

  /** 설문 결과 조회 (관리자) */
  async getResults(surveyId: number) {
    const survey = await this.prisma.survey.findUnique({
      where: { id: surveyId },
      include: {
        responses: {
          include: { user: { select: { id: true, nickname: true } } },
        },
      },
    });
    if (!survey) throw new NotFoundException('설문을 찾을 수 없습니다.');
    return survey;
  }

  /** 내 설문 응답 여부 확인 */
  async checkResponse(surveyId: number, userId: number) {
    const response = await this.prisma.surveyResponse.findUnique({
      where: { surveyId_userId: { surveyId, userId } },
    });
    return { hasResponded: !!response };
  }

  /** 특정 유저의 설문 응답 조회 (관리자) */
  async findUserResponse(surveyId: number, userId: number) {
    return this.prisma.surveyResponse.findUnique({
      where: { surveyId_userId: { surveyId, userId } },
    });
  }
}
