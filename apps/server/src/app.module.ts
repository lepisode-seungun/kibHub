import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { BootcampsModule } from './bootcamps/bootcamps.module';
import { CoursesModule } from './courses/courses.module';
import { ApplicantsModule } from './applicants/applicants.module';
import { ContentsModule } from './contents/contents.module';
import { PortfoliosModule } from './portfolios/portfolios.module';
import { NoticesModule } from './notices/notices.module';
import { FaqsModule } from './faqs/faqs.module';
import { InquiriesModule } from './inquiries/inquiries.module';
import { SupabaseModule } from './supabase/supabase.module';
import { UploadModule } from './upload/upload.module';
import { BannersModule } from './banners/banners.module';
import { SiteSettingsModule } from './site-settings/site-settings.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    BootcampsModule,
    CoursesModule,
    ApplicantsModule,
    ContentsModule,
    PortfoliosModule,
    NoticesModule,
    FaqsModule,
    InquiriesModule,
    SupabaseModule,
    UploadModule,
    BannersModule,
    SiteSettingsModule,
  ],
})
export class AppModule {}
