import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../../../../prisma/generated/prisma/client';
import { CreateCourseDto, CreateLectureDto, CreateAssignmentDto } from '@kibhub/shared';

@Injectable()
export class CoursesService {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  // ===== 과정 =====
  findAllByBootcamp(bootcampId: number) {
    return this.prisma.course.findMany({
      where: { bootcampId },
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

  deleteCourse(id: number) {
    return this.prisma.course.delete({ where: { id } });
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
      include: { files: true, course: { select: { id: true, title: true, bootcampId: true } } },
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
      include: { files: true, course: { select: { id: true, title: true, bootcampId: true } } },
    });
  }


  createAssignment(courseId: number, data: CreateAssignmentDto) {
    return this.prisma.assignment.create({ data: { ...data, courseId } as Prisma.AssignmentUncheckedCreateInput });
  }

  updateAssignment(id: number, data: Partial<CreateAssignmentDto>) {
    return this.prisma.assignment.update({ where: { id }, data: data as Prisma.AssignmentUpdateInput });
  }

  deleteAssignment(id: number) {
    return this.prisma.assignment.delete({ where: { id } });
  }
}
