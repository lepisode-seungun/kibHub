import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  // ===== 과정 =====
  findAllByBootcamp(bootcampId: number) {
    return this.prisma.course.findMany({
      where: { bootcampId },
      include: {
        _count: { select: { lectures: true, assignments: true } },
      },
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

  createCourse(bootcampId: number, data: any) {
    return this.prisma.course.create({ data: { ...data, bootcampId } });
  }

  updateCourse(id: number, data: any) {
    return this.prisma.course.update({ where: { id }, data });
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

  createLecture(courseId: number, data: any) {
    return this.prisma.lecture.create({ data: { ...data, courseId } });
  }

  updateLecture(id: number, data: any) {
    return this.prisma.lecture.update({ where: { id }, data });
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

  createAssignment(courseId: number, data: any) {
    return this.prisma.assignment.create({ data: { ...data, courseId } });
  }

  updateAssignment(id: number, data: any) {
    return this.prisma.assignment.update({ where: { id }, data });
  }

  deleteAssignment(id: number) {
    return this.prisma.assignment.delete({ where: { id } });
  }
}
