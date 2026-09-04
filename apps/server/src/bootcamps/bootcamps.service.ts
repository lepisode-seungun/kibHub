import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../../../../prisma/generated/prisma/client';
import { CreateBootcampDto, PaginatedResponse } from '@kibhub/shared';
import { paginate, parsePagination } from '../common/pagination';

@Injectable()
export class BootcampsService {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  async findAll(query?: { search?: string; status?: string; page?: string | number; limit?: string | number }): Promise<PaginatedResponse<unknown> | unknown[]> {
    const where: Prisma.BootcampWhereInput = {};
    if (query?.status) where.status = query.status as Prisma.BootcampWhereInput['status'];
    if (query?.search) {
      where.name = { contains: query.search, mode: 'insensitive' };
    }

    if (query?.page || query?.limit) {
      const { page, limit, skip } = parsePagination(query);
      const [data, total] = await Promise.all([
        this.prisma.bootcamp.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
        this.prisma.bootcamp.count({ where }),
      ]);
      return paginate(data, total, page, limit);
    }
    return this.prisma.bootcamp.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  findOne(id: number) {
    return this.prisma.bootcamp.findUnique({
      where: { id },
      include: { courses: { include: { lectures: true, assignments: true } } },
    });
  }

  create(data: CreateBootcampDto) {
    return this.prisma.bootcamp.create({ data: data as Prisma.BootcampCreateInput });
  }

  async update(id: number, data: Partial<CreateBootcampDto>) {
    const updated = await this.prisma.bootcamp.update({ where: { id }, data: data as Prisma.BootcampUpdateInput });

    // 부트캠프 상태 변경 시 수강생 상태 자동 전환
    if ((data as any).status) {
      const newStatus = (data as any).status;

      if (newStatus === 'ENDED') {
        // 종료 → 합격(ACCEPTED)만 수료(COMPLETED)로 자동 전환
        await this.prisma.applicant.updateMany({
          where: { bootcampId: id, status: 'ACCEPTED' },
          data: { status: 'COMPLETED' },
        });
      } else if (newStatus === 'OPERATING') {
        // 운영으로 원복 → 수료(COMPLETED)를 합격(ACCEPTED)으로 되돌림
        await this.prisma.applicant.updateMany({
          where: { bootcampId: id, status: 'COMPLETED' },
          data: { status: 'ACCEPTED' },
        });
      }
    }

    return updated;
  }

  async delete(id: number) {
    return this.prisma.$transaction(async (tx) => {
      // 1. 지원자 삭제
      await tx.applicant.deleteMany({ where: { bootcampId: id } });

      // 2. 공지사항: NoticeFile → Notice 순서
      const noticeIds = (await tx.notice.findMany({ where: { bootcampId: id }, select: { id: true } })).map(n => n.id);
      if (noticeIds.length > 0) {
        await tx.noticeFile.deleteMany({ where: { noticeId: { in: noticeIds } } });
        await tx.notice.deleteMany({ where: { id: { in: noticeIds } } });
      }

      // 3. 과정 하위 데이터: leaf-first 삭제
      const courseIds = (await tx.course.findMany({ where: { bootcampId: id }, select: { id: true } })).map(c => c.id);
      if (courseIds.length > 0) {
        // 강의 파일 → 강의
        const lectureIds = (await tx.lecture.findMany({ where: { courseId: { in: courseIds } }, select: { id: true } })).map(l => l.id);
        if (lectureIds.length > 0) {
          await tx.lectureFile.deleteMany({ where: { lectureId: { in: lectureIds } } });
          await tx.lecture.deleteMany({ where: { id: { in: lectureIds } } });
        }

        // 과제 → 제출물 → 제출물 파일/댓글
        const assignmentIds = (await tx.assignment.findMany({ where: { courseId: { in: courseIds } }, select: { id: true } })).map(a => a.id);
        if (assignmentIds.length > 0) {
          const submissionIds = (await tx.submission.findMany({ where: { assignmentId: { in: assignmentIds } }, select: { id: true } })).map(s => s.id);
          if (submissionIds.length > 0) {
            await tx.submissionComment.deleteMany({ where: { submissionId: { in: submissionIds } } });
            await tx.submissionFile.deleteMany({ where: { submissionId: { in: submissionIds } } });
            // 자기참조 FK 해제 후 삭제
            await tx.submission.updateMany({ where: { id: { in: submissionIds }, parentId: { not: null } }, data: { parentId: null } });
            await tx.submission.deleteMany({ where: { id: { in: submissionIds } } });
          }
          await tx.assignmentFile.deleteMany({ where: { assignmentId: { in: assignmentIds } } });
          await tx.assignment.deleteMany({ where: { id: { in: assignmentIds } } });
        }

        await tx.course.deleteMany({ where: { id: { in: courseIds } } });
      }

      // 4. 강사 관계 삭제
      await tx.bootcampInstructor.deleteMany({ where: { bootcampId: id } });

      // 5. 부트캠프 삭제
      return tx.bootcamp.delete({ where: { id } });
    });
  }

  async getChildCounts(id: number) {
    const courseIds = (await this.prisma.course.findMany({ where: { bootcampId: id }, select: { id: true } })).map(c => c.id);
    let lectures = 0, assignments = 0;
    if (courseIds.length > 0) {
      lectures = await this.prisma.lecture.count({ where: { courseId: { in: courseIds } } });
      assignments = await this.prisma.assignment.count({ where: { courseId: { in: courseIds } } });
    }
    const applicants = await this.prisma.applicant.count({ where: { bootcampId: id } });
    const notices = await this.prisma.notice.count({ where: { bootcampId: id } });
    return { courses: courseIds.length, lectures, assignments, applicants, notices };
  }

  async getInterviewSettings(id: number) {
    const bootcamp = await this.prisma.bootcamp.findUnique({
      where: { id },
      select: { interviewSettings: true },
    });
    return (bootcamp?.interviewSettings as any[]) || [];
  }

  updateInterviewSettings(id: number, questions: { text: string }[]) {
    return this.prisma.bootcamp.update({
      where: { id },
      data: { interviewSettings: questions as any },
      select: { id: true, interviewSettings: true },
    });
  }

  // ===== 강사 관리 =====

  async findInstructors(bootcampId: number) {
    const records = await this.prisma.bootcampInstructor.findMany({
      where: { bootcampId },
      include: {
        user: {
          select: {
            id: true, email: true, name: true, nickname: true,
            phone: true, role: true, status: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
    return records.map(r => r.user);
  }

  async addInstructor(bootcampId: number, userId: number) {
    return this.prisma.bootcampInstructor.create({
      data: { bootcampId, userId },
      include: {
        user: {
          select: {
            id: true, email: true, name: true, nickname: true,
            phone: true, role: true, status: true,
          },
        },
      },
    });
  }

  async removeInstructor(bootcampId: number, userId: number) {
    return this.prisma.bootcampInstructor.delete({
      where: { bootcampId_userId: { bootcampId, userId } },
    });
  }

  async findBootcampsByInstructor(userId: number) {
    const records = await this.prisma.bootcampInstructor.findMany({
      where: { userId },
      include: {
        bootcamp: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return records.map(r => r.bootcamp);
  }
}
