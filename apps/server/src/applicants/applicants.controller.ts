import { Controller, Get, Patch, Param, Body, ParseIntPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApplicantsService } from './applicants.service';

@ApiTags('applicants')
@Controller()
export class ApplicantsController {
  constructor(private applicantsService: ApplicantsService) {}

  @Get('bootcamps/:bootcampId/applicants')
  findByBootcamp(@Param('bootcampId', ParseIntPipe) bootcampId: number) {
    return this.applicantsService.findByBootcamp(bootcampId);
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
