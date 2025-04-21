import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext) {
    const requiredRoles = await this.reflector.getAllAndOverride<number[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    

    if (!requiredRoles) {
      return true; // No roles required, allow access
    }

    const request = context.switchToHttp().getRequest();
    
    const user = request.user; // This should have roles


    if (!user || !user.role) {
      throw new ForbiddenException('User does not have roles defined');
    }

    const hasRole = () => {
      return (requiredRoles).includes(user.role);
    };
    

    if (!hasRole()) {
      throw new ForbiddenException('Access denied');
    }

    return true;
  }
}
