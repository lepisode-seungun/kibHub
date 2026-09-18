import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProgressService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  /** 수강 완료 표시 */
  async markComplete(userId: number, lectureId: number) {
    return this.prisma.lectureProgress.upsert({
      where: { userId_lectureId: { userId, lectureId } },
      update: { completed: true, completedAt: new Date() },
      create: { userId, lectureId, completed: true },
    });
  }

  /** 수강 완료 취소 */
  async unmarkComplete(userId: number, lectureId: number) {
    try {
      return await this.prisma.lectureProgress.delete({
        where: { userId_lectureId: { userId, lectureId } },
      });
    } catch {
      return null;
    }
  }

  /** 특정 강의 완료 여부 확인 */
  async isComplete(userId: number, lectureId: number) {
    const record = await this.prisma.lectureProgress.findUnique({
      where: { userId_lectureId: { userId, lectureId } },
    });
    return { completed: !!record?.completed };
  }

  /** 내 전체 진도 (부트캠프 내 모든 과정) */
  async getMyProgress(userId: number, bootcampId: number) {
    // 부트캠프의 모든 과정 가져오기
    const courses = await this.prisma.course.findMany({
      where: { bootcampId },
      select: {
        id: true,
        title: true,
        lectures: { select: { id: true } },
      },
      orderBy: { order: 'asc' },
    });

    // 해당 유저의 완료 강의 ID들
    const allLectureIds = courses.flatMap(c => c.lectures.map(l => l.id));
    const completed = await this.prisma.lectureProgress.findMany({
      where: { userId, lectureId: { in: allLectureIds }, completed: true },
      select: { lectureId: true },
    });
    const completedSet = new Set(completed.map(c => c.lectureId));

    const courseProgress = courses.map(c => ({
      courseId: c.id,
      courseTitle: c.title,
      totalLectures: c.lectures.length,
      completedLectures: c.lectures.filter(l => completedSet.has(l.id)).length,
      rate: c.lectures.length > 0
        ? Math.round((c.lectures.filter(l => completedSet.has(l.id)).length / c.lectures.length) * 100)
        : 0,
    }));

    const totalLectures = allLectureIds.length;
    const totalCompleted = completedSet.size;

    return {
      totalLectures,
      totalCompleted,
      totalRate: totalLectures > 0 ? Math.round((totalCompleted / totalLectures) * 100) : 0,
      courses: courseProgress,
    };
  }

  /** 특정 코스 진도율 */
  async getCourseProgress(userId: number, courseId: number) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        title: true,
        lectures: { select: { id: true, title: true }, orderBy: { order: 'asc' } },
      },
    });

    if (!course) return null;

    const completed = await this.prisma.lectureProgress.findMany({
      where: { userId, lectureId: { in: course.lectures.map(l => l.id) }, completed: true },
      select: { lectureId: true },
    });
    const completedSet = new Set(completed.map(c => c.lectureId));

    return {
      courseId: course.id,
      courseTitle: course.title,
      lectures: course.lectures.map(l => ({
        lectureId: l.id,
        title: l.title,
        completed: completedSet.has(l.id),
      })),
      totalLectures: course.lectures.length,
      completedLectures: completed.length,
      rate: course.lectures.length > 0 ? Math.round((completed.length / course.lectures.length) * 100) : 0,
    };
  }
}
