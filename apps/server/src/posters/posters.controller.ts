import { Inject, Controller, Get, Post, Put, Delete, Param, Body, ParseIntPipe } from '@nestjs/common';
import { PostersService } from './posters.service';

@Controller('posters')
export class PostersController {
  constructor(@Inject(PostersService) private readonly postersService: PostersService) {}

  @Get()
  findAll() {
    return this.postersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.postersService.findOne(id);
  }

  @Post()
  create(@Body() body: { imageUrl: string; displayOrder?: number }) {
    return this.postersService.create(body);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: { imageUrl?: string; displayOrder?: number }) {
    return this.postersService.update(id, body);
  }

  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.postersService.delete(id);
  }
}
