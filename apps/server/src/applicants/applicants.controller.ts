import { Inject, Controller, Get, Post, Patch, Param, Body, ParseIntPipe, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApplicantsService } from './applicants.service';
import { AuthService } from '../auth/auth.service';
import { Request } from 'express';

@ApiTags('applicants')
@Controller()
export class ApplicantsController {
  constructor(
    @Inject(ApplicantsService) private applicantsService: ApplicantsService,
    @Inject(AuthService) private authService: AuthService,
  ) {}

  @Get('bootcamps/:bootcampId/applicants')
  findByBootcamp(@Param('bootcampId', ParseIntPipe) bootcampId: number) {
    return this.applicantsService.findByBootcamp(bootcampId);
  }

  @Get('users/:userId/applicants')
  findByUser(@Param('userId', ParseIntPipe) userId: number) {
    return this.applicantsService.findByUser(userId);
  }

  @Post('bootcamps/:bootcampId/applicants')
  apply(
    @Param('bootcampId', ParseIntPipe) bootcampId: number,
    @Body() body: {
      applicantName: string;
      phone?: string;
      email?: string;
      address?: string;
      portfolioUrl?: string;
      motivation?: string;
    },
    @Req() req: Request,
  ) {
    // 쿠키에서 로그인 유저 ID 추출 (비로그인 시 undefined)
    let userId: number | undefined;
    const token = req.cookies?.kiphub_token;
    if (token) {
      const decoded = this.authService.verifyToken(token);
      if (decoded) userId = decoded.userId;
    }
    return this.applicantsService.apply(bootcampId, body, userId);
  }

  @Get('applicants/:id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.applicantsService.findOne(id);
  }

  @Patch('applicants/:id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { status: 'PENDING' | 'ACCEPTED' | 'REJECTED' },
  ) {
    return this.applicantsService.updateStatus(id, body.status);
  }

  @Patch('applicants/bulk-status')
  bulkUpdateStatus(@Body() body: { ids: number[]; status: 'ACCEPTED' | 'REJECTED' }) {
    return this.applicantsService.bulkUpdateStatus(body.ids, body.status);
  }
}
