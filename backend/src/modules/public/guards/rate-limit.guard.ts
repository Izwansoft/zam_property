/**
 * Rate Limit Guard
 * Session 4.3 - Public API & Rate Limiting
 *
 * Guard that enforces rate limiting on endpoints.
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

import { RateLimitService, RateLimitResult } from '@infrastructure/cache/rate-limit.service';
import { RATE_LIMIT_KEY, RateLimitOptions } from '../decorators/rate-limit.decorator';

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly rateLimitService: RateLimitService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const rateLimitOptions = this.reflector.getAllAndOverride<RateLimitOptions | undefined>(
      RATE_LIMIT_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no rate limit decorator, allow through
    if (!rateLimitOptions) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const key = this.buildRateLimitKey(request, rateLimitOptions);

    const result = await this.rateLimitService.checkRateLimit(
      key,
      rateLimitOptions.limit,
      rateLimitOptions.windowSeconds,
    );

    // Set rate limit headers
    this.setRateLimitHeaders(context, result);

    if (!result.allowed) {
      this.logger.warn(`Rate limit exceeded: ${key} (${result.current}/${result.limit})`);
      throw new HttpException(
        {
          error: {
            code: 'RATE_LIMITED',
            message:
              rateLimitOptions.message ||
              `Too many requests. Please try again in ${result.resetIn} seconds.`,
          },
          meta: {
            requestId: request.headers['x-request-id'] || 'unknown',
          },
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }

  private buildRateLimitKey(request: Request, options: RateLimitOptions): string {
    const parts: string[] = ['rate'];

    // Add key prefix or use path
    const prefix = options.keyPrefix || request.path.replace(/\//g, ':');
    parts.push(prefix);

    // Add IP if byIp is enabled (default for public endpoints)
    if (options.byIp !== false) {
      const ip = this.getClientIp(request);
      parts.push(`ip:${ip}`);
    }

    // Add tenant if byTenant is enabled
    if (options.byTenant) {
      const tenantId = request.headers['x-tenant-id'] as string;
      if (tenantId) {
        parts.push(`tenant:${tenantId}`);
      }
    }

    // Add user if byUser is enabled
    if (options.byUser) {
      const user = (request as Request & { user?: { sub?: string } }).user;
      if (user?.sub) {
        parts.push(`user:${user.sub}`);
      }
    }

    return parts.join(':');
  }

  private getClientIp(request: Request): string {
    // Check common proxy headers
    const forwardedFor = request.headers['x-forwarded-for'];
    if (forwardedFor) {
      const ips = (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor).split(',');
      return ips[0].trim();
    }

    const realIp = request.headers['x-real-ip'];
    if (realIp) {
      return Array.isArray(realIp) ? realIp[0] : realIp;
    }

    return request.ip || request.socket.remoteAddress || 'unknown';
  }

  private setRateLimitHeaders(context: ExecutionContext, result: RateLimitResult): void {
    const response = context.switchToHttp().getResponse();

    response.setHeader('X-RateLimit-Limit', result.limit);
    response.setHeader('X-RateLimit-Remaining', result.remaining);
    response.setHeader('X-RateLimit-Reset', Math.floor(Date.now() / 1000) + result.resetIn);
  }
}
