import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async signIn(user: any) {
    const payload = { username: user.username, role: user.role, name: user.first_name, position: user.position }; // Include roles
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
} 
