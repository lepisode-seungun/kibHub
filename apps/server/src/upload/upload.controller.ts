import {
  Controller,
  Post,
  Delete,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ApiTags, ApiConsumes, ApiBody, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { UploadService, UploadResult } from './upload.service';

const multerOptions = { storage: memoryStorage() };

@ApiTags('upload')
@Controller('upload')
@UseGuards(AuthGuard)
export class UploadController {
  constructor(private uploadService: UploadService) {}

  /** 단일 파일 업로드 */
  @Post()
  @ApiOperation({ summary: '단일 파일 업로드' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        folder: { type: 'string', description: '저장 폴더 (avatars, contents, videos, assignments 등)' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file', multerOptions))
  async uploadSingle(
    @UploadedFile() file: Express.Multer.File,
    @Body('folder') folder?: string,
  ): Promise<UploadResult> {
    if (!file) throw new BadRequestException('파일이 없습니다.');
    return this.uploadService.uploadSingle(file, folder || 'general');
  }

  /** 다중 파일 업로드 (최대 20개) */
  @Post('multiple')
  @ApiOperation({ summary: '다중 파일 업로드 (최대 20개)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: { type: 'array', items: { type: 'string', format: 'binary' } },
        folder: { type: 'string' },
      },
    },
  })
  @UseInterceptors(FilesInterceptor('files', 20, multerOptions))
  async uploadMultiple(
    @UploadedFiles() files: Express.Multer.File[],
    @Body('folder') folder?: string,
  ): Promise<UploadResult[]> {
    if (!files || files.length === 0) throw new BadRequestException('파일이 없습니다.');
    return this.uploadService.uploadMultiple(files, folder || 'general');
  }

  /** 파일 삭제 */
  @Delete()
  @ApiOperation({ summary: '파일 삭제' })
  async deleteFile(
    @Body('path') path: string,
  ): Promise<{ success: boolean }> {
    if (!path) throw new BadRequestException('path가 없습니다.');
    await this.uploadService.deleteSingle(path);
    return { success: true };
  }

  /** 다중 파일 삭제 */
  @Delete('multiple')
  @ApiOperation({ summary: '다중 파일 삭제' })
  async deleteFiles(
    @Body('paths') paths: string[],
  ): Promise<{ success: boolean; count: number }> {
    if (!paths || paths.length === 0) throw new BadRequestException('paths가 없습니다.');
    await this.uploadService.deleteMultiple(paths);
    return { success: true, count: paths.length };
  }
}
