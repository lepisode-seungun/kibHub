import { ContentType, ContentStatus } from './enums';
import { User } from './user.types';

// ===== Content Category =====

export interface ContentCategory {
  id: number;
  name: string;
}

// ===== Content =====

export interface Content {
  id: number;
  status: ContentStatus;
  type: ContentType;
  title: string;
  body: string;
  thumbnail: string | null;
  viewCount: number;
  categoryId: number | null;
  category?: ContentCategory;
  authorId: number;
  author?: User;
  createdAt: string;
  updatedAt?: string;
  _count?: { comments: number };
}

export interface CreateContentDto {
  title: string;
  body?: string;
  type?: ContentType;
  categoryId?: number;
  status?: ContentStatus;
}

// ===== Comment =====

export interface Comment {
  id: number;
  status: ContentStatus;
  body: string;
  contentId: number;
  content?: Content;
  authorId: number;
  author?: User;
  parentId?: number | null;
  likeCount: number;
  reportCount: number;
  createdAt: string;
}

// ===== Report =====

import { ReportType } from './enums';

export interface Report {
  id: number;
  type: ReportType;
  targetId: number;
  reason: string;
  reporterId: number;
  reporter?: User;
  createdAt: string;
}

export interface CreateReportDto {
  type: ReportType;
  targetId: number;
  reason: string;
}
