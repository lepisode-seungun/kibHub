import { Controller, Get, Query, Inject } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AdminDashboardService } from './admin-dashboard.service';

@ApiTags('admin-dashboard')
@Controller('admin/dashboard')
export class AdminDashboardController {
  constructor(
    @Inject(AdminDashboardService)
    private readonly dashboardService: AdminDashboardService,
  ) {}

  /** 요약 통계 */
  @Get('summary')
  getSummary() {
    return this.dashboardService.getSummary();
  }

  /** 가입자 추이 */
  @Get('signup-trend')
  getSignupTrend(
    @Query('period') period: 'daily' | 'weekly' | 'monthly' = 'daily',
    @Query('days') days = '30',
  ) {
    return this.dashboardService.getSignupTrend(period, parseInt(days, 10) || 30);
  }

  /** 콘텐츠 업로드 추이 (월별) */
  @Get('content-trend')
  getContentTrend(@Query('months') months = '5') {
    return this.dashboardService.getContentTrend(parseInt(months, 10) || 5);
  }

  /** 부트캠프 현황 */
  @Get('bootcamp-overview')
  getBootcampOverview() {
    return this.dashboardService.getBootcampOverview();
  }

  /** 최근 활동 */
  @Get('recent-activity')
  getRecentActivity() {
    return this.dashboardService.getRecentActivity();
  }
}
