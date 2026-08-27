import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {
  User, Bootcamp, Course, Lecture, Assignment, Applicant,
  Content, Comment, Report, Portfolio, Notice, Faq, Inquiry,
  CreateContentDto, CreateReportDto, UpdateUserDto,
} from '@kibhub/shared';

const BASE = '/api';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);

  private get<T>(url: string): Promise<T> {
    return firstValueFrom(this.http.get<T>(`${BASE}${url}`, { withCredentials: true }));
  }

  private post<T>(url: string, body: unknown): Promise<T> {
    return firstValueFrom(this.http.post<T>(`${BASE}${url}`, body, { withCredentials: true }));
  }

  private patch<T>(url: string, body: unknown): Promise<T> {
    return firstValueFrom(this.http.patch<T>(`${BASE}${url}`, body, { withCredentials: true }));
  }

  private del<T>(url: string): Promise<T> {
    return firstValueFrom(this.http.delete<T>(`${BASE}${url}`, { withCredentials: true }));
  }

  // ===== Bootcamps =====
  readonly bootcamps = {
    findAll: (): Promise<Bootcamp[]> => this.get<Bootcamp[]>('/bootcamps'),
    findOne: (id: number): Promise<Bootcamp> => this.get<Bootcamp>(`/bootcamps/${id}`),
  };

  // ===== Courses =====
  readonly courses = {
    findByBootcamp: (bootcampId: number): Promise<Course[]> => this.get<Course[]>(`/bootcamps/${bootcampId}/courses`),
    findOne: (id: number): Promise<Course> => this.get<Course>(`/courses/${id}`),
  };

  // ===== Lectures =====
  readonly lectures = {
    findByCourse: (courseId: number): Promise<Lecture[]> => this.get<Lecture[]>(`/courses/${courseId}/lectures`),
  };

  // ===== Assignments =====
  readonly assignments = {
    findByCourse: (courseId: number): Promise<Assignment[]> => this.get<Assignment[]>(`/courses/${courseId}/assignments`),
  };

  // ===== Applicants =====
  readonly applicants = {
    apply: (bootcampId: number): Promise<Applicant> => this.post<Applicant>(`/bootcamps/${bootcampId}/applicants`, {}),
  };

  // ===== Contents =====
  readonly contents = {
    findAll: (query?: Record<string, string>): Promise<Content[]> => {
      const qs = query ? '?' + new URLSearchParams(query).toString() : '';
      return this.get<Content[]>(`/contents${qs}`);
    },
    findOne: (id: number): Promise<Content> => this.get<Content>(`/contents/${id}`),
    create: (data: CreateContentDto): Promise<Content> => this.post<Content>('/contents', data),
  };

  // ===== Portfolios =====
  readonly portfolios = {
    findAll: (query?: Record<string, string>): Promise<Portfolio[]> => {
      const qs = query ? '?' + new URLSearchParams(query).toString() : '';
      return this.get<Portfolio[]>(`/portfolios${qs}`);
    },
    findHallOfFame: (): Promise<Portfolio[]> => this.get<Portfolio[]>('/portfolios/hall-of-fame'),
    findOne: (id: number): Promise<Portfolio> => this.get<Portfolio>(`/portfolios/${id}`),
  };

  // ===== Notices =====
  readonly notices = {
    findAll: (query?: Record<string, string>): Promise<Notice[]> => {
      const qs = query ? '?' + new URLSearchParams(query).toString() : '';
      return this.get<Notice[]>(`/notices${qs}`);
    },
    findOne: (id: number): Promise<Notice> => this.get<Notice>(`/notices/${id}`),
  };

  // ===== FAQs =====
  readonly faqs = {
    findAll: (): Promise<Faq[]> => this.get<Faq[]>('/faqs'),
  };

  // ===== Inquiries =====
  readonly inquiries = {
    findAll: (): Promise<Inquiry[]> => this.get<Inquiry[]>('/inquiries'),
    findOne: (id: number): Promise<Inquiry> => this.get<Inquiry>(`/inquiries/${id}`),
    create: (data: { title: string; body: string }): Promise<Inquiry> => this.post<Inquiry>('/inquiries', data),
  };

  // ===== Users (profile) =====
  readonly users = {
    me: (): Promise<User> => this.get<User>('/auth/me'),
    findOne: (id: number): Promise<User> => this.get<User>(`/users/${id}`),
    update: (id: number, data: UpdateUserDto): Promise<User> => this.patch<User>(`/users/${id}`, data),
  };

  // ===== Comments =====
  readonly comments = {
    findByContent: (contentId: number): Promise<Comment[]> => this.get<Comment[]>(`/contents/${contentId}/comments`),
    create: (contentId: number, data: { body: string }): Promise<Comment> => this.post<Comment>(`/contents/${contentId}/comments`, data),
  };

  // ===== Reports =====
  readonly reports = {
    create: (data: CreateReportDto): Promise<Report> => this.post<Report>('/reports', data),
  };
}
