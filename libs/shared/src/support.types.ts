import { ContentStatus, NoticeType, InquiryStatus } from './enums';
import { User } from './user.types';
import { Bootcamp } from './bootcamp.types';

// ===== Notice =====

export interface Notice {
  id: number;
  type: NoticeType;
  pinned: boolean;
  status: ContentStatus;
  title: string;
  body: string;
  bootcampId: number | null;
  bootcamp?: Bootcamp;
  authorId: number;
  author?: User;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateNoticeDto {
  title: string;
  body?: string;
  pinned?: boolean;
  status?: ContentStatus | string;
  type: NoticeType | string;
  bootcampId?: number;
}

// ===== FAQ =====

export interface Faq {
  id: number;
  status: ContentStatus;
  question: string;
  answer: string;
  image: string | null;
  authorId: number;
  author?: User;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateFaqDto {
  question: string;
  answer: string;
  status?: ContentStatus | string;
}

// ===== Inquiry =====

export interface Inquiry {
  id: number;
  status: InquiryStatus;
  title: string;
  body: string;
  authorId: number;
  author?: User;
  reply: string | null;
  repliedAt: string | null;
  repliedById: number | null;
  repliedBy?: User;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateInquiryDto {
  title: string;
  body: string;
}

export interface InquiryReplyDto {
  reply: string;
}
