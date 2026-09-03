import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const cookieParserFn = (cookieParser as any).default || cookieParser;
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/global-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix('api');

  // Cookie parser
  app.use(cookieParserFn());

  // CORS whitelist
  const whitelist = [
    'http://localhost:4200',  // client dev
    'http://localhost:4300',  // admin dev
  ];
  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // allow requests with no origin (mobile apps, curl, etc.)
      if (!origin || whitelist.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
  });

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Global error handler
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('KIPHub API')
    .setDescription('KIPHub 백엔드 API 문서')
    .setVersion('1.0')
    .addCookieAuth('kiphub_token')
    .addTag('auth', '인증')
    .addTag('users', '회원 관리')
    .addTag('bootcamps', '부트캠프')
    .addTag('courses', '과정/강의/과제')
    .addTag('applicants', '지원자')
    .addTag('contents', '콘텐츠/댓글/신고')
    .addTag('portfolios', '포트폴리오/명예의전당')
    .addTag('notices', '공지사항')
    .addTag('faqs', 'FAQ')
    .addTag('inquiries', '1:1문의')
    .addTag('upload', '파일 업로드')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env['PORT'] || 3000;
  await app.listen(port);
  console.log(`🚀 NestJS server running on http://localhost:${port}`); // report delete added
  console.log(`📄 Swagger docs at http://localhost:${port}/api/docs`);
}

bootstrap();
