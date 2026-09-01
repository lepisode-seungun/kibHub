import { Inject, Controller, Get, Post, Patch, Delete, Param, Body, ParseIntPipe, UseGuards, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CoursesService } from './courses.service';
import { AuthGuard } from '../auth/auth.guard';
import { CreateCourseDto, CreateLectureDto, CreateAssignmentDto } from '@kibhub/shared';
import { Request } from 'express';

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

  @Post('lectures/:lectureId/files')
  @UseGuards(AuthGuard)
  addLectureFile(
    @Param('lectureId', ParseIntPipe) lectureId: number,
    @Body() data: { name: string; url: string; size?: number; mimeType?: string },
  ) {
    return this.coursesService.addLectureFile(lectureId, data);
  }

  @Delete('lecture-files/:id')
  @UseGuards(AuthGuard)
  deleteLectureFile(@Param('id', ParseIntPipe) id: number) {
    return this.coursesService.deleteLectureFile(id);
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

  @Post('assignments/:assignmentId/files')
  @UseGuards(AuthGuard)
  addAssignmentFile(
    @Param('assignmentId', ParseIntPipe) assignmentId: number,
    @Body() data: { name: string; url: string; size?: number; mimeType?: string },
  ) {
    return this.coursesService.addAssignmentFile(assignmentId, data);
  }

  @Delete('assignment-files/:id')
  @UseGuards(AuthGuard)
  deleteAssignmentFile(@Param('id', ParseIntPipe) id: number) {
    return this.coursesService.deleteAssignmentFile(id);
  }

  // ===== 과제 제출 =====
  @Get('assignments/:assignmentId/submissions')
  findSubmissions(@Param('assignmentId', ParseIntPipe) assignmentId: number) {
    return this.coursesService.findSubmissions(assignmentId);
  }

  @Get('submissions/:id')
  findSubmission(@Param('id', ParseIntPipe) id: number) {
    return this.coursesService.findSubmission(id);
  }

  @Post('assignments/:assignmentId/submissions')
  @UseGuards(AuthGuard)
  createSubmission(
    @Param('assignmentId', ParseIntPipe) assignmentId: number,
    @Req() req: Request & { userId: number },
    @Body() data: { title: string; content?: string; files?: { name: string; url: string; size?: number; mimeType?: string }[] },
  ) {
    return this.coursesService.createSubmission(assignmentId, req.userId, data);
  }

  @Post('submissions/:parentId/feedback')
  @UseGuards(AuthGuard)
  createFeedback(
    @Param('parentId', ParseIntPipe) parentId: number,
    @Req() req: Request & { userId: number },
    @Body() data: { title: string; content?: string; files?: { name: string; url: string; size?: number; mimeType?: string }[] },
  ) {
    return this.coursesService.createFeedback(parentId, req.userId, data);
  }

  @Patch('submissions/:id')
  @UseGuards(AuthGuard)
  updateSubmission(@Param('id', ParseIntPipe) id: number, @Body() data: { title?: string; content?: string }) {
    return this.coursesService.updateSubmission(id, data);
  }

  @Delete('submissions/:id')
  @UseGuards(AuthGuard)
  deleteSubmission(@Param('id', ParseIntPipe) id: number) {
    return this.coursesService.deleteSubmission(id);
  }

  // ===== 제출 댓글 =====
  @Get('submissions/:submissionId/comments')
  findSubmissionComments(@Param('submissionId', ParseIntPipe) submissionId: number) {
    return this.coursesService.findSubmissionComments(submissionId);
  }

  @Post('submissions/:submissionId/comments')
  @UseGuards(AuthGuard)
  createSubmissionComment(
    @Param('submissionId', ParseIntPipe) submissionId: number,
    @Req() req: Request & { userId: number },
    @Body() data: { body: string },
  ) {
    return this.coursesService.createSubmissionComment(submissionId, req.userId, data.body);
  }

  @Delete('submission-comments/:id')
  @UseGuards(AuthGuard)
  deleteSubmissionComment(@Param('id', ParseIntPipe) id: number) {
    return this.coursesService.deleteSubmissionComment(id);
  }
}
