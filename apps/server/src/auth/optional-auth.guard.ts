import { Inject, Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Request } from 'express';

@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(@Inject(AuthService) private authService: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const token = request.cookies?.kiphub_token || request.cookies?.kiphub_admin_token;

    if (token) {
      const decoded = this.authService.verifyToken(token);
      if (decoded) {
        (request as Request & { userId: number }).userId = decoded.userId;
      }
    }
    // 항상 통과 — userId가 없으면 비로그인
    return true;
  }
}
