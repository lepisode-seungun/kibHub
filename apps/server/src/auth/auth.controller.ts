import { Inject, Controller, Post, Get, Body, Req, Res, HttpStatus } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { AuthService } from './auth.service';
import { MailService } from '../mail/mail.service';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env['NODE_ENV'] === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
};

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    @Inject(AuthService) private authService: AuthService,
    @Inject(MailService) private mailService: MailService,
  ) {}

  @Post('register')
  async register(
    @Body() body: { email: string; password: string; name?: string; nickname: string; phone?: string; birthday?: string; intro?: string },
    @Res() res: Response,
  ) {
    try {
      if (!body.email || !body.password || !body.nickname) {
        return res.status(HttpStatus.BAD_REQUEST).json({ error: '이메일, 비밀번호, 닉네임은 필수입니다.' });
      }
      const user = await this.authService.register(body);
      const token = this.authService.generateToken(user.id);
      res.cookie('kiphub_token', token, COOKIE_OPTIONS);
      return res.status(HttpStatus.CREATED).json({
        user: { id: user.id, email: user.email, nickname: user.nickname, initial: (user.nickname || user.name || 'U').charAt(0).toUpperCase(), profileImage: user.profileImage || null, role: user.role },
      });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : '회원가입 실패';
      return res.status(HttpStatus.CONFLICT).json({ error: message });
    }
  }

  @Post('login')
  async login(@Body() body: { email: string; password: string }, @Res() res: Response) {
    try {
      if (!body.email || !body.password) {
        return res.status(HttpStatus.BAD_REQUEST).json({ error: '이메일과 비밀번호를 입력해주세요.' });
      }
      const user = await this.authService.login(body.email, body.password);
      const token = this.authService.generateToken(user.id);
      res.cookie('kiphub_token', token, COOKIE_OPTIONS);
      return res.json({
        user: { id: user.id, email: user.email, nickname: user.nickname, initial: (user.nickname || user.name || 'U').charAt(0).toUpperCase(), profileImage: user.profileImage || null, role: user.role },
      });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : '로그인 실패';
      return res.status(HttpStatus.UNAUTHORIZED).json({ error: message });
    }
  }

  @Post('find-email')
  async findEmail(@Body() body: { phone: string; birthday?: string }, @Res() res: Response) {
    if (!body.phone) {
      return res.status(HttpStatus.BAD_REQUEST).json({ error: '연락처를 입력해주세요.' });
    }
    try {
      const emails = await this.authService.findEmail(body.phone, body.birthday);
      return res.json({ emails });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : '이메일 찾기 실패';
      return res.status(HttpStatus.NOT_FOUND).json({ error: message });
    }
  }

  @Post('check-email')
  async checkEmail(@Body() body: { email: string }, @Res() res: Response) {
    if (!body.email) {
      return res.status(HttpStatus.BAD_REQUEST).json({ available: false, error: '이메일을 입력해주세요.' });
    }
    const available = await this.authService.checkEmail(body.email);
    return res.json({ available });
  }

  @Get('me')
  async me(@Req() req: Request, @Res() res: Response) {
    const token = req.cookies?.kiphub_token;
    if (!token) return res.status(HttpStatus.UNAUTHORIZED).json({ error: '인증 토큰이 필요합니다.' });

    const decoded = this.authService.verifyToken(token);
    if (!decoded) return res.status(HttpStatus.UNAUTHORIZED).json({ error: '유효하지 않은 토큰입니다.' });

    const user = await this.authService.findById(decoded.userId);
    if (!user) return res.status(HttpStatus.NOT_FOUND).json({ error: '유저를 찾을 수 없습니다.' });

    return res.json({ user: { ...user, initial: ((user as any).nickname || (user as any).name || 'U').charAt(0).toUpperCase() } });
  }

  @Post('logout')
  logout(@Res() res: Response) {
    res.clearCookie('kiphub_token', { path: '/' });
    return res.json({ success: true });
  }

  // ===== 인증번호 발송 =====
  @Post('send-verification')
  async sendVerification(@Body() body: { email: string }, @Res() res: Response) {
    try {
      if (!body.email) {
        return res.status(HttpStatus.BAD_REQUEST).json({ error: '이메일을 입력해주세요.' });
      }
      await this.authService.sendVerificationCode(body.email);
      return res.json({ message: '인증번호가 발송되었습니다.' });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : '인증번호 발송 실패';
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: message });
    }
  }

  // ===== 인증번호 검증 =====
  @Post('verify-code')
  async verifyCode(@Body() body: { email: string; code: string }, @Res() res: Response) {
    if (!body.email || !body.code) {
      return res.status(HttpStatus.BAD_REQUEST).json({ verified: false, error: '이메일과 인증번호를 입력해주세요.' });
    }
    const verified = this.authService.verifyCode(body.email, body.code);
    if (!verified) {
      return res.status(HttpStatus.BAD_REQUEST).json({ verified: false, error: '인증번호가 올바르지 않거나 만료되었습니다.' });
    }
    return res.json({ verified: true });
  }

  // ===== 이메일 변경 =====
  @Post('change-email')
  async changeEmail(@Req() req: Request, @Body() body: { newEmail: string; code: string }, @Res() res: Response) {
    const token = req.cookies?.kiphub_token;
    if (!token) return res.status(HttpStatus.UNAUTHORIZED).json({ error: '로그인이 필요합니다.' });

    const decoded = this.authService.verifyToken(token);
    if (!decoded) return res.status(HttpStatus.UNAUTHORIZED).json({ error: '유효하지 않은 토큰입니다.' });

    try {
      await this.authService.changeEmail(decoded.userId, body.newEmail);
      return res.json({ message: '이메일이 변경되었습니다.' });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : '이메일 변경 실패';
      return res.status(HttpStatus.BAD_REQUEST).json({ error: message });
    }
  }

  // ===== 비밀번호 변경 =====
  @Post('change-password')
  async changePassword(@Req() req: Request, @Body() body: { currentPassword: string; newPassword: string }, @Res() res: Response) {
    const token = req.cookies?.kiphub_token;
    if (!token) return res.status(HttpStatus.UNAUTHORIZED).json({ error: '로그인이 필요합니다.' });

    const decoded = this.authService.verifyToken(token);
    if (!decoded) return res.status(HttpStatus.UNAUTHORIZED).json({ error: '유효하지 않은 토큰입니다.' });

    try {
      await this.authService.changePassword(decoded.userId, body.currentPassword, body.newPassword);
      return res.json({ message: '비밀번호가 변경되었습니다.' });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : '비밀번호 변경 실패';
      return res.status(HttpStatus.BAD_REQUEST).json({ error: message });
    }
  }

  // ===== 비밀번호 재설정 링크 발송 =====
  @Post('reset-password')
  async resetPassword(@Body() body: { email: string }, @Res() res: Response) {
    try {
      if (!body.email) {
        return res.status(HttpStatus.BAD_REQUEST).json({ error: '이메일을 입력해주세요.' });
      }
      await this.authService.resetPassword(body.email);
      return res.json({ message: '비밀번호 재설정 이메일이 발송되었습니다.' });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : '비밀번호 찾기 실패';
      return res.status(HttpStatus.BAD_REQUEST).json({ error: message });
    }
  }

  // ===== 비밀번호 재설정 확인 =====
  @Post('confirm-reset-password')
  async confirmResetPassword(@Body() body: { token: string; newPassword: string }, @Res() res: Response) {
    try {
      if (!body.token || !body.newPassword) {
        return res.status(HttpStatus.BAD_REQUEST).json({ error: '토큰과 새 비밀번호를 입력해주세요.' });
      }
      await this.authService.confirmResetPassword(body.token, body.newPassword);
      return res.json({ message: '비밀번호가 성공적으로 변경되었습니다.' });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : '비밀번호 재설정 실패';
      return res.status(HttpStatus.BAD_REQUEST).json({ error: message });
    }
  }

  // ===== 회원 탈퇴 =====
  @Post('withdraw')
  async withdraw(@Req() req: Request, @Body() body: { password: string; reason?: string }, @Res() res: Response) {
    const token = req.cookies?.kiphub_token;
    if (!token) return res.status(HttpStatus.UNAUTHORIZED).json({ error: '로그인이 필요합니다.' });

    const decoded = this.authService.verifyToken(token);
    if (!decoded) return res.status(HttpStatus.UNAUTHORIZED).json({ error: '유효하지 않은 토큰입니다.' });

    try {
      if (!body.password) {
        return res.status(HttpStatus.BAD_REQUEST).json({ error: '비밀번호를 입력해주세요.' });
      }
      await this.authService.withdraw(decoded.userId, body.password);
      res.clearCookie('kiphub_token', { path: '/' });
      return res.json({ message: '회원 탈퇴가 완료되었습니다.' });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : '회원 탈퇴 실패';
      return res.status(HttpStatus.BAD_REQUEST).json({ error: message });
    }
  }




  // ===== 로고 이미지 서빙 =====
  @Get('logo.png')
  serveLogo(@Res() res: Response) {
    const logoPath = path.join(__dirname, '..', 'mail', 'assets', 'kiphub-logo.png');
    if (!fs.existsSync(logoPath)) {
      return res.status(HttpStatus.NOT_FOUND).json({ error: 'Logo not found' });
    }
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    return res.sendFile(logoPath);
  }
}
