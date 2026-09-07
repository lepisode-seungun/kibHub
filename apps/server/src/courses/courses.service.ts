import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/generated';
import { CreateCourseDto, CreateLectureDto, CreateAssignmentDto } from '@kibhub/shared';

@Injectable()
export class CoursesService {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  // ===== 과정 =====
  findAllByBootcamp(bootcampId: number, excludeHidden = false) {
    const where: any = { bootcampId };
    if (excludeHidden) {
      where.status = { not: 'HIDDEN' };
    }
    return this.prisma.course.findMany({
      where,
      include: { _count: { select: { lectures: true, assignments: true } } },
      orderBy: { sortOrder: 'asc' },
    });
  }

  findOne(id: number) {
    return this.prisma.course.findUnique({
      where: { id },
      include: {
        lectures: { orderBy: { sortOrder: 'asc' }, include: { files: true } },
        assignments: { orderBy: { createdAt: 'desc' }, include: { files: true } },
      },
    });
  }

  createCourse(bootcampId: number, data: CreateCourseDto) {
    return this.prisma.course.create({ data: { ...data, bootcampId } as Prisma.CourseUncheckedCreateInput });
  }

  updateCourse(id: number, data: Partial<CreateCourseDto>) {
    return this.prisma.course.update({ where: { id }, data: data as Prisma.CourseUpdateInput });
  }

  async deleteCourse(id: number) {
    return this.prisma.$transaction(async (tx) => {
      // 1. 강의 파일 → 강의
      const lectureIds = (await tx.lecture.findMany({ where: { courseId: id }, select: { id: true } })).map(l => l.id);
      if (lectureIds.length > 0) {
        await tx.lectureFile.deleteMany({ where: { lectureId: { in: lectureIds } } });
        await tx.lecture.deleteMany({ where: { id: { in: lectureIds } } });
      }

      // 2. 과제 → 제출물 → 제출 파일/댓글
      const assignmentIds = (await tx.assignment.findMany({ where: { courseId: id }, select: { id: true } })).map(a => a.id);
      if (assignmentIds.length > 0) {
        const submissionIds = (await tx.submission.findMany({ where: { assignmentId: { in: assignmentIds } }, select: { id: true } })).map(s => s.id);
        if (submissionIds.length > 0) {
          await tx.submissionComment.deleteMany({ where: { submissionId: { in: submissionIds } } });
          await tx.submissionFile.deleteMany({ where: { submissionId: { in: submissionIds } } });
          await tx.submission.updateMany({ where: { id: { in: submissionIds }, parentId: { not: null } }, data: { parentId: null } });
          await tx.submission.deleteMany({ where: { id: { in: submissionIds } } });
        }
        await tx.assignmentFile.deleteMany({ where: { assignmentId: { in: assignmentIds } } });
        await tx.assignment.deleteMany({ where: { id: { in: assignmentIds } } });
      }

      // 3. 과정 삭제
      return tx.course.delete({ where: { id } });
    });
  }

  async reorderCourses(bootcampId: number, orderedIds: number[]) {
    console.log('[reorderCourses] bootcampId:', bootcampId, 'orderedIds:', orderedIds);
    try {
      await this.prisma.$transaction(
        orderedIds.map((id, index) =>
          this.prisma.course.update({ where: { id }, data: { sortOrder: index } })
        )
      );
      console.log('[reorderCourses] success');
      return { success: true };
    } catch (e) {
      console.error('[reorderCourses] error:', e);
      throw e;
    }
  }

  // ===== 부트캠프별 강의 카테고리 =====
  async findLectureCategories(bootcampId: number): Promise<string[]> {
    const lectures = await this.prisma.lecture.findMany({
      where: { course: { bootcampId } },
      select: { category: true },
      distinct: ['category'],
    });
    return lectures
      .map(l => l.category)
      .filter(c => c && c.trim() !== '');
  }

  // ===== 강의 =====
  findLectures(courseId: number) {
    return this.prisma.lecture.findMany({
      where: { courseId },
      include: { files: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  findLecture(id: number) {
    return this.prisma.lecture.findUnique({
      where: { id },
      include: { files: true, course: { select: { id: true, name: true, status: true, createdAt: true, bootcampId: true } } },
    });
  }


  createLecture(courseId: number, data: CreateLectureDto) {
    return this.prisma.lecture.create({ data: { ...data, courseId } as Prisma.LectureUncheckedCreateInput });
  }

  updateLecture(id: number, data: Partial<CreateLectureDto>) {
    return this.prisma.lecture.update({ where: { id }, data: data as Prisma.LectureUpdateInput });
  }

  deleteLecture(id: number) {
    return this.prisma.lecture.delete({ where: { id } });
  }

  addLectureFile(lectureId: number, data: { name: string; url: string; size?: number; mimeType?: string }) {
    return this.prisma.lectureFile.create({ data: { ...data, lectureId } });
  }

  deleteLectureFile(fileId: number) {
    return this.prisma.lectureFile.delete({ where: { id: fileId } });
  }

  async reorderLectures(courseId: number, orderedIds: number[]) {
    await this.prisma.$transaction(
      orderedIds.map((id, index) =>
        this.prisma.lecture.update({ where: { id }, data: { sortOrder: index } })
      )
    );
    return { success: true };
  }

  // ===== 과제 =====
  findAssignments(courseId: number) {
    return this.prisma.assignment.findMany({
      where: { courseId },
      include: { files: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  findAssignment(id: number) {
    return this.prisma.assignment.findUnique({
      where: { id },
      include: { files: true, course: { select: { id: true, name: true, status: true, createdAt: true, bootcampId: true } } },
    });
  }


  createAssignment(courseId: number, data: CreateAssignmentDto) {
    const mapped: any = { ...data, courseId };
    if (mapped.dueDate) mapped.dueDate = new Date(mapped.dueDate);
    if (mapped.dueDateEnd) mapped.dueDateEnd = new Date(mapped.dueDateEnd);
    return this.prisma.assignment.create({ data: mapped as Prisma.AssignmentUncheckedCreateInput });
  }

  updateAssignment(id: number, data: Partial<CreateAssignmentDto>) {
    const mapped: any = { ...data };
    if (mapped.dueDate) mapped.dueDate = new Date(mapped.dueDate);
    if (mapped.dueDateEnd) mapped.dueDateEnd = new Date(mapped.dueDateEnd);
    return this.prisma.assignment.update({ where: { id }, data: mapped as Prisma.AssignmentUpdateInput });
  }

  deleteAssignment(id: number) {
    return this.prisma.assignment.delete({ where: { id } });
  }

  addAssignmentFile(assignmentId: number, data: { name: string; url: string; size?: number; mimeType?: string }) {
    return this.prisma.assignmentFile.create({ data: { ...data, assignmentId } });
  }

  deleteAssignmentFile(fileId: number) {
    return this.prisma.assignmentFile.delete({ where: { id: fileId } });
  }

  // ===== 과제 제출 =====
  findSubmissions(assignmentId: number) {
    return this.prisma.submission.findMany({
      where: { assignmentId },
      include: {
        author: { select: { id: true, name: true, nickname: true, role: true } },
        files: true,
        _count: { select: { comments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findSubmission(id: number) {
    return this.prisma.submission.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true, nickname: true, role: true } },
        files: true,
        comments: {
          include: { author: { select: { id: true, name: true, nickname: true, role: true } } },
          orderBy: { createdAt: 'asc' },
        },
        assignment: { select: { id: true, title: true, course: { select: { id: true, name: true } } } },
        _count: { select: { comments: true } },
      },
    });
  }

  createSubmission(assignmentId: number, authorId: number, data: { title: string; content?: string; files?: { name: string; url: string; size?: number; mimeType?: string }[] }) {
    return this.prisma.submission.create({
      data: {
        title: data.title,
        content: data.content || '',
        type: 'SUBMISSION',
        assignmentId,
        authorId,
        files: data.files?.length ? { create: data.files } : undefined,
      },
      include: { author: { select: { id: true, name: true, nickname: true, role: true } }, files: true },
    });
  }

  createFeedback(parentId: number, authorId: number, data: { title: string; content?: string; files?: { name: string; url: string; size?: number; mimeType?: string }[] }) {
    return this.prisma.$transaction(async (tx) => {
      const parent = await tx.submission.findUniqueOrThrow({ where: { id: parentId } });
      return tx.submission.create({
        data: {
          title: data.title,
          content: data.content || '',
          type: 'FEEDBACK',
          assignmentId: parent.assignmentId,
          authorId,
          parentId,
          files: data.files?.length ? { create: data.files } : undefined,
        },
        include: { author: { select: { id: true, name: true, nickname: true, role: true } }, files: true },
      });
    });
  }

  updateSubmission(id: number, data: { title?: string; content?: string }) {
    return this.prisma.submission.update({ where: { id }, data });
  }

  deleteSubmission(id: number) {
    return this.prisma.submission.delete({ where: { id } });
  }

  // ===== 제출 댓글 =====
  findSubmissionComments(submissionId: number) {
    return this.prisma.submissionComment.findMany({
      where: { submissionId },
      include: { author: { select: { id: true, name: true, nickname: true, role: true, profileImage: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  createSubmissionComment(submissionId: number, authorId: number, body: string) {
    return this.prisma.submissionComment.create({
      data: { body, submissionId, authorId },
      include: { author: { select: { id: true, name: true, nickname: true, role: true, profileImage: true } } },
    });
  }

  deleteSubmissionComment(id: number) {
    return this.prisma.submissionComment.delete({ where: { id } });
  }
}
