import { Inject, Controller, Get, Post, Patch, Delete, Param, Body, ParseIntPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BannersService } from './banners.service';
import { CreateBannerDto } from '@kibhub/shared';

@ApiTags('banners')
@Controller('banners')
export class BannersController {
  constructor(@Inject(BannersService) private bannersService: BannersService) {}

  @Get()
  findAll() {
    return this.bannersService.findAll();
  }

  @Get('visible')
  findVisible() {
    return this.bannersService.findVisible();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.bannersService.findOne(id);
  }

  @Post()
  create(@Body() data: CreateBannerDto) {
    return this.bannersService.create(data);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() data: Partial<CreateBannerDto>) {
    return this.bannersService.update(id, data);
  }

  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.bannersService.delete(id);
  }
}
