import { Injectable, Logger, ConflictException } from '@nestjs/common';
import type Redis from 'ioredis';
import { randomUUID } from 'crypto';

import { RedisService } from '../redis/redis.service';
import { CacheTTL } from './cache-key.builder';

/**
 * Distributed lock service using Redis.
 * Implements the Redlock-style pattern for distributed locking.
 *
 * Per part-32.md:
 * - Listing publish: 30s
 * - Subscription change: 60s
 * - Invoice generation: 120s
 * - Media processing: 300s
 */
@Injectable()
export class DistributedLockService {
  private readonly logger = new Logger(DistributedLockService.name);
  private readonly redis: Redis;

  /** Lua script to safely release lock (only if we own it) */
  private readonly releaseLockScript = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("del", KEYS[1])
    else
      return 0
    end
  `;

  /** Lua script to extend lock (only if we own it) */
  private readonly extendLockScript = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("pexpire", KEYS[1], ARGV[2])
    else
      return 0
    end
  `;

  constructor(private readonly redisService: RedisService) {
    this.redis = this.redisService.getClient();
  }

  /**
   * Acquire a distributed lock.
   *
   * @param resource The resource identifier (e.g., "listing:publish:uuid")
   * @param ttlMs Lock TTL in milliseconds (default: 30s)
   * @returns Lock ID if acquired, null if lock is held by another process
   */
  async acquireLock(
    resource: string,
    ttlMs: number = CacheTTL.LOCK_DEFAULT * 1000,
  ): Promise<string | null> {
    const lockId = randomUUID();
    const key = `lock:${resource}`;

    try {
      const acquired = await this.redis.set(key, lockId, 'PX', ttlMs, 'NX');

      if (acquired === 'OK') {
        this.logger.debug(`Lock acquired: ${resource} (id: ${lockId})`);
        return lockId;
      }

      this.logger.debug(`Lock not acquired (already held): ${resource}`);
      return null;
    } catch (error) {
      this.logger.error(`Error acquiring lock for ${resource}: ${error}`);
      return null;
    }
  }

  /**
   * Release a distributed lock.
   * Only releases if the lock is owned by the given lockId.
   *
   * @param resource The resource identifier
   * @param lockId The lock ID returned from acquireLock
   * @returns true if lock was released, false otherwise
   */
  async releaseLock(resource: string, lockId: string): Promise<boolean> {
    const key = `lock:${resource}`;

    try {
      const result = await this.redis.eval(this.releaseLockScript, 1, key, lockId);

      const released = result === 1;
      if (released) {
        this.logger.debug(`Lock released: ${resource}`);
      } else {
        this.logger.warn(`Lock not released (not owner or expired): ${resource}`);
      }

      return released;
    } catch (error) {
      this.logger.error(`Error releasing lock for ${resource}: ${error}`);
      return false;
    }
  }

  /**
   * Extend a lock's TTL.
   * Only extends if the lock is owned by the given lockId.
   *
   * @param resource The resource identifier
   * @param lockId The lock ID returned from acquireLock
   * @param ttlMs New TTL in milliseconds
   * @returns true if lock was extended, false otherwise
   */
  async extendLock(resource: string, lockId: string, ttlMs: number): Promise<boolean> {
    const key = `lock:${resource}`;

    try {
      const result = await this.redis.eval(this.extendLockScript, 1, key, lockId, ttlMs.toString());

      return result === 1;
    } catch (error) {
      this.logger.error(`Error extending lock for ${resource}: ${error}`);
      return false;
    }
  }

  /**
   * Check if a resource is locked.
   */
  async isLocked(resource: string): Promise<boolean> {
    const key = `lock:${resource}`;

    try {
      const exists = await this.redis.exists(key);
      return exists === 1;
    } catch (error) {
      this.logger.error(`Error checking lock for ${resource}: ${error}`);
      return false;
    }
  }

  /**
   * Execute a function while holding a lock.
   * Automatically acquires and releases the lock.
   *
   * @param resource The resource identifier
   * @param fn The function to execute
   * @param ttlMs Lock TTL in milliseconds
   * @throws ConflictException if lock cannot be acquired
   */
  async withLock<T>(
    resource: string,
    fn: () => Promise<T>,
    ttlMs: number = CacheTTL.LOCK_DEFAULT * 1000,
  ): Promise<T> {
    const lockId = await this.acquireLock(resource, ttlMs);

    if (!lockId) {
      throw new ConflictException(`Resource is locked: ${resource}`);
    }

    try {
      return await fn();
    } finally {
      await this.releaseLock(resource, lockId);
    }
  }

  /**
   * Execute a function while holding a lock, with retry.
   *
   * @param resource The resource identifier
   * @param fn The function to execute
   * @param options Lock options
   */
  async withLockRetry<T>(
    resource: string,
    fn: () => Promise<T>,
    options: {
      ttlMs?: number;
      retries?: number;
      retryDelayMs?: number;
    } = {},
  ): Promise<T> {
    const { ttlMs = CacheTTL.LOCK_DEFAULT * 1000, retries = 3, retryDelayMs = 100 } = options;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      const lockId = await this.acquireLock(resource, ttlMs);

      if (lockId) {
        try {
          return await fn();
        } finally {
          await this.releaseLock(resource, lockId);
        }
      }

      if (attempt < retries) {
        // Exponential backoff
        const delay = retryDelayMs * Math.pow(2, attempt);
        await this.sleep(delay);
      }

      lastError = new ConflictException(`Resource is locked: ${resource}`);
    }

    throw lastError;
  }

  /**
   * Try to acquire a lock, execute function if successful, skip if not.
   * Useful for "at-most-once" execution patterns.
   *
   * @param resource The resource identifier
   * @param fn The function to execute
   * @param ttlMs Lock TTL in milliseconds
   * @returns Result of fn, or null if lock was not acquired
   */
  async tryWithLock<T>(
    resource: string,
    fn: () => Promise<T>,
    ttlMs: number = CacheTTL.LOCK_DEFAULT * 1000,
  ): Promise<T | null> {
    const lockId = await this.acquireLock(resource, ttlMs);

    if (!lockId) {
      this.logger.debug(`Skipping locked resource: ${resource}`);
      return null;
    }

    try {
      return await fn();
    } finally {
      await this.releaseLock(resource, lockId);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
