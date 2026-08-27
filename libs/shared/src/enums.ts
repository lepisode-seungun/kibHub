// ===== User 관련 Enum =====
export type UserRole = 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'BLOCKED' | 'WITHDRAWN';
export type AdminRole = 'SUPER' | 'NORMAL';

// ===== Bootcamp 관련 Enum =====
export type BootcampStatus = 'PREPARING' | 'RECRUITING' | 'CLOSED' | 'OPERATING' | 'ENDED';
export type ApplicantStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

// ===== Content 관련 Enum =====
export type ContentType = 'PORTFOLIO' | 'REVIEW';
export type ContentStatus = 'VISIBLE' | 'HIDDEN';

// ===== Course 관련 Enum =====
export type CourseStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

// ===== Report =====
export type ReportType = 'CONTENT' | 'COMMENT';

// ===== Inquiry =====
export type InquiryStatus = 'PENDING' | 'ANSWERED' | 'COMPLETED';

// ===== Notice =====
export type NoticeType = 'BOOTCAMP' | 'SUPPORT';
