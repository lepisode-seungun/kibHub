import { BootcampStatus, ApplicantStatus, CourseStatus } from './enums';
import { User } from './user.types';

// ===== Bootcamp =====

export interface Bootcamp {
  id: number;
  name: string;
  status: BootcampStatus;
  instructorName: string;
  description: string;
  thumbnail: string | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt?: string;
  applicants?: Applicant[];
  courses?: Course[];
}

export interface CreateBootcampDto {
  name: string;
  instructorName?: string;
  description?: string;
  startDate?: Date | string;
  endDate?: Date | string;
}

// ===== Applicant =====

export interface Applicant {
  id: number;
  status: ApplicantStatus;
  userId: number;
  user?: User;
  bootcampId: number;
  bootcamp?: Bootcamp;
  createdAt: string;
}

// ===== Course =====

export interface Course {
  id: number;
  name: string;
  status: CourseStatus;
  sortOrder: number;
  bootcampId: number;
  bootcamp?: Bootcamp;
  createdAt: string;
  updatedAt?: string;
  lectures?: Lecture[];
  assignments?: Assignment[];
}

// ===== Lecture =====

export interface LectureFile {
  id: number;
  name: string;
  url: string;
  size: number;
  mimeType: string;
  lectureId: number;
  createdAt: string;
}

export interface Lecture {
  id: number;
  title: string;
  content: string;
  sortOrder: number;
  courseId: number;
  course?: Course;
  createdAt: string;
  updatedAt?: string;
  files?: LectureFile[];
}

// ===== Assignment =====

export interface AssignmentFile {
  id: number;
  name: string;
  url: string;
  size: number;
  mimeType: string;
  assignmentId: number;
  createdAt: string;
}

export interface Assignment {
  id: number;
  title: string;
  content: string;
  dueDate: string | null;
  courseId: number;
  course?: Course;
  createdAt: string;
  updatedAt?: string;
  files?: AssignmentFile[];
}

// ===== Create DTOs =====

export interface CreateCourseDto {
  name: string;
  status?: CourseStatus | string;
  sortOrder?: number;
}

export interface CreateLectureDto {
  title: string;
  content?: string;
  sortOrder?: number;
}

export interface CreateAssignmentDto {
  title: string;
  content?: string;
  dueDate?: string;
}
