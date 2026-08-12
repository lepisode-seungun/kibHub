import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env['JWT_SECRET'] || 'kiphub-jwt-secret-key-2026';

export interface AuthRequest extends Request {
  userId?: number;
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  // 1. 쿠키에서 토큰 읽기 (우선)
  const token = req.cookies?.kiphub_token;

  if (!token) {
    res.status(401).json({ error: '인증 토큰이 필요합니다.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    (req as AuthRequest).userId = decoded.userId;
    next();
  } catch {
    res.status(401).json({ error: '유효하지 않은 토큰입니다.' });
  }
}
