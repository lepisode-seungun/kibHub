import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {
  User, Bootcamp, Course, Lecture, Assignment, Applicant,
  Content, ContentCategory, Comment, Report, Portfolio, Banner,
  Notice, Faq, Inquiry,
  CreateBootcampDto, UpdateUserDto, CreateNoticeDto, CreateFaqDto,
  CreatePortfolioDto, CreateContentDto, InquiryReplyDto, CreateReportDto,
  CreateBannerDto, ContentStatus,
} from '../shared/types';

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

  private put<T>(url: string, body: unknown): Promise<T> {
    return firstValueFrom(this.http.put<T>(`${BASE}${url}`, body, { withCredentials: true }));
  }

  // ===== Users =====
  readonly users = {
    findAll: (query?: Record<string, string>): Promise<User[]> => {
      const qs = query ? '?' + new URLSearchParams(query).toString() : '';
      return this.get<User[]>(`/users${qs}`);
    },
    findOne: (id: number): Promise<User> => this.get<User>(`/users/${id}`),
    update: (id: number, data: UpdateUserDto): Promise<User> => this.patch<User>(`/users/${id}`, data),
    block: (id: number, status: 'ACTIVE' | 'BLOCKED'): Promise<User> => this.patch<User>(`/users/${id}/block`, { status }),
    updateRole: (id: number, role: string): Promise<User> => this.patch<User>(`/users/${id}/role`, { role }),
    delete: (id: number): Promise<void> => this.del<void>(`/users/${id}`),
  };

  // ===== Bootcamps =====
  readonly bootcamps = {
    findAll: (query?: Record<string, string>): Promise<Bootcamp[]> => {
      const qs = query ? '?' + new URLSearchParams(query).toString() : '';
      return this.get<Bootcamp[]>(`/bootcamps${qs}`);
    },
    findOne: (id: number): Promise<Bootcamp> => this.get<Bootcamp>(`/bootcamps/${id}`),
    create: (data: CreateBootcampDto): Promise<Bootcamp> => this.post<Bootcamp>('/bootcamps', data),
    update: (id: number, data: Partial<CreateBootcampDto>): Promise<Bootcamp> => this.patch<Bootcamp>(`/bootcamps/${id}`, data),
    delete: (id: number): Promise<void> => this.del<void>(`/bootcamps/${id}`),
  };

  // ===== Courses =====
  readonly courses = {
    findByBootcamp: (bootcampId: number): Promise<Course[]> => this.get<Course[]>(`/bootcamps/${bootcampId}/courses`),
    findOne: (id: number): Promise<Course> => this.get<Course>(`/courses/${id}`),
    create: (bootcampId: number, data: Partial<Course>): Promise<Course> => this.post<Course>(`/bootcamps/${bootcampId}/courses`, data),
    update: (id: number, data: Partial<Course>): Promise<Course> => this.patch<Course>(`/courses/${id}`, data),
    delete: (id: number): Promise<void> => this.del<void>(`/courses/${id}`),
  };

  // ===== Lectures =====
  readonly lectures = {
    findByCourse: (courseId: number): Promise<Lecture[]> => this.get<Lecture[]>(`/courses/${courseId}/lectures`),
    findOne: (id: number): Promise<Lecture> => this.get<Lecture>(`/lectures/${id}`),
    create: (courseId: number, data: Partial<Lecture>): Promise<Lecture> => this.post<Lecture>(`/courses/${courseId}/lectures`, data),
    update: (id: number, data: Partial<Lecture>): Promise<Lecture> => this.patch<Lecture>(`/lectures/${id}`, data),
    delete: (id: number): Promise<void> => this.del<void>(`/lectures/${id}`),
  };

  // ===== Assignments =====
  readonly assignments = {
    findByCourse: (courseId: number): Promise<Assignment[]> => this.get<Assignment[]>(`/courses/${courseId}/assignments`),
    findOne: (id: number): Promise<Assignment> => this.get<Assignment>(`/assignments/${id}`),
    create: (courseId: number, data: Partial<Assignment>): Promise<Assignment> => this.post<Assignment>(`/courses/${courseId}/assignments`, data),
    update: (id: number, data: Partial<Assignment>): Promise<Assignment> => this.patch<Assignment>(`/assignments/${id}`, data),
    delete: (id: number): Promise<void> => this.del<void>(`/assignments/${id}`),
  };

  // ===== Applicants =====
  readonly applicants = {
    findByBootcamp: (bootcampId: number): Promise<Applicant[]> => this.get<Applicant[]>(`/bootcamps/${bootcampId}/applicants`),
    findOne: (id: number): Promise<Applicant> => this.get<Applicant>(`/applicants/${id}`),
    updateStatus: (id: number, status: string): Promise<Applicant> => this.patch<Applicant>(`/applicants/${id}/status`, { status }),
    bulkUpdateStatus: (ids: number[], status: string): Promise<void> => this.patch<void>('/applicants/bulk-status', { ids, status }),
  };

  // ===== Contents =====
  readonly contents = {
    findAll: (query?: Record<string, string>): Promise<Content[]> => {
      const qs = query ? '?' + new URLSearchParams(query).toString() : '';
      return this.get<Content[]>(`/contents${qs}`);
    },
    findOne: (id: number): Promise<Content> => this.get<Content>(`/contents/${id}`),
    create: (data: CreateContentDto): Promise<Content> => this.post<Content>('/contents', data),
    update: (id: number, data: Partial<CreateContentDto>): Promise<Content> => this.patch<Content>(`/contents/${id}`, data),
    delete: (id: number): Promise<void> => this.del<void>(`/contents/${id}`),
  };

  // ===== Content Categories =====
  readonly contentCategories = {
    findAll: (): Promise<ContentCategory[]> => this.get<ContentCategory[]>('/content-categories'),
    create: (data: { name: string }): Promise<ContentCategory> => this.post<ContentCategory>('/content-categories', data),
    update: (id: number, data: { name: string }): Promise<ContentCategory> => this.patch<ContentCategory>(`/content-categories/${id}`, data),
    delete: (id: number): Promise<void> => this.del<void>(`/content-categories/${id}`),
  };

  // ===== Comments =====
  readonly comments = {
    findByContent: (contentId: number): Promise<Comment[]> => this.get<Comment[]>(`/contents/${contentId}/comments`),
    create: (contentId: number, data: { body: string }): Promise<Comment> => this.post<Comment>(`/contents/${contentId}/comments`, data),
    update: (id: number, data: { body?: string; status?: ContentStatus }): Promise<Comment> => this.patch<Comment>(`/comments/${id}`, data),
    delete: (id: number): Promise<void> => this.del<void>(`/comments/${id}`),
  };

  // ===== Reports =====
  readonly reports = {
    findAll: (query?: Record<string, string>): Promise<Report[]> => {
      const qs = query ? '?' + new URLSearchParams(query).toString() : '';
      return this.get<Report[]>(`/reports${qs}`);
    },
    create: (data: CreateReportDto): Promise<Report> => this.post<Report>('/reports', data),
  };

  // ===== Portfolios =====
  readonly portfolios = {
    findAll: (query?: Record<string, string>): Promise<Portfolio[]> => {
      const qs = query ? '?' + new URLSearchParams(query).toString() : '';
      return this.get<Portfolio[]>(`/portfolios${qs}`);
    },
    findHallOfFame: (): Promise<Portfolio[]> => this.get<Portfolio[]>('/portfolios/hall-of-fame'),
    findOne: (id: number): Promise<Portfolio> => this.get<Portfolio>(`/portfolios/${id}`),
    create: (data: CreatePortfolioDto): Promise<Portfolio> => this.post<Portfolio>('/portfolios', data),
    update: (id: number, data: Partial<CreatePortfolioDto>): Promise<Portfolio> => this.patch<Portfolio>(`/portfolios/${id}`, data),
    delete: (id: number): Promise<void> => this.del<void>(`/portfolios/${id}`),
  };

  // ===== Banners =====
  readonly banners = {
    findAll: (): Promise<Banner[]> => this.get<Banner[]>('/banners'),
    findVisible: (): Promise<Banner[]> => this.get<Banner[]>('/banners/visible'),
    findOne: (id: number): Promise<Banner> => this.get<Banner>(`/banners/${id}`),
    create: (data: CreateBannerDto): Promise<Banner> => this.post<Banner>('/banners', data),
    update: (id: number, data: Partial<CreateBannerDto>): Promise<Banner> => this.patch<Banner>(`/banners/${id}`, data),
    delete: (id: number): Promise<void> => this.del<void>(`/banners/${id}`),
  };

  // ===== Notices =====
  readonly notices = {
    findAll: (query?: Record<string, string>): Promise<Notice[]> => {
      const qs = query ? '?' + new URLSearchParams(query).toString() : '';
      return this.get<Notice[]>(`/notices${qs}`);
    },
    findByBootcamp: (bootcampId: number): Promise<Notice[]> => this.get<Notice[]>(`/bootcamps/${bootcampId}/notices`),
    findOne: (id: number): Promise<Notice> => this.get<Notice>(`/notices/${id}`),
    create: (data: CreateNoticeDto): Promise<Notice> => this.post<Notice>('/notices', data),
    createForBootcamp: (bootcampId: number, data: CreateNoticeDto): Promise<Notice> => this.post<Notice>(`/bootcamps/${bootcampId}/notices`, data),
    update: (id: number, data: Partial<CreateNoticeDto & { pinned: boolean }>): Promise<Notice> => this.patch<Notice>(`/notices/${id}`, data),
    delete: (id: number): Promise<void> => this.del<void>(`/notices/${id}`),
  };

  // ===== FAQs =====
  readonly faqs = {
    findAll: (query?: Record<string, string>): Promise<Faq[]> => {
      const qs = query ? '?' + new URLSearchParams(query).toString() : '';
      return this.get<Faq[]>(`/faqs${qs}`);
    },
    findOne: (id: number): Promise<Faq> => this.get<Faq>(`/faqs/${id}`),
    create: (data: CreateFaqDto): Promise<Faq> => this.post<Faq>('/faqs', data),
    update: (id: number, data: Partial<CreateFaqDto>): Promise<Faq> => this.patch<Faq>(`/faqs/${id}`, data),
    delete: (id: number): Promise<void> => this.del<void>(`/faqs/${id}`),
  };

  // ===== Inquiries =====
  readonly inquiries = {
    findAll: (query?: Record<string, string>): Promise<Inquiry[]> => {
      const qs = query ? '?' + new URLSearchParams(query).toString() : '';
      return this.get<Inquiry[]>(`/inquiries${qs}`);
    },
    findOne: (id: number): Promise<Inquiry> => this.get<Inquiry>(`/inquiries/${id}`),
    create: (data: { title: string; body: string }): Promise<Inquiry> => this.post<Inquiry>('/inquiries', data),
    update: (id: number, data: Partial<Inquiry>): Promise<Inquiry> => this.patch<Inquiry>(`/inquiries/${id}`, data),
    reply: (id: number, data: InquiryReplyDto): Promise<Inquiry> => this.post<Inquiry>(`/inquiries/${id}/reply`, data),
    delete: (id: number): Promise<void> => this.del<void>(`/inquiries/${id}`),
  };

  // ===== Auth =====
  readonly auth = {
    login: (data: { email: string; password: string }): Promise<{ token: string; user: User }> =>
      this.post('/auth/login', data),
    me: (): Promise<User> => this.get<User>('/auth/me'),
    logout: (): Promise<{ message: string }> => this.post('/auth/logout', {}),
  };

  // ===== Dashboard Stats =====
  readonly dashboard = {
    stats: (): Promise<{ users: number; bootcamps: number; contents: number; inquiries: number }> =>
      this.get('/dashboard/stats'),
  };

  // ===== Upload =====
  readonly upload = {
    /** 단일 파일 업로드 */
    single: (file: File, folder = 'general'): Promise<{ url: string; path: string; originalName: string; size: number; mimeType: string }> => {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', folder);
      return firstValueFrom(this.http.post<{ url: string; path: string; originalName: string; size: number; mimeType: string }>(
        `${BASE}/upload`, fd, { withCredentials: true },
      ));
    },
    /** 다중 파일 업로드 */
    multiple: (files: File[], folder = 'general'): Promise<{ url: string; path: string; originalName: string; size: number; mimeType: string }[]> => {
      const fd = new FormData();
      files.forEach(f => fd.append('files', f));
      fd.append('folder', folder);
      return firstValueFrom(this.http.post<{ url: string; path: string; originalName: string; size: number; mimeType: string }[]>(
        `${BASE}/upload/multiple`, fd, { withCredentials: true },
      ));
    },
    /** 파일 삭제 */
    delete: (path: string): Promise<{ success: boolean }> =>
      this.del(`/upload?path=${encodeURIComponent(path)}`),
  };

  // ===== Site Settings =====
  readonly siteSettings = {
    get: (key: string): Promise<{ key: string; value: string }> => this.get(`/site-settings/${key}`),
    set: (key: string, value: string): Promise<{ key: string; value: string }> => this.put(`/site-settings/${key}`, { value }),
  };
}
