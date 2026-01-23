import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Scope,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { Role } from '@prisma/client';

import { FEATURE_FLAGS_KEY } from '../decorators/feature-flag.decorator';
import { FeatureFlagService } from '../feature-flag.service';

type AuthenticatedRequest = Request & {
  user?: {
    sub?: string;
    role?: Role;
  };
};

@Injectable({ scope: Scope.REQUEST })
export class FeatureFlagGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly featureFlags: FeatureFlagService,
  ) {}

  private pickVerticalType(req: Request): string | undefined {
    const q = req.query as Record<string, unknown>;
    const b = req.body as Record<string, unknown>;
    const p = req.params as Record<string, unknown>;

    const candidates = [
      q?.verticalType,
      b?.verticalType,
      p?.verticalType,
      q?.vertical,
      b?.vertical,
      p?.vertical,
    ];

    for (const c of candidates) {
      if (typeof c === 'string' && c.trim().length > 0) return c.trim();
    }

    return undefined;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredFlags = this.reflector.getAllAndOverride<string[]>(FEATURE_FLAGS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredFlags || requiredFlags.length === 0) {
      return true;
    }

    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const userId = req.user?.sub;
    const role = req.user?.role;
    const verticalType = this.pickVerticalType(req);

    for (const flagKey of requiredFlags) {
      const enabled = await this.featureFlags.isEnabled(flagKey, { userId, role, verticalType });
      if (!enabled) {
        throw new ForbiddenException(`Feature '${flagKey}' is not enabled`);
      }
    }

    return true;
  }
}
