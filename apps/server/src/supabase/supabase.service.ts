import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private client!: SupabaseClient;

  constructor(private config: ConfigService) {}

  onModuleInit(): void {
    const url = this.config.get<string>('SUPABASE_URL');
    const key = this.config.get<string>('SUPABASE_SERVICE_KEY');

    if (!url || !key) {
      console.warn('⚠️  SUPABASE_URL / SUPABASE_SERVICE_KEY not set — file upload disabled');
      return;
    }

    this.client = createClient(url, key, {
      auth: { persistSession: false },
    });
  }

  get isConfigured(): boolean {
    return !!this.client;
  }

  /** 파일 업로드 → public URL 반환 */
  async uploadFile(
    bucket: string,
    path: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<{ url: string; path: string }> {
    if (!this.client) {
      throw new Error('Supabase not configured');
    }

    const { error } = await this.client.storage
      .from(bucket)
      .upload(path, buffer, {
        contentType,
        upsert: true,
      });

    if (error) {
      throw new Error(`Supabase upload failed: ${error.message}`);
    }

    const { data: urlData } = this.client.storage
      .from(bucket)
      .getPublicUrl(path);

    return {
      url: urlData.publicUrl,
      path,
    };
  }

  /** 파일 삭제 */
  async deleteFile(bucket: string, path: string): Promise<void> {
    if (!this.client) {
      throw new Error('Supabase not configured');
    }

    const { error } = await this.client.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      throw new Error(`Supabase delete failed: ${error.message}`);
    }
  }

  /** 다중 파일 삭제 */
  async deleteFiles(bucket: string, paths: string[]): Promise<void> {
    if (!this.client) {
      throw new Error('Supabase not configured');
    }

    const { error } = await this.client.storage
      .from(bucket)
      .remove(paths);

    if (error) {
      throw new Error(`Supabase bulk delete failed: ${error.message}`);
    }
  }
}
