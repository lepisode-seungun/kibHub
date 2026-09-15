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
  images: string[];
  // 그림 전용 필드
  artMedium?: string | null;
  artTools?: string[];
  artistNote?: string | null;
  workDuration?: string | null;
  difficulty?: string | null;
  resolution?: string | null;
  processImages?: string[];
  // 웹툰 전용 필드
  webtoonGenre?: string | null;
  targetAudience?: string | null;
  webtoonTools?: string[];
  episodeNumber?: number | null;
  storyboardImages?: string[];
  // 글 전용 필드
  writingGenre?: string | null;
  wordCount?: number | null;
  referenceUrls?: string[];
  writingTools?: string[];
  attachments?: Attachment[] | null;
  viewCount: number;
  categoryId: number | null;
  category?: ContentCategory;
  authorId: number;
  author?: User;
  createdAt: string;
  updatedAt?: string;
  _count?: { comments: number };
  bookmarkCount?: number;
}

export interface CreateContentDto {
  title: string;
  body?: string;
  type?: ContentType;
  categoryId?: number;
  status?: ContentStatus;
  thumbnail?: string;
  images?: string[];
  // 그림 전용 필드
  artMedium?: string;
  artTools?: string[];
  artistNote?: string;
  workDuration?: string;
  difficulty?: string;
  resolution?: string;
  processImages?: string[];
  // 웹툰 전용 필드
  webtoonGenre?: string;
  targetAudience?: string;
  webtoonTools?: string[];
  episodeNumber?: number;
  storyboardImages?: string[];
  // 글 전용 필드
  writingGenre?: string;
  wordCount?: number;
  referenceUrls?: string[];
  writingTools?: string[];
  attachments?: Attachment[];
}

export interface Attachment {
  name: string;
  url: string;
  size: number;
  mimeType: string;
}

// ===== Comment =====

export interface Comment {
  id: number;
  status: ContentStatus;
  body: string;
  images: string[];
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
  targetTitle?: string;
  targetBody?: string;
  createdAt: string;
}

export interface CreateReportDto {
  type: ReportType;
  targetId: number;
  reason: string;
}
