import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const token = request.cookies?.kiphub_token;

    if (!token) {
      throw new UnauthorizedException('인증 토큰이 필요합니다.');
    }

    const decoded = this.authService.verifyToken(token);
    if (!decoded) {
      throw new UnauthorizedException('유효하지 않은 토큰입니다.');
    }

    // request에 userId 첨부
    (request as Request & { userId: number }).userId = decoded.userId;
    return true;
  }
}
