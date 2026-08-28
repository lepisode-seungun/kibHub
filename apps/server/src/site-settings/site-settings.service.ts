import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SiteSettingsService {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  async get(key: string): Promise<{ key: string; value: string } | null> {
    const setting = await this.prisma.siteSetting.findUnique({ where: { key } });
    return setting ? { key: setting.key, value: setting.value } : null;
  }

  async set(key: string, value: string): Promise<{ key: string; value: string }> {
    const setting = await this.prisma.siteSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
    return { key: setting.key, value: setting.value };
  }
}
