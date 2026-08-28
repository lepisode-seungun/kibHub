export interface Banner {
  id: number;
  status: string;
  header: string;
  content: string;
  link: string | null;
  vimeoLink: string | null;
  pcImage: string | null;
  mobileImage: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBannerDto {
  status?: string;
  header: string;
  content?: string;
  link?: string;
  vimeoLink?: string;
  pcImage?: string;
  mobileImage?: string;
  sortOrder?: number;
}
