import { Inject, Controller, Get, Post, Put, Delete, Param, Body, ParseIntPipe } from '@nestjs/common';
import { HistoriesService } from './histories.service';

@Controller('histories')
export class HistoriesController {
  constructor(@Inject(HistoriesService) private readonly historiesService: HistoriesService) {}

  @Get()
  findAll() {
    return this.historiesService.findAll();
  }

  @Get('flat')
  findAllFlat() {
    return this.historiesService.findAllFlat();
  }

  @Post()
  create(@Body() body: { year: string; title: string; description?: string; period: string; displayOrder?: number }) {
    return this.historiesService.create(body);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: { year?: string; title?: string; description?: string; period?: string; displayOrder?: number }) {
    return this.historiesService.update(id, body);
  }

  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.historiesService.delete(id);
  }

  @Delete('year/:year')
  deleteByYear(@Param('year') year: string) {
    return this.historiesService.deleteByYear(year);
  }
}
