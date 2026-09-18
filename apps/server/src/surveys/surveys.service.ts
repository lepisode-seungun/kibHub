import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { Prisma } from '@prisma/generated';
import { PrismaService } from '../prisma/prisma.service';

/** 설문 질문 타입 */
type SurveyQuestionType = 'SINGLE' | 'MULTIPLE' | 'RATING' | 'TEXT';

/** 설문 질문 정의 */
interface SurveyQuestion {
  id?: string;
  title: string;
  text?: string;
  type: SurveyQuestionType;
  options?: string[];
  required?: boolean;
}

/** 설문 응답 항목 (유저가 제출한 개별 답변) */
interface SurveyAnswerEntry {
  questionId?: string;
  questionIndex?: number;
  answer: string | number | string[];
}

/** 선택형 질문 통계 */
interface ChoiceQuestionStat {
  questionId: string | undefined;
  title: string;
  type: SurveyQuestionType;
  totalAnswers: number;
  distribution: { option: string; count: number; percentage: number }[];
}

/** 별점 질문 통계 */
interface RatingQuestionStat {
  questionId: string | undefined;
  title: string;
  type: SurveyQuestionType;
  totalAnswers: number;
  average: number;
  distribution: { rating: number; count: number; percentage: number }[];
}

/** 서술형 질문 통계 */
interface TextQuestionStat {
  questionId: string | undefined;
  title: string;
  type: SurveyQuestionType;
  totalAnswers: number;
  answers: (string | number | string[])[];
}

type QuestionStat = ChoiceQuestionStat | RatingQuestionStat | TextQuestionStat;

/** 설문 통계 결과 */
interface SurveyStatsResult {
  surveyId: number;
  title: string;
  bootcamp: { id: number; name: string };
  totalStudents: number;
  totalResponses: number;
  responseRate: number;
  questionStats: QuestionStat[];
}

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
  async upsert(bootcampId: number, title: string, questions: SurveyQuestion[]) {
    const existing = await this.prisma.survey.findFirst({ where: { bootcampId } });
    if (existing) {
      return this.prisma.survey.update({
        where: { id: existing.id },
        data: { title, questions: questions as unknown as Prisma.InputJsonArray, isActive: true },
      });
    }
    return this.prisma.survey.create({
      data: { bootcampId, title, questions: questions as unknown as Prisma.InputJsonArray, isActive: true },
    });
  }

  /** 설문 삭제 */
  async remove(id: number) {
    return this.prisma.survey.delete({ where: { id } });
  }

  /** 설문 응답 제출 (중복 시 덮어쓰기) */
  async respond(surveyId: number, userId: number, answers: SurveyAnswerEntry[]) {
    return this.prisma.surveyResponse.upsert({
      where: { surveyId_userId: { surveyId, userId } },
      update: { answers: answers as unknown as Prisma.InputJsonArray },
      create: { surveyId, userId, answers: answers as unknown as Prisma.InputJsonArray },
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

  /** 설문 통계 (관리자) */
  async getStats(surveyId: number): Promise<SurveyStatsResult> {
    const survey = await this.prisma.survey.findUnique({
      where: { id: surveyId },
      include: {
        responses: {
          include: { user: { select: { id: true, nickname: true, email: true } } },
        },
        bootcamp: { select: { id: true, name: true } },
      },
    });
    if (!survey) throw new NotFoundException('설문을 찾을 수 없습니다.');

    // 해당 부트캠프 수강생 수
    const totalStudents = await this.prisma.applicant.count({
      where: { bootcampId: survey.bootcampId, status: { in: ['ACCEPTED', 'COMPLETED'] } },
    });

    const questions = survey.questions as unknown as SurveyQuestion[];
    const responses = survey.responses;

    // 질문별 통계
    const questionStats: QuestionStat[] = questions.map((q, qIdx) => {
      const answers = responses
        .map(r => {
          const ans = r.answers as unknown as SurveyAnswerEntry[];
          const found = ans.find(a => a.questionId === q.id || a.questionIndex === qIdx);
          return found?.answer;
        })
        .filter((a): a is string | number | string[] => a !== undefined && a !== null);

      if (q.type === 'SINGLE' || q.type === 'MULTIPLE') {
        const optionCounts: Record<string, number> = {};
        (q.options || []).forEach(opt => { optionCounts[opt] = 0; });
        answers.forEach(a => {
          if (Array.isArray(a)) {
            a.forEach(v => { optionCounts[v] = (optionCounts[v] || 0) + 1; });
          } else {
            optionCounts[String(a)] = (optionCounts[String(a)] || 0) + 1;
          }
        });
        return {
          questionId: q.id,
          title: q.title,
          type: q.type,
          totalAnswers: answers.length,
          distribution: Object.entries(optionCounts).map(([option, count]) => ({
            option,
            count,
            percentage: answers.length > 0 ? Math.round((count / answers.length) * 100) : 0,
          })),
        } satisfies ChoiceQuestionStat;
      } else if (q.type === 'RATING') {
        const nums = answers.map(a => Number(a)).filter(n => !isNaN(n));
        const avg = nums.length > 0 ? nums.reduce((s, n) => s + n, 0) / nums.length : 0;
        const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        nums.forEach(n => { dist[n] = (dist[n] || 0) + 1; });
        return {
          questionId: q.id,
          title: q.title,
          type: q.type,
          totalAnswers: nums.length,
          average: Math.round(avg * 10) / 10,
          distribution: Object.entries(dist).map(([rating, count]) => ({
            rating: Number(rating),
            count,
            percentage: nums.length > 0 ? Math.round((count / nums.length) * 100) : 0,
          })),
        } satisfies RatingQuestionStat;
      } else {
        // TEXT
        return {
          questionId: q.id,
          title: q.title,
          type: q.type,
          totalAnswers: answers.length,
          answers: answers.slice(0, 50), // 최대 50개
        } satisfies TextQuestionStat;
      }
    });

    return {
      surveyId: survey.id,
      title: survey.title,
      bootcamp: survey.bootcamp,
      totalStudents,
      totalResponses: responses.length,
      responseRate: totalStudents > 0 ? Math.round((responses.length / totalStudents) * 100) : 0,
      questionStats,
    };
  }

  /** 설문 CSV 내보내기 (관리자) */
  async exportCsv(surveyId: number): Promise<string> {
    const survey = await this.prisma.survey.findUnique({
      where: { id: surveyId },
      include: {
        responses: {
          include: { user: { select: { id: true, nickname: true, email: true } } },
        },
      },
    });
    if (!survey) throw new NotFoundException('설문을 찾을 수 없습니다.');

    const questions = survey.questions as unknown as SurveyQuestion[];
    const responses = survey.responses;

    // BOM for Excel UTF-8 compat
    const BOM = '\uFEFF';
    const headers = ['닉네임', '이메일', ...questions.map(q => q.title)];
    const rows = responses.map(r => {
      const answers = r.answers as unknown as SurveyAnswerEntry[];
      const cells = questions.map((q, qIdx) => {
        const found = answers.find(a => a.questionId === q.id || a.questionIndex === qIdx);
        if (!found) return '';
        const val = found.answer;
        if (Array.isArray(val)) return val.join(', ');
        return String(val);
      });
      return [r.user?.nickname || '', r.user?.email || '', ...cells];
    });

    const escape = (s: string) => `"${s.replace(/"/g, '""')}"`;
    const csvLines = [
      headers.map(escape).join(','),
      ...rows.map(row => row.map(escape).join(',')),
    ];

    return BOM + csvLines.join('\r\n');
  }
}
