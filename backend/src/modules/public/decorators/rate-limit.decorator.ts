/**
 * Rate Limit Decorator
 * Session 4.3 - Public API & Rate Limiting
 *
 * Decorator to apply rate limiting to endpoints.
 */

import { SetMetadata } from '@nestjs/common';

export const RATE_LIMIT_KEY = 'rateLimit';

export interface RateLimitOptions {
  /** Maximum requests allowed in the window */
  limit: number;
  /** Time window in seconds */
  windowSeconds: number;
  /** Key prefix for rate limiting (default: endpoint path) */
  keyPrefix?: string;
  /** Use IP-based rate limiting (default: true for public endpoints) */
  byIp?: boolean;
  /** Use tenant-based rate limiting */
  byTenant?: boolean;
  /** Use user-based rate limiting */
  byUser?: boolean;
  /** Skip rate limiting for specific roles */
  skipForRoles?: string[];
  /** Custom error message */
  message?: string;
}

/**
 * Apply rate limiting to an endpoint.
 *
 * @example
 * ```typescript
 * @RateLimit({ limit: 100, windowSeconds: 60 }) // 100 req/min
 * @Get('search')
 * async search() { ... }
 * ```
 */
export const RateLimit = (options: RateLimitOptions) => SetMetadata(RATE_LIMIT_KEY, options);

/**
 * Preset rate limits for common use cases.
 */
export const RateLimitPresets = {
  /** Public search: 60 requests per minute */
  PUBLIC_SEARCH: { limit: 60, windowSeconds: 60, byIp: true },

  /** Public read: 120 requests per minute */
  PUBLIC_READ: { limit: 120, windowSeconds: 60, byIp: true },

  /** Public write (lead capture): 10 requests per minute */
  PUBLIC_WRITE: { limit: 10, windowSeconds: 60, byIp: true },

  /** Authenticated API: 1000 requests per minute */
  AUTHENTICATED: { limit: 1000, windowSeconds: 60, byUser: true },

  /** Login attempts: 5 per 15 minutes */
  LOGIN: { limit: 5, windowSeconds: 900, byIp: true },

  /** Password reset: 3 per hour */
  PASSWORD_RESET: { limit: 3, windowSeconds: 3600, byIp: true },
} as const;
