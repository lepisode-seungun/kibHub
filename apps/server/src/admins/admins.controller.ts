import { Inject, Controller, Get, Post, Patch, Delete, Param, Body, Res, ParseIntPipe, HttpStatus } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { AdminsService } from './admins.service';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env['JWT_SECRET'] || 'kiphub-jwt-secret-key-2026';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env['NODE_ENV'] === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
};

@ApiTags('admins')
@Controller('admins')
export class AdminsController {
  constructor(@Inject(AdminsService) private adminsService: AdminsService) {}

  @Get()
  findAll() {
    return this.adminsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.adminsService.findOne(id);
  }

  @Post()
  create(@Body() body: { loginId: string; password: string; name: string; role?: string }) {
    return this.adminsService.create(body);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() data: { name?: string; role?: string; password?: string; currentPassword?: string }) {
    return this.adminsService.update(id, data);
  }

  @Patch(':id/block')
  updateStatus(@Param('id', ParseIntPipe) id: number, @Body() body: { status: 'ACTIVE' | 'BLOCKED' }) {
    return this.adminsService.updateStatus(id, body.status);
  }

  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.adminsService.delete(id);
  }

  @Post('check-login-id')
  async checkLoginId(@Body() body: { loginId: string }) {
    const available = await this.adminsService.checkLoginId(body.loginId);
    return { available };
  }

  @Post('login')
  async login(@Body() body: { loginId: string; password: string }, @Res() res: Response) {
    try {
      if (!body.loginId || !body.password) {
        return res.status(HttpStatus.BAD_REQUEST).json({ error: '아이디와 비밀번호를 입력해주세요.' });
      }
      const admin = await this.adminsService.login(body.loginId, body.password);
      const token = jwt.sign({ adminId: admin.id, type: 'admin' }, JWT_SECRET, { expiresIn: '7d' });
      res.cookie('kiphub_admin_token', token, COOKIE_OPTIONS);
      return res.json({
        user: { id: admin.id, loginId: admin.loginId, name: admin.name, role: admin.role, status: admin.status },
      });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : '로그인 실패';
      return res.status(HttpStatus.UNAUTHORIZED).json({ error: message });
    }
  }
}
