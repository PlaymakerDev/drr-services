import { Injectable, NestMiddleware, HttpException, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';  // ใช้ Request จาก express

export interface UserRequest extends Request {  // ขยาย Request ของ express
  user?: any;
}

@Injectable()
export class JwtMiddleware implements NestMiddleware {
  constructor(private jwtService: JwtService) {}

  use(req: UserRequest, res: any, next: () => void) {

    // ข้ามเส้นทางที่ไม่ต้องตรวจสอบ token
    if (req.baseUrl.startsWith('/api/v1/report/view_monthly_summary')) {
      return next();
    } else if (req.baseUrl.startsWith('/api/v1/report/export_test')) {
      return next();
    }

    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
      throw new HttpException('Token is required for authentication', HttpStatus.FORBIDDEN);
    }

    const decodedToken = this.jwtService.decode(token);

    const { exp } = decodedToken;
    if (exp < (new Date().getTime() + 1) / 1000) {
      throw new UnauthorizedException('Session expired');
    }

    try {
      const verified = this.jwtService.verify(token, { secret: process.env.JWT_SECRET });
      req.user = verified;
      
      next();
    } catch (error) {
      throw new HttpException('Invalid Token', HttpStatus.UNAUTHORIZED);
    }
  }
}