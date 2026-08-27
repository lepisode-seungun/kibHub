import { ContentStatus } from './enums';
import { User } from './user.types';
import { Bootcamp } from './bootcamp.types';

// ===== Portfolio =====

export interface PortfolioFile {
  id: number;
  name: string;
  url: string;
  size: number;
  mimeType: string;
  episode: number | null;
  portfolioId: number;
  createdAt: string;
}

export interface Portfolio {
  id: number;
  status: ContentStatus;
  isHallOfFame: boolean;
  thumbnail: string | null;
  userName: string;
  bootcampName: string;
  workTitle: string;
  authorName: string;
  genre: string;
  workIntro: string;
  launchPlatform: string | null;
  launchUrl: string | null;
  createdAt: string;
  updatedAt?: string;
  files?: PortfolioFile[];
  // Relations
  authorId?: number;
  author?: User;
  bootcampId?: number;
  bootcamp?: Bootcamp;
  // Convenience aliases (used in client views)
  title?: string;
  description?: string;
  link?: string;
}

export interface CreatePortfolioDto {
  userName: string;
  bootcampName: string;
  workTitle?: string;
  authorName?: string;
  genre?: string;
  workIntro?: string;
  launchPlatform?: string;
  launchUrl?: string;
  thumbnail?: string;
  status?: ContentStatus;
  isHallOfFame?: boolean;
}
