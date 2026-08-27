import { Inject, Controller, Post, Get, Body, Req, Res, HttpStatus } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';

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
  constructor(@Inject(AuthService) private authService: AuthService) {}

  @Post('register')
  async register(
    @Body() body: { email: string; password: string; nickname: string; phone?: string; intro?: string },
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
        user: { id: user.id, email: user.email, nickname: user.nickname, initial: 'N' },
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
        user: { id: user.id, email: user.email, nickname: user.nickname, initial: 'N' },
      });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : '로그인 실패';
      return res.status(HttpStatus.UNAUTHORIZED).json({ error: message });
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

    return res.json({ user: { ...user, initial: 'N' } });
  }

  @Post('logout')
  logout(@Res() res: Response) {
    res.clearCookie('kiphub_token', { path: '/' });
    return res.json({ success: true });
  }
}
