import { Inject, Controller, Get, Patch, Delete, Param, Body, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { AuthGuard } from '../auth/auth.guard';
import { UpdateUserDto } from '@kibhub/shared';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(@Inject(UsersService) private usersService: UsersService) {}

  @Get()
  findAll(@Query() query: { search?: string; status?: string; role?: string; page?: string; limit?: string }) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  update(@Param('id', ParseIntPipe) id: number, @Body() data: UpdateUserDto) {
    return this.usersService.update(id, data);
  }

  @Patch(':id/block')
  @UseGuards(AuthGuard)
  updateStatus(@Param('id', ParseIntPipe) id: number, @Body() body: { status: 'ACTIVE' | 'BLOCKED' }) {
    return this.usersService.updateStatus(id, body.status);
  }

  @Patch(':id/role')
  @UseGuards(AuthGuard)
  updateRole(@Param('id', ParseIntPipe) id: number, @Body() body: { role: string }) {
    return this.usersService.updateRole(id, body.role);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.delete(id);
  }
}
