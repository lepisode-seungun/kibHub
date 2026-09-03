/**
 * Admin 프론트엔드 타입 정의
 *
 * 엔티티/DTO/Enum → libs/shared (서버와 공유, 단일 소스)
 * Grid Row 타입   → 프론트 전용 (한글 변환 등 UI 전용)
 */

// ===== Re-export shared types =====
export type {
  UserRole, UserStatus, AdminRole, BootcampStatus, ApplicantStatus,
  ContentType, ContentStatus, CourseStatus, ReportType, InquiryStatus, NoticeType,
} from '@kibhub/shared';

export type {
  User, UserSns, CreateUserDto, UpdateUserDto,
} from '@kibhub/shared';

export type {
  Bootcamp, CreateBootcampDto, Applicant, Course, Lecture, LectureFile,
  Assignment, AssignmentFile, RecruitInstructor,
} from '@kibhub/shared';

export type {
  Content, ContentCategory, Comment, Report, CreateContentDto, CreateReportDto,
} from '@kibhub/shared';

export type {
  Portfolio, PortfolioFile, CreatePortfolioDto,
} from '@kibhub/shared';

export type {
  Banner, CreateBannerDto,
} from '@kibhub/shared';

export type {
  Notice, CreateNoticeDto, Faq, CreateFaqDto,
  Inquiry, CreateInquiryDto, InquiryReplyDto,
} from '@kibhub/shared';

// ===== 프론트 전용 Grid Row 타입 =====

/** 회원 목록 그리드 행 */
export interface MemberRow {
  id: number;
  email: string;
  name: string;
  nickname: string;
  phone: string;
  countryCode: string;
  status: string;
  role: string;
  createdAt: string;
}

/** 관리자 목록 행 */
export interface AdminRow extends MemberRow {
  loginId: string;
  adminRole: string | null;
}

/** 부트캠프 목록 행 */
export interface BootcampRow {
  id: number;
  status: string;
  bootcampName: string;
  createdAt: string;
}

/** 콘텐츠 목록 행 */
export interface ContentRow {
  id: number;
  status: string;
  type: string;
  category: string;
  title: string;
  author: string;
  comments: number;
  views: number;
  createdAt: string;
}

/** 댓글 행 */
export interface CommentRow {
  id: number;
  status: string;
  type: string;
  content: string;
  author: string;
  reports: number;
  likes: number;
  createdAt: string;
  contentTitle?: string;
  images?: string[];
}

/** 신고 목록 행 */
export interface ReportRow {
  id: number;
  title?: string;
  commentContent: string;
  content: string;
  reporter: string;
  reportedAt: string;
}

/** 포트폴리오 행 */
export interface PortfolioRow {
  id: number;
  status: string;
  thumbnail: string;
  name: string;
  bootcampName: string;
  createdAt: string;
  launchPlatform?: string;
}

/** 공지사항 행 */
export interface NoticeRow {
  id: number;
  pinned: string;
  status: string;
  title: string;
  author: string;
  createdAt: string;
}

/** FAQ 행 */
export interface FaqRow {
  id: number;
  status: string;
  question: string;
  answer: string;
  author: string;
  createdAt: string;
}

/** 문의 행 */
export interface InquiryRow {
  id: number;
  status: string;
  title: string;
  content: string;
  author: string;
  createdAt: string;
  reply: string;
  files: { id: number; name: string; url: string; size: number; mimeType: string }[];
}
