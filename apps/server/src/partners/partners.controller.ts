import { Inject, Controller, Get, Post, Put, Delete, Param, Body, ParseIntPipe } from '@nestjs/common';
import { PartnersService } from './partners.service';

@Controller('partners')
export class PartnersController {
  constructor(@Inject(PartnersService) private readonly partnersService: PartnersService) {}

  @Get()
  findAll() {
    return this.partnersService.findAll();
  }

  @Post()
  create(@Body() body: { name: string; logoUrl: string; link?: string; displayOrder?: number }) {
    return this.partnersService.create(body);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: { name?: string; logoUrl?: string; link?: string; displayOrder?: number }) {
    return this.partnersService.update(id, body);
  }

  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.partnersService.delete(id);
  }
}
