import { Injectable, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { randomUUID } from 'crypto';
import { extname } from 'path';

const BUCKET = 'kiphub';

const IMAGE_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
const VIDEO_MIME = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
const DOC_MIME = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.hancom.hwp',
  'application/zip',
];

const ALLOWED_MIME = [...IMAGE_MIME, ...VIDEO_MIME, ...DOC_MIME];

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;   // 10MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024;   // 100MB
const MAX_DOC_SIZE = 50 * 1024 * 1024;      // 50MB

export interface UploadResult {
  url: string;
  path: string;
  originalName: string;
  size: number;
  mimeType: string;
}

@Injectable()
export class UploadService {
  constructor(private supabase: SupabaseService) {}

  /** 단일 파일 업로드 */
  async uploadSingle(
    file: Express.Multer.File,
    folder = 'general',
  ): Promise<UploadResult> {
    this.validate(file);

    const ext = extname(file.originalname) || this.guessExt(file.mimetype);
    const safeName = `${randomUUID()}${ext}`;
    const path = `${folder}/${safeName}`;

    const { url } = await this.supabase.uploadFile(
      BUCKET,
      path,
      file.buffer,
      file.mimetype,
    );

    return {
      url,
      path,
      originalName: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
    };
  }

  /** 다중 파일 업로드 */
  async uploadMultiple(
    files: Express.Multer.File[],
    folder = 'general',
  ): Promise<UploadResult[]> {
    return Promise.all(files.map(f => this.uploadSingle(f, folder)));
  }

  /** 파일 삭제 */
  async deleteSingle(path: string): Promise<void> {
    await this.supabase.deleteFile(BUCKET, path);
  }

  /** 다중 파일 삭제 */
  async deleteMultiple(paths: string[]): Promise<void> {
    await this.supabase.deleteFiles(BUCKET, paths);
  }

  /** 유효성 검증 */
  private validate(file: Express.Multer.File): void {
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      throw new BadRequestException(
        `허용되지 않는 파일 형식: ${file.mimetype}`,
      );
    }

    const maxSize = IMAGE_MIME.includes(file.mimetype)
      ? MAX_IMAGE_SIZE
      : VIDEO_MIME.includes(file.mimetype)
        ? MAX_VIDEO_SIZE
        : MAX_DOC_SIZE;

    if (file.size > maxSize) {
      const mb = Math.round(maxSize / 1024 / 1024);
      throw new BadRequestException(
        `파일 크기 초과 (최대 ${mb}MB): ${file.originalname}`,
      );
    }
  }

  /** mimetype → 확장자 추론 */
  private guessExt(mime: string): string {
    const map: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/gif': '.gif',
      'image/svg+xml': '.svg',
      'video/mp4': '.mp4',
      'video/webm': '.webm',
      'video/quicktime': '.mov',
      'application/pdf': '.pdf',
    };
    return map[mime] || '';
  }
}
