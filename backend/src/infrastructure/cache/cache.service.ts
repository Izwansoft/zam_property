import { Injectable, Logger } from '@nestjs/common';
import type Redis from 'ioredis';
import type { Stats as NodeCacheStats } from 'node-cache';

import { RedisService } from '../redis/redis.service';
import { MemoryCacheService } from './memory-cache.service';
import { CacheTTL } from './cache-key.builder';

/**
 * Options for cache operations.
 */
export interface CacheOptions {
  /** TTL in seconds */
  ttl?: number;
  /** Use L1 (memory) cache in addition to L2 (Redis) */
  useMemoryCache?: boolean;
  /** TTL for memory cache (L1) in seconds */
  memoryTtl?: number;
}

/**
 * Multi-tier cache service following part-32.md specifications.
 *
 * Cache Layers:
 * - L1: In-memory cache (node-cache) for hot data
 * - L2: Redis cache for distributed caching
 *
 * Flow:
 * 1. Check L1 (memory) if enabled
 * 2. Check L2 (Redis) if L1 miss
 * 3. Fetch from source on cache miss
 * 4. Store in L2 and optionally L1
 */
@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly redis: Redis;

  constructor(
    private readonly redisService: RedisService,
    private readonly memoryCache: MemoryCacheService,
  ) {
    this.redis = this.redisService.getClient();
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Basic Operations
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Get a value from cache (L1 → L2).
   */
  async get<T>(key: string, options?: CacheOptions): Promise<T | null> {
    // Try L1 first if enabled
    if (options?.useMemoryCache !== false) {
      const memoryValue = this.memoryCache.get<T>(key);
      if (memoryValue !== undefined) {
        this.logger.debug(`L1 cache hit: ${key}`);
        return memoryValue;
      }
    }

    // Try L2 (Redis)
    try {
      const value = await this.redis.get(key);
      if (value === null) {
        this.logger.debug(`Cache miss: ${key}`);
        return null;
      }

      this.logger.debug(`L2 cache hit: ${key}`);
      const parsed = JSON.parse(value) as T;

      // Populate L1 on L2 hit
      if (options?.useMemoryCache !== false) {
        this.memoryCache.set(key, parsed, options?.memoryTtl ?? CacheTTL.MEMORY_SHORT);
      }

      return parsed;
    } catch (error) {
      this.logger.error(`Cache get error for ${key}: ${error}`);
      return null;
    }
  }

  /**
   * Set a value in cache.
   */
  async set<T>(key: string, value: T, options?: CacheOptions): Promise<boolean> {
    try {
      const ttl = options?.ttl ?? CacheTTL.LISTING;
      const serialized = JSON.stringify(value);

      await this.redis.setex(key, ttl, serialized);

      // Also set in L1 if enabled
      if (options?.useMemoryCache !== false) {
        this.memoryCache.set(
          key,
          value,
          options?.memoryTtl ?? Math.min(ttl, CacheTTL.MEMORY_MEDIUM),
        );
      }

      this.logger.debug(`Cache set: ${key} (TTL: ${ttl}s)`);
      return true;
    } catch (error) {
      this.logger.error(`Cache set error for ${key}: ${error}`);
      return false;
    }
  }

  /**
   * Get or set pattern - fetch from cache or compute and cache.
   */
  async getOrSet<T>(key: string, fetcher: () => Promise<T>, options?: CacheOptions): Promise<T> {
    // Try cache first
    const cached = await this.get<T>(key, options);
    if (cached !== null) {
      return cached;
    }

    // Cache miss - fetch from source
    const value = await fetcher();

    // Cache the result
    await this.set(key, value, options);

    return value;
  }

  /**
   * Delete a key from both L1 and L2.
   */
  async del(key: string): Promise<boolean> {
    try {
      this.memoryCache.del(key);
      await this.redis.del(key);
      this.logger.debug(`Cache deleted: ${key}`);
      return true;
    } catch (error) {
      this.logger.error(`Cache delete error for ${key}: ${error}`);
      return false;
    }
  }

  /**
   * Delete multiple keys.
   */
  async delMany(keys: string[]): Promise<number> {
    if (keys.length === 0) return 0;

    try {
      this.memoryCache.delMany(keys);
      const deleted = await this.redis.del(...keys);
      this.logger.debug(`Cache deleted ${deleted} keys`);
      return deleted;
    } catch (error) {
      this.logger.error(`Cache delMany error: ${error}`);
      return 0;
    }
  }

  /**
   * Check if a key exists.
   */
  async exists(key: string): Promise<boolean> {
    // Check L1 first
    if (this.memoryCache.has(key)) {
      return true;
    }

    try {
      const exists = await this.redis.exists(key);
      return exists === 1;
    } catch (error) {
      this.logger.error(`Cache exists error for ${key}: ${error}`);
      return false;
    }
  }

  /**
   * Get TTL for a key (in seconds).
   */
  async ttl(key: string): Promise<number> {
    try {
      return await this.redis.ttl(key);
    } catch (error) {
      this.logger.error(`Cache TTL error for ${key}: ${error}`);
      return -1;
    }
  }

  /**
   * Extend TTL for a key (keep hot data warm).
   */
  async extendTtl(key: string, ttlSeconds: number): Promise<boolean> {
    try {
      const result = await this.redis.expire(key, ttlSeconds);
      return result === 1;
    } catch (error) {
      this.logger.error(`Cache extendTtl error for ${key}: ${error}`);
      return false;
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Pattern-Based Operations
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Delete all keys matching a pattern.
   * Uses SCAN to avoid blocking Redis.
   */
  async delByPattern(pattern: string): Promise<number> {
    let cursor = '0';
    let totalDeleted = 0;

    try {
      // Also clear matching keys from L1
      this.memoryCache.delByPrefix(pattern.replace('*', ''));

      do {
        const [nextCursor, keys] = await this.redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = nextCursor;

        if (keys.length > 0) {
          const deleted = await this.redis.del(...keys);
          totalDeleted += deleted;
        }
      } while (cursor !== '0');

      this.logger.debug(`Deleted ${totalDeleted} keys matching: ${pattern}`);
      return totalDeleted;
    } catch (error) {
      this.logger.error(`Cache delByPattern error for ${pattern}: ${error}`);
      return totalDeleted;
    }
  }

  /**
   * Find all keys matching a pattern.
   */
  async keys(pattern: string): Promise<string[]> {
    const allKeys: string[] = [];
    let cursor = '0';

    try {
      do {
        const [nextCursor, keys] = await this.redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = nextCursor;
        allKeys.push(...keys);
      } while (cursor !== '0');

      return allKeys;
    } catch (error) {
      this.logger.error(`Cache keys error for ${pattern}: ${error}`);
      return [];
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Hash Operations
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Set a hash field.
   */
  async hset(key: string, field: string, value: unknown, ttlSeconds?: number): Promise<boolean> {
    try {
      await this.redis.hset(key, field, JSON.stringify(value));
      if (ttlSeconds) {
        await this.redis.expire(key, ttlSeconds);
      }
      return true;
    } catch (error) {
      this.logger.error(`Cache hset error for ${key}:${field}: ${error}`);
      return false;
    }
  }

  /**
   * Get a hash field.
   */
  async hget<T>(key: string, field: string): Promise<T | null> {
    try {
      const value = await this.redis.hget(key, field);
      return value ? (JSON.parse(value) as T) : null;
    } catch (error) {
      this.logger.error(`Cache hget error for ${key}:${field}: ${error}`);
      return null;
    }
  }

  /**
   * Get all fields from a hash.
   */
  async hgetall<T>(key: string): Promise<Record<string, T> | null> {
    try {
      const hash = await this.redis.hgetall(key);
      if (!hash || Object.keys(hash).length === 0) {
        return null;
      }

      const result: Record<string, T> = {};
      for (const [field, value] of Object.entries(hash)) {
        result[field] = JSON.parse(value) as T;
      }
      return result;
    } catch (error) {
      this.logger.error(`Cache hgetall error for ${key}: ${error}`);
      return null;
    }
  }

  /**
   * Delete a hash field.
   */
  async hdel(key: string, field: string): Promise<boolean> {
    try {
      const result = await this.redis.hdel(key, field);
      return result === 1;
    } catch (error) {
      this.logger.error(`Cache hdel error for ${key}:${field}: ${error}`);
      return false;
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Counter Operations
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Increment a counter.
   */
  async incr(key: string, ttlSeconds?: number): Promise<number> {
    try {
      const value = await this.redis.incr(key);
      if (ttlSeconds && value === 1) {
        await this.redis.expire(key, ttlSeconds);
      }
      return value;
    } catch (error) {
      this.logger.error(`Cache incr error for ${key}: ${error}`);
      return 0;
    }
  }

  /**
   * Increment by a specific amount.
   */
  async incrBy(key: string, amount: number, ttlSeconds?: number): Promise<number> {
    try {
      const value = await this.redis.incrby(key, amount);
      if (ttlSeconds) {
        await this.redis.expire(key, ttlSeconds);
      }
      return value;
    } catch (error) {
      this.logger.error(`Cache incrBy error for ${key}: ${error}`);
      return 0;
    }
  }

  /**
   * Decrement a counter.
   */
  async decr(key: string): Promise<number> {
    try {
      return await this.redis.decr(key);
    } catch (error) {
      this.logger.error(`Cache decr error for ${key}: ${error}`);
      return 0;
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Set Operations (for rate limiting)
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Add to a sorted set (for sliding window rate limiting).
   */
  async zadd(key: string, score: number, member: string): Promise<boolean> {
    try {
      await this.redis.zadd(key, score, member);
      return true;
    } catch (error) {
      this.logger.error(`Cache zadd error for ${key}: ${error}`);
      return false;
    }
  }

  /**
   * Remove members from sorted set by score range.
   */
  async zremrangebyscore(key: string, min: number, max: number): Promise<number> {
    try {
      return await this.redis.zremrangebyscore(key, min, max);
    } catch (error) {
      this.logger.error(`Cache zremrangebyscore error for ${key}: ${error}`);
      return 0;
    }
  }

  /**
   * Count members in a sorted set.
   */
  async zcard(key: string): Promise<number> {
    try {
      return await this.redis.zcard(key);
    } catch (error) {
      this.logger.error(`Cache zcard error for ${key}: ${error}`);
      return 0;
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Health & Stats
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Get memory cache statistics.
   */
  getMemoryStats(): NodeCacheStats {
    return this.memoryCache.getStats();
  }

  /**
   * Flush memory cache.
   */
  flushMemory(): void {
    this.memoryCache.flush();
  }

  /**
   * Flush all caches (L1 + L2).
   * Use with caution in production!
   */
  async flushAll(): Promise<void> {
    this.memoryCache.flush();
    await this.redis.flushdb();
    this.logger.warn('All caches flushed!');
  }
}
