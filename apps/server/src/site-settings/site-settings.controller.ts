import { Inject, Controller, Get, Put, Param, Body } from '@nestjs/common';

import { SiteSettingsService } from './site-settings.service';

@Controller('site-settings')
export class SiteSettingsController {
  constructor(@Inject(SiteSettingsService) private readonly service: SiteSettingsService) {}

  @Get(':key')
  async get(@Param('key') key: string) {
    const result = await this.service.get(key);
    return result ?? { key, value: '' };
  }

  @Put(':key')
  async set(@Param('key') key: string, @Body('value') value: string) {
    console.log(`[SiteSettings] PUT key=${key}, value=${value}`);
    return this.service.set(key, value);
  }
}
