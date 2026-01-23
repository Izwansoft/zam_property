import { Injectable, Logger } from '@nestjs/common';

import { CacheService } from './cache.service';
import { CacheTTL, RateLimitCacheKeys } from './cache-key.builder';

/**
 * Result of a rate limit check.
 */
export interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Current request count in the window */
  current: number;
  /** Maximum allowed requests */
  limit: number;
  /** Seconds until the window resets */
  resetIn: number;
  /** Remaining requests in the window */
  remaining: number;
}

/**
 * Rate limiting service using Redis sliding window algorithm.
 *
 * Per part-32.md:
 * - API rate limit: 1m window
 * - Login rate limit: 15m window
 */
@Injectable()
export class RateLimitService {
  private readonly logger = new Logger(RateLimitService.name);

  constructor(private readonly cacheService: CacheService) {}

  /**
   * Check rate limit using sliding window algorithm.
   *
   * @param key The rate limit key
   * @param limit Maximum requests allowed
   * @param windowSeconds Time window in seconds
   * @returns Rate limit result
   */
  async checkRateLimit(
    key: string,
    limit: number,
    windowSeconds: number,
  ): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStart = now - windowSeconds * 1000;

    // Remove expired entries
    await this.cacheService.zremrangebyscore(key, 0, windowStart);

    // Count current window
    const current = await this.cacheService.zcard(key);

    if (current >= limit) {
      this.logger.debug(`Rate limit exceeded: ${key} (${current}/${limit})`);
      return {
        allowed: false,
        current,
        limit,
        resetIn: windowSeconds,
        remaining: 0,
      };
    }

    // Add current request
    const member = `${now}:${Math.random().toString(36).slice(2)}`;
    await this.cacheService.zadd(key, now, member);

    // Set expiry on the key
    await this.cacheService.extendTtl(key, windowSeconds);

    return {
      allowed: true,
      current: current + 1,
      limit,
      resetIn: windowSeconds,
      remaining: Math.max(0, limit - current - 1),
    };
  }

  /**
   * Check API rate limit by IP.
   *
   * @param ip Client IP address
   * @param limit Requests per minute (default: 100)
   */
  async checkApiRateLimitByIp(ip: string, limit: number = 100): Promise<RateLimitResult> {
    const key = RateLimitCacheKeys.byIp(ip);
    return this.checkRateLimit(key, limit, CacheTTL.RATE_API);
  }

  /**
   * Check API rate limit by tenant and endpoint.
   *
   * @param tenantId Tenant ID
   * @param endpoint Endpoint identifier
   * @param limit Requests per minute (default: 1000)
   */
  async checkApiRateLimitByTenant(
    tenantId: string,
    endpoint: string,
    limit: number = 1000,
  ): Promise<RateLimitResult> {
    const key = RateLimitCacheKeys.byTenantEndpoint(tenantId, endpoint);
    return this.checkRateLimit(key, limit, CacheTTL.RATE_API);
  }

  /**
   * Check API rate limit by user and endpoint.
   *
   * @param userId User ID
   * @param endpoint Endpoint identifier
   * @param limit Requests per minute (default: 100)
   */
  async checkApiRateLimitByUser(
    userId: string,
    endpoint: string,
    limit: number = 100,
  ): Promise<RateLimitResult> {
    const key = RateLimitCacheKeys.byUserEndpoint(userId, endpoint);
    return this.checkRateLimit(key, limit, CacheTTL.RATE_API);
  }

  /**
   * Check login rate limit by IP.
   *
   * @param ip Client IP address
   * @param limit Attempts per 15 minutes (default: 5)
   */
  async checkLoginRateLimitByIp(ip: string, limit: number = 5): Promise<RateLimitResult> {
    const key = RateLimitCacheKeys.loginByIp(ip);
    return this.checkRateLimit(key, limit, CacheTTL.RATE_LOGIN);
  }

  /**
   * Check login rate limit by email.
   *
   * @param email User email
   * @param limit Attempts per 15 minutes (default: 5)
   */
  async checkLoginRateLimitByEmail(email: string, limit: number = 5): Promise<RateLimitResult> {
    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();
    const key = RateLimitCacheKeys.loginByEmail(normalizedEmail);
    return this.checkRateLimit(key, limit, CacheTTL.RATE_LOGIN);
  }

  /**
   * Reset rate limit for a key.
   * Use with caution - only for admin actions.
   */
  async resetRateLimit(key: string): Promise<void> {
    await this.cacheService.del(key);
    this.logger.warn(`Rate limit reset: ${key}`);
  }

  /**
   * Get current rate limit status without incrementing.
   */
  async getRateLimitStatus(
    key: string,
    limit: number,
    windowSeconds: number,
  ): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStart = now - windowSeconds * 1000;

    // Remove expired entries
    await this.cacheService.zremrangebyscore(key, 0, windowStart);

    // Count current window
    const current = await this.cacheService.zcard(key);

    return {
      allowed: current < limit,
      current,
      limit,
      resetIn: windowSeconds,
      remaining: Math.max(0, limit - current),
    };
  }
}
