import { UserRole, UserStatus, AdminRole } from './enums';

export interface UserSns {
  id: number;
  type: string;
  label: string;
  url: string;
  userId: number;
}

export interface User {
  id: number;
  email: string;
  nickname: string;
  name: string;
  phone: string;
  countryCode: string;
  birthday: string | null;
  intro: string;
  profileImage: string | null;
  coverImage: string | null;
  role: UserRole;
  status: UserStatus;
  adminRole: AdminRole | null;
  loginId: string | null;
  createdAt: string;
  updatedAt?: string;
  sns?: UserSns[];
}

// ===== DTOs =====

export interface CreateUserDto {
  email: string;
  password: string;
  name?: string;
  nickname?: string;
  phone?: string;
  role?: UserRole;
}

export interface UpdateUserDto {
  email?: string;
  password?: string;
  nickname?: string;
  name?: string;
  phone?: string;
  countryCode?: string;
  birthday?: string;
  intro?: string;
  profileImage?: string | null;
  coverImage?: string | null;
  adminRole?: AdminRole | null;
  role?: string;
  status?: string;
  loginId?: string;
  sns?: { type: string; label: string; url: string }[];
}
