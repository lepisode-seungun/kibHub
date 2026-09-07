import { Inject, Controller, Get, Post, Patch, Delete, Param, Body, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { AlbumsService } from '../albums/albums.service';
import { UpdateUserDto } from '@kibhub/shared';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    @Inject(UsersService) private usersService: UsersService,
    @Inject(AlbumsService) private albumsService: AlbumsService,
  ) {}

  @Get()
  findAll(@Query() query: { search?: string; status?: string; role?: string; excludeRole?: string; page?: string; limit?: string }) {
    return this.usersService.findAll(query);
  }

  @Post('admin')
  createAdmin(@Body() body: { loginId: string; password: string; name: string; adminRole?: string }) {
    return this.usersService.createAdmin(body);
  }

  @Post('check-login-id')
  async checkLoginId(@Body() body: { loginId: string }) {
    const available = await this.usersService.checkLoginId(body.loginId);
    return { available };
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() data: UpdateUserDto) {
    return this.usersService.update(id, data);
  }

  @Patch(':id/block')
  updateStatus(@Param('id', ParseIntPipe) id: number, @Body() body: { status: 'ACTIVE' | 'BLOCKED' }) {
    return this.usersService.updateStatus(id, body.status);
  }

  @Patch(':id/role')
  updateRole(@Param('id', ParseIntPipe) id: number, @Body() body: { role: string }) {
    return this.usersService.updateRole(id, body.role);
  }

  @Get(':id/bootcamps')
  findUserBootcamps(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findUserBootcamps(id);
  }

  @Get(':id/contents')
  findUserContents(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findUserContents(id);
  }

  @Get(':id/albums')
  findUserAlbums(@Param('id', ParseIntPipe) id: number, @Query('type') type?: 'ALBUM' | 'BOOKMARK') {
    return this.albumsService.findAll(id, type);
  }

  @Get(':id/comments')
  findUserComments(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findUserComments(id);
  }

  @Get(':id/comment-stats')
  findUserCommentStats(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findUserCommentStats(id);
  }

  @Post(':id/follow')
  toggleFollow(@Param('id', ParseIntPipe) id: number, @Body() body: { userId: number }) {
    return this.usersService.toggleFollow(body.userId, id);
  }

  @Get(':id/follow-status')
  isFollowing(@Param('id', ParseIntPipe) id: number, @Query('userId') userId: string) {
    return this.usersService.isFollowing(parseInt(userId), id);
  }

  @Get(':id/follow-counts')
  getFollowCounts(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.getFollowCounts(id);
  }

  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.delete(id);
  }
}
