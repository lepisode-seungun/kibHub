import { Inject, Controller, Get, Post, Patch, Delete, Param, Body, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CoursesService } from './courses.service';
import { AuthGuard } from '../auth/auth.guard';
import { CreateCourseDto, CreateLectureDto, CreateAssignmentDto } from '@kibhub/shared';

@ApiTags('courses')
@Controller()
export class CoursesController {
  constructor(@Inject(CoursesService) private coursesService: CoursesService) {}

  // ===== 과정 =====
  @Get('bootcamps/:bootcampId/courses')
  findAllByBootcamp(@Param('bootcampId', ParseIntPipe) bootcampId: number) {
    return this.coursesService.findAllByBootcamp(bootcampId);
  }

  @Get('courses/:id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.coursesService.findOne(id);
  }

  @Post('bootcamps/:bootcampId/courses')
  @UseGuards(AuthGuard)
  createCourse(@Param('bootcampId', ParseIntPipe) bootcampId: number, @Body() data: CreateCourseDto) {
    return this.coursesService.createCourse(bootcampId, data);
  }

  @Patch('courses/:id')
  @UseGuards(AuthGuard)
  updateCourse(@Param('id', ParseIntPipe) id: number, @Body() data: Partial<CreateCourseDto>) {
    return this.coursesService.updateCourse(id, data);
  }

  @Delete('courses/:id')
  @UseGuards(AuthGuard)
  deleteCourse(@Param('id', ParseIntPipe) id: number) {
    return this.coursesService.deleteCourse(id);
  }

  // ===== 강의 =====
  @Get('courses/:courseId/lectures')
  findLectures(@Param('courseId', ParseIntPipe) courseId: number) {
    return this.coursesService.findLectures(courseId);
  }

  @Get('lectures/:id')
  findLecture(@Param('id', ParseIntPipe) id: number) {
    return this.coursesService.findLecture(id);
  }


  @Post('courses/:courseId/lectures')
  @UseGuards(AuthGuard)
  createLecture(@Param('courseId', ParseIntPipe) courseId: number, @Body() data: CreateLectureDto) {
    return this.coursesService.createLecture(courseId, data);
  }

  @Patch('lectures/:id')
  @UseGuards(AuthGuard)
  updateLecture(@Param('id', ParseIntPipe) id: number, @Body() data: Partial<CreateLectureDto>) {
    return this.coursesService.updateLecture(id, data);
  }

  @Delete('lectures/:id')
  @UseGuards(AuthGuard)
  deleteLecture(@Param('id', ParseIntPipe) id: number) {
    return this.coursesService.deleteLecture(id);
  }

  // ===== 과제 =====
  @Get('courses/:courseId/assignments')
  findAssignments(@Param('courseId', ParseIntPipe) courseId: number) {
    return this.coursesService.findAssignments(courseId);
  }

  @Get('assignments/:id')
  findAssignment(@Param('id', ParseIntPipe) id: number) {
    return this.coursesService.findAssignment(id);
  }


  @Post('courses/:courseId/assignments')
  @UseGuards(AuthGuard)
  createAssignment(@Param('courseId', ParseIntPipe) courseId: number, @Body() data: CreateAssignmentDto) {
    return this.coursesService.createAssignment(courseId, data);
  }

  @Patch('assignments/:id')
  @UseGuards(AuthGuard)
  updateAssignment(@Param('id', ParseIntPipe) id: number, @Body() data: Partial<CreateAssignmentDto>) {
    return this.coursesService.updateAssignment(id, data);
  }

  @Delete('assignments/:id')
  @UseGuards(AuthGuard)
  deleteAssignment(@Param('id', ParseIntPipe) id: number) {
    return this.coursesService.deleteAssignment(id);
  }
}
