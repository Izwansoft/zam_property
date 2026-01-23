import { Injectable, Logger } from '@nestjs/common';
import * as NodeCache from 'node-cache';
import type { Stats as NodeCacheStats } from 'node-cache';

/**
 * In-memory cache service (L1 cache layer).
 * Uses node-cache for extremely hot data with short TTL.
 *
 * Per part-32.md:
 * - Feature flags: 30s, max 100 entries
 * - Vertical schemas: 5m, max 50 entries
 * - Plan definitions: 5m, max 20 entries
 * - Tenant basic info: 1m, max 1000 entries
 */
@Injectable()
export class MemoryCacheService {
  private readonly logger = new Logger(MemoryCacheService.name);
  private readonly cache: NodeCache;

  constructor() {
    this.cache = new NodeCache({
      stdTTL: 60, // Default TTL: 60 seconds
      checkperiod: 30, // Check for expired keys every 30 seconds
      maxKeys: 1000, // Maximum 1000 keys
      useClones: true, // Return cloned objects to prevent mutation
      deleteOnExpire: true,
    });

    this.cache.on('expired', (key: string) => {
      this.logger.debug(`Memory cache key expired: ${key}`);
    });
  }

  /**
   * Get a value from the memory cache.
   */
  get<T>(key: string): T | undefined {
    return this.cache.get<T>(key);
  }

  /**
   * Set a value in the memory cache.
   * @param key Cache key
   * @param value Value to cache
   * @param ttlSeconds Optional TTL in seconds (default: 60)
   */
  set<T>(key: string, value: T, ttlSeconds?: number): boolean {
    return this.cache.set(key, value, ttlSeconds ?? 60);
  }

  /**
   * Get a value or set it if not present.
   * Atomic operation that fetches from source if cache miss.
   */
  async getOrSet<T>(key: string, fetcher: () => Promise<T>, ttlSeconds?: number): Promise<T> {
    const cached = this.cache.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }

    const value = await fetcher();
    this.cache.set(key, value, ttlSeconds ?? 60);
    return value;
  }

  /**
   * Delete a key from the cache.
   */
  del(key: string): number {
    return this.cache.del(key);
  }

  /**
   * Delete multiple keys from the cache.
   */
  delMany(keys: string[]): number {
    return this.cache.del(keys);
  }

  /**
   * Delete all keys matching a prefix.
   */
  delByPrefix(prefix: string): number {
    const keys = this.cache.keys().filter((k: string) => k.startsWith(prefix));
    return this.cache.del(keys);
  }

  /**
   * Check if a key exists in the cache.
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * Get all keys in the cache.
   */
  keys(): string[] {
    return this.cache.keys();
  }

  /**
   * Get cache statistics.
   */
  getStats(): NodeCacheStats {
    return this.cache.getStats();
  }

  /**
   * Flush all cached data.
   */
  flush(): void {
    this.cache.flushAll();
    this.logger.log('Memory cache flushed');
  }

  /**
   * Get the TTL for a key (in seconds).
   * Returns undefined if key doesn't exist.
   */
  getTtl(key: string): number | undefined {
    return this.cache.getTtl(key);
  }

  /**
   * Update the TTL for a key.
   */
  setTtl(key: string, ttlSeconds: number): boolean {
    return this.cache.ttl(key, ttlSeconds);
  }
}
