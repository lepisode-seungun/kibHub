import { Router, Request, Response } from 'express';
import { PrismaClient } from '../../../../prisma/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const connectionString = process.env['DATABASE_URL'] || 'postgresql://kiphub:kiphub1234@localhost:5440/kiphub';
const adapter = new PrismaPg(connectionString);
const prisma = new PrismaClient({ adapter });
const router = Router();

const JWT_SECRET = process.env['JWT_SECRET'] || 'kiphub-jwt-secret-key-2026';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env['NODE_ENV'] === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7일
  path: '/',
};

function generateToken(userId: number): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

/** POST /api/auth/register */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, nickname, phone, intro } = req.body;

    if (!email || !password || !nickname) {
      res.status(400).json({ error: '이메일, 비밀번호, 닉네임은 필수입니다.' });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: '이미 존재하는 이메일입니다.' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        nickname,
        phone: phone || '',
        intro: intro || '',
      },
    });

    const token = generateToken(user.id);
    res.cookie('kiphub_token', token, COOKIE_OPTIONS);

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        initial: user.nickname.charAt(0).toUpperCase(),
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: '서버 에러가 발생했습니다.' });
  }
});

/** POST /api/auth/login */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: '이메일과 비밀번호를 입력해주세요.' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' });
      return;
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' });
      return;
    }

    const token = generateToken(user.id);
    res.cookie('kiphub_token', token, COOKIE_OPTIONS);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        initial: user.nickname.charAt(0).toUpperCase(),
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: '서버 에러가 발생했습니다.' });
  }
});

/** GET /api/auth/me — 쿠키 토큰으로 유저 정보 조회 */
router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const user = await prisma.user.findUnique({
      where: { id: authReq.userId },
      select: { id: true, email: true, nickname: true, phone: true, intro: true },
    });

    if (!user) {
      res.status(404).json({ error: '유저를 찾을 수 없습니다.' });
      return;
    }

    res.json({
      user: {
        ...user,
        initial: user.nickname.charAt(0).toUpperCase(),
      },
    });
  } catch (error) {
    console.error('Me error:', error);
    res.status(500).json({ error: '서버 에러가 발생했습니다.' });
  }
});

/** POST /api/auth/logout */
router.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie('kiphub_token', { path: '/' });
  res.json({ success: true });
});

export { router as authRouter };
