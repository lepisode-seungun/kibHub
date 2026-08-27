import { Inject, Controller, Get, Post, Patch, Delete, Param, Body, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BootcampsService } from './bootcamps.service';
import { AuthGuard } from '../auth/auth.guard';
import { CreateBootcampDto } from '@kibhub/shared';

@ApiTags('bootcamps')
@Controller('bootcamps')
export class BootcampsController {
  constructor(@Inject(BootcampsService) private bootcampsService: BootcampsService) {}

  @Get()
  findAll(@Query() query: { search?: string; status?: string; page?: string; limit?: string }) {
    return this.bootcampsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.bootcampsService.findOne(id);
  }

  @Post()
  @UseGuards(AuthGuard)
  create(@Body() data: CreateBootcampDto) {
    return this.bootcampsService.create(data);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  update(@Param('id', ParseIntPipe) id: number, @Body() data: Partial<CreateBootcampDto>) {
    return this.bootcampsService.update(id, data);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.bootcampsService.delete(id);
  }
}
