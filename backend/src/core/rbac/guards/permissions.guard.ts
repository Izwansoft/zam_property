import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';

import type { JwtPayload } from '@core/auth/types/jwt-payload.type';

import { PERMISSIONS_KEY } from '../decorators/require-permission.decorator';
import { getPermissionsForRole, hasPermission } from '../rbac.permissions';

type AuthenticatedRequest = Request & { user?: JwtPayload };

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;
    if (!user) {
      throw new UnauthorizedException('Missing authenticated user');
    }

    const granted = user.permissions?.length ? user.permissions : getPermissionsForRole(user.role);

    const ok = requiredPermissions.every((permission) => hasPermission(granted, permission));
    if (!ok) {
      throw new ForbiddenException('Missing required permission');
    }

    return true;
  }
}
