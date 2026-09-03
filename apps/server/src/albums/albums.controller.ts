import { Inject, Controller, Get, Post, Patch, Delete, Param, Body, Query, ParseIntPipe, UseGuards, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AlbumsService } from './albums.service';
import { AuthGuard } from '../auth/auth.guard';
import { Request } from 'express';

@ApiTags('albums')
@Controller('albums')
export class AlbumsController {
  constructor(@Inject(AlbumsService) private albumsService: AlbumsService) {}

  @Get()
  @UseGuards(AuthGuard)
  findAll(@Req() req: Request & { userId: number }, @Query('type') type?: 'ALBUM' | 'BOOKMARK') {
    return this.albumsService.findAll(req.userId, type);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.albumsService.findOne(id);
  }

  @Post()
  @UseGuards(AuthGuard)
  create(@Req() req: Request & { userId: number }, @Body() data: { name: string; type?: 'ALBUM' | 'BOOKMARK' }) {
    return this.albumsService.create({ name: data.name, ownerId: req.userId, type: data.type });
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  update(@Param('id', ParseIntPipe) id: number, @Body() data: { name?: string }) {
    return this.albumsService.update(id, data);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.albumsService.delete(id);
  }

  @Post(':id/contents/:contentId')
  @UseGuards(AuthGuard)
  addContent(@Param('id', ParseIntPipe) id: number, @Param('contentId', ParseIntPipe) contentId: number) {
    return this.albumsService.addContent(id, contentId);
  }

  @Delete(':id/contents/:contentId')
  @UseGuards(AuthGuard)
  removeContent(@Param('id', ParseIntPipe) id: number, @Param('contentId', ParseIntPipe) contentId: number) {
    return this.albumsService.removeContent(id, contentId);
  }
}
