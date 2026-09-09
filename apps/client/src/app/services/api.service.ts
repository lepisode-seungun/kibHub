import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {
  User, Bootcamp, Course, Lecture, Assignment, Applicant,
  Content, ContentCategory, Comment, Report, Portfolio, Banner, Notice, Faq, Inquiry,
  CreateContentDto, CreateReportDto, UpdateUserDto,
} from '@kibhub/shared';

interface Submission {
  id: number;
  title?: string;
  content?: string;
  type?: string;
  createdAt?: string;
  authorId?: number;
  author?: { name?: string; nickname?: string; role?: string; profileImage?: string };
  files?: { id?: number; name: string; url: string; size?: number; mimeType?: string }[];
  assignment?: { id: number; course?: { name?: string } };
  _count?: { comments?: number };
}

interface SubmissionComment {
  id: number;
  body: string;
  createdAt: string;
  author?: { name?: string; nickname?: string; role?: string; profileImage?: string };
}

interface ServerNotification {
  id: number;
  type?: string;
  title?: string;
  body?: string;
  read?: boolean;
  createdAt?: string;
}

interface Poster {
  id: number;
  title?: string;
  imageUrl?: string;
  order?: number;
}

interface HistoryItem {
  id: number;
  title: string;
  description: string | null;
  period: string;
  date?: string;
}

interface Partner {
  id: number;
  name: string;
  logoUrl: string;
  link: string;
  order?: number;
}

interface Album {
  id: number;
  name: string;
  type?: 'ALBUM' | 'BOOKMARK';
  contents?: Content[];
  albumContents?: {
    id: number;
    contentId: number;
    content?: {
      id: number;
      title?: string;
      thumbnail?: string;
      createdAt?: string;
      author?: { nickname?: string; name?: string };
      _count?: { comments?: number };
      comments?: { body: string; author?: { nickname?: string; name?: string } }[];
    };
  }[];
  _count?: { contents?: number; albumContents?: number };
}

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

  private delWithBody<T>(url: string, body: unknown): Promise<T> {
    return firstValueFrom(this.http.delete<T>(`${BASE}${url}`, { withCredentials: true, body }));
  }

  // ===== Bootcamps =====
  readonly bootcamps = {
    findAll: (): Promise<Bootcamp[]> => this.get<Bootcamp[]>('/bootcamps'),
    findPaged: (page: number, limit: number): Promise<{ data: Bootcamp[]; meta: { total: number; page: number; limit: number; totalPages: number } }> =>
      this.get(`/bootcamps?page=${page}&limit=${limit}`),
    findOne: (id: number): Promise<Bootcamp> => this.get<Bootcamp>(`/bootcamps/${id}`),
    getInterviewSettings: (id: number): Promise<{ text: string }[]> => this.get(`/bootcamps/${id}/interview-settings`),
    findByInstructor: (userId: number): Promise<Bootcamp[]> => this.get<Bootcamp[]>(`/bootcamps/instructor/${userId}`),
  };

  // ===== Courses =====
  readonly courses = {
    findByBootcamp: (bootcampId: number): Promise<Course[]> => this.get<Course[]>(`/bootcamps/${bootcampId}/courses?excludeHidden=true`),
    findOne: (id: number): Promise<Course> => this.get<Course>(`/courses/${id}`),
  };

  // ===== Lectures =====
  readonly lectures = {
    findByCourse: (courseId: number): Promise<Lecture[]> => this.get<Lecture[]>(`/courses/${courseId}/lectures`),
    findOne: (id: number): Promise<Lecture> => this.get<Lecture>(`/lectures/${id}`),
    findCategories: (bootcampId: number): Promise<string[]> => this.get<string[]>(`/bootcamps/${bootcampId}/lecture-categories`),
  };

  // ===== Assignments =====
  readonly assignments = {
    findByCourse: (courseId: number): Promise<Assignment[]> => this.get<Assignment[]>(`/courses/${courseId}/assignments`),
    findOne: (id: number): Promise<Assignment> => this.get<Assignment>(`/assignments/${id}`),
  };

  // ===== Submissions =====
  readonly submissions = {
    findByAssignment: (assignmentId: number): Promise<Submission[]> => this.get<Submission[]>(`/assignments/${assignmentId}/submissions`),
    findOne: (id: number): Promise<Submission> => this.get<Submission>(`/submissions/${id}`),
    create: (assignmentId: number, data: { title: string; content?: string; files?: { name: string; url: string; size?: number; mimeType?: string }[] }): Promise<Submission> =>
      this.post<Submission>(`/assignments/${assignmentId}/submissions`, data),
    createFeedback: (parentId: number, data: { title: string; content?: string; files?: { name: string; url: string; size?: number; mimeType?: string }[] }): Promise<Submission> =>
      this.post<Submission>(`/submissions/${parentId}/feedback`, data),
    update: (id: number, data: { title?: string; content?: string; files?: { name: string; url: string; size?: number; mimeType?: string }[] }): Promise<Submission> => this.patch<Submission>(`/submissions/${id}`, data),
    delete: (id: number): Promise<void> => this.del<void>(`/submissions/${id}`),
  };

  // ===== Submission Comments =====
  readonly submissionComments = {
    findBySubmission: (submissionId: number): Promise<SubmissionComment[]> => this.get<SubmissionComment[]>(`/submissions/${submissionId}/comments`),
    create: (submissionId: number, data: { body: string }): Promise<SubmissionComment> => this.post<SubmissionComment>(`/submissions/${submissionId}/comments`, data),
    delete: (id: number): Promise<void> => this.del<void>(`/submission-comments/${id}`),
  };

  // ===== Applicants =====
  readonly applicants = {
    apply: (bootcampId: number, data: {
      applicantName: string;
      phone?: string;
      email?: string;
      address?: string;
      portfolioUrl?: string;
      portfolioFiles?: { url: string; originalName: string; size: number }[];
      motivation?: string;
    }): Promise<Applicant> => this.post<Applicant>(`/bootcamps/${bootcampId}/applicants`, data),
    findByUser: (userId: number): Promise<Applicant[]> => this.get<Applicant[]>(`/users/${userId}/applicants`),
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

  // ===== Content Categories =====
  readonly contentCategories = {
    findAll: (): Promise<ContentCategory[]> => this.get<ContentCategory[]>('/content-categories'),
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

  // ===== Banners =====
  readonly banners = {
    findVisible: (): Promise<Banner[]> => this.get<Banner[]>('/banners/visible'),
  };

  // ===== Notices =====
  readonly notices = {
    findAll: (query?: Record<string, string>): Promise<Notice[]> => {
      const params = { ...query, excludeHidden: 'true' };
      const qs = '?' + new URLSearchParams(params).toString();
      return this.get<Notice[]>(`/notices${qs}`);
    },
    findByBootcamp: (bootcampId: number): Promise<Notice[]> => this.get<Notice[]>(`/bootcamps/${bootcampId}/notices?excludeHidden=true`),
    findOne: (id: number): Promise<Notice> => this.get<Notice>(`/notices/${id}`),
  };

  // ===== FAQs =====
  readonly faqs = {
    findAll: (): Promise<Faq[]> => this.get<Faq[]>('/faqs'),
  };

  // ===== Inquiries =====
  readonly inquiries = {
    findAll: (query?: { authorId?: number }): Promise<Inquiry[]> => {
      const params = query?.authorId ? `?authorId=${query.authorId}` : '';
      return this.get<Inquiry[]>(`/inquiries${params}`);
    },
    findOne: (id: number): Promise<Inquiry> => this.get<Inquiry>(`/inquiries/${id}`),
    create: (data: { title: string; body: string; files?: { name: string; url: string; size: number; mimeType: string }[] }): Promise<Inquiry> => this.post<Inquiry>('/inquiries', data),
  };

  // ===== Upload =====
  async uploadFile(file: File, folder = 'inquiries'): Promise<{ url: string; originalName: string; size: number; mimeType: string }> {
    const formData = new FormData();
    formData.append('file', file, encodeURIComponent(file.name));
    formData.append('folder', folder);
    return firstValueFrom(this.http.post<{ url: string; originalName: string; size: number; mimeType: string }>(`${BASE}/upload`, formData, { withCredentials: true }));
  }

  // ===== Users (profile) =====
  readonly users = {
    me: async (): Promise<User> => {
      const res = await this.get<{ user: User }>('/auth/me');
      return res.user;
    },
    findOne: (id: number): Promise<User> => this.get<User>(`/users/${id}`),
    update: (id: number, data: UpdateUserDto): Promise<User> => this.patch<User>(`/users/${id}`, data),
    contents: (id: number): Promise<unknown[]> => this.get<unknown[]>(`/users/${id}/contents`),
    albums: (id: number, type?: 'ALBUM' | 'BOOKMARK'): Promise<unknown[]> =>
      this.get<unknown[]>(`/users/${id}/albums${type ? '?type=' + type : ''}`),
    commentStats: (id: number): Promise<{ feedbackCount: number; generalCount: number; receivedLikes: number }> =>
      this.get(`/users/${id}/comment-stats`),
    toggleFollow: (id: number, userId: number): Promise<{ followed: boolean }> =>
      this.post(`/users/${id}/follow`, { userId }),
    followStatus: (id: number, userId: number): Promise<{ isFollowing: boolean }> =>
      this.get(`/users/${id}/follow-status?userId=${userId}`),
    followCounts: (id: number): Promise<{ followerCount: number; followingCount: number }> =>
      this.get(`/users/${id}/follow-counts`),
    followers: (id: number): Promise<{ id: number; nickname: string; profileImage: string | null }[]> =>
      this.get(`/users/${id}/followers`),
    following: (id: number): Promise<{ id: number; nickname: string; profileImage: string | null }[]> =>
      this.get(`/users/${id}/following`),
  };

  // ===== Comments =====
  readonly comments = {
    findByContent: (contentId: number): Promise<Comment[]> => this.get<Comment[]>(`/contents/${contentId}/comments`),
    findRecent: (take = 10): Promise<Comment[]> => this.get<Comment[]>(`/comments/recent?take=${take}`),
    findBest: (take = 10): Promise<Comment[]> => this.get<Comment[]>(`/comments/best?take=${take}`),
    create: (contentId: number, data: { body: string; images?: string[]; parentId?: number; type?: string; markerNum?: number; markerTop?: number; markerLeft?: number; markerImageIndex?: number }): Promise<Comment> => this.post<Comment>(`/contents/${contentId}/comments`, data),
    update: (id: number, data: { body?: string }): Promise<Comment> => this.patch<Comment>(`/comments/${id}`, data),
    delete: (id: number): Promise<void> => this.del<void>(`/comments/${id}`),
    toggleLike: (id: number): Promise<{ liked: boolean; likeCount: number }> => this.post(`/comments/${id}/like`, {}),
  };

  // ===== Reports =====
  readonly reports = {
    create: (data: CreateReportDto): Promise<Report> => this.post<Report>('/reports', data),
  };

  // ===== Auth =====
  readonly auth = {
    login: (data: { email: string; password: string }): Promise<{ token: string; user: User }> =>
      this.post('/auth/login', data),
    signup: (data: { email: string; password: string; name: string; nickname: string; phone?: string }): Promise<User> =>
      this.post('/auth/signup', data),
    me: (): Promise<User> => this.get<User>('/auth/me'),
    findEmail: (data: { phone: string; birthday: string }): Promise<{ emails: string[] }> =>
      this.post('/auth/find-email', data),
    checkEmail: (data: { email: string }): Promise<{ available: boolean }> =>
      this.post('/auth/check-email', data),
    resetPassword: (data: { email: string }): Promise<{ message: string }> =>
      this.post('/auth/reset-password', data),
    confirmResetPassword: (data: { token: string; newPassword: string }): Promise<{ message: string }> =>
      this.post('/auth/confirm-reset-password', data),
    sendVerification: (data: { email: string }): Promise<{ message: string }> =>
      this.post('/auth/send-verification', data),
    verifyCode: (data: { email: string; code: string }): Promise<{ verified: boolean }> =>
      this.post('/auth/verify-code', data),
    changeEmail: (data: { newEmail: string }): Promise<{ message: string }> =>
      this.post('/auth/change-email', data),
    changePassword: (data: { currentPassword: string; newPassword: string }): Promise<{ message: string }> =>
      this.post('/auth/change-password', data),
    withdraw: (data: { password: string; reason?: string }): Promise<{ message: string }> =>
      this.post('/auth/withdraw', data),
    logout: (): Promise<{ message: string }> => this.post('/auth/logout', {}),
  };

  // ===== Search =====
  readonly search = {
    query: (keyword: string): Promise<{ contents: Content[]; portfolios: Portfolio[] }> =>
      this.get(`/search?q=${encodeURIComponent(keyword)}`),
  };

  // ===== Notifications =====
  readonly notifications = {
    findAll: (): Promise<ServerNotification[]> => this.get<ServerNotification[]>('/notifications'),
    unreadCount: (): Promise<{ count: number }> => this.get('/notifications/unread-count'),
    markRead: (ids: number[]): Promise<void> => this.patch<void>('/notifications/read', { ids }),
    markAllRead: (): Promise<void> => this.patch<void>('/notifications/read-all', {}),
    deleteMany: (ids: number[]): Promise<void> => this.delWithBody<void>('/notifications', { ids }),
  };

  // ===== Upload =====
  readonly upload = {
    /** 단일 파일 업로드 */
    single: (file: File, folder = 'general'): Promise<{ url: string; path: string; originalName: string; size: number; mimeType: string }> => {
      const fd = new FormData();
      fd.append('file', file, encodeURIComponent(file.name));
      fd.append('folder', folder);
      return firstValueFrom(this.http.post<{ url: string; path: string; originalName: string; size: number; mimeType: string }>(
        `${BASE}/upload`, fd, { withCredentials: true },
      ));
    },
    /** 다중 파일 업로드 */
    multiple: (files: File[], folder = 'general'): Promise<{ url: string; path: string; originalName: string; size: number; mimeType: string }[]> => {
      const fd = new FormData();
      files.forEach(f => fd.append('files', f, encodeURIComponent(f.name)));
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
  };

  // ===== Posters =====
  readonly posters = {
    findAll: (): Promise<Poster[]> => this.get<Poster[]>('/posters'),
  };

  // ===== Histories =====
  readonly histories = {
    findAll: (): Promise<{ year: string; items: HistoryItem[] }[]> => this.get('/histories'),
  };

  // ===== Partners =====
  readonly partners = {
    findAll: (): Promise<Partner[]> => this.get<Partner[]>('/partners'),
  };

  // ===== Albums =====
  readonly albums = {
    findAll: (type?: 'ALBUM' | 'BOOKMARK'): Promise<Album[]> => this.get<Album[]>(`/albums${type ? `?type=${type}` : ''}`),
    findOne: (id: number): Promise<Album> => this.get<Album>(`/albums/${id}`),
    create: (data: { name: string; type?: 'ALBUM' | 'BOOKMARK' }): Promise<Album> => this.post<Album>('/albums', data),
    update: (id: number, data: { name: string }): Promise<Album> => this.patch<Album>(`/albums/${id}`, data),
    delete: (id: number): Promise<void> => this.del<void>(`/albums/${id}`),
    addContent: (albumId: number, contentId: number): Promise<void> => this.post<void>(`/albums/${albumId}/contents/${contentId}`, {}),
    removeContent: (albumId: number, contentId: number): Promise<void> => this.del<void>(`/albums/${albumId}/contents/${contentId}`),
  };
}
