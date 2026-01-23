import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of, from } from 'rxjs';
import { tap, switchMap } from 'rxjs/operators';

import { CacheService } from '../cache.service';
import { CacheTTL } from '../cache-key.builder';
import {
  CACHEABLE_METADATA_KEY,
  CACHE_EVICT_METADATA_KEY,
  CACHE_PUT_METADATA_KEY,
  type CacheableMetadata,
  type CacheEvictMetadata,
  type CachePutMetadata,
} from './cacheable.decorator';

/**
 * Interceptor that handles @Cacheable, @CacheEvict, and @CachePut decorators.
 *
 * Apply to controllers or methods to enable automatic caching.
 *
 * @example
 * ```typescript
 * @UseInterceptors(CacheInterceptor)
 * @Controller('listings')
 * export class ListingController { ... }
 * ```
 */
@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CacheInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly cacheService: CacheService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const handler = context.getHandler();
    const args = context.getArgs();

    // Check for @Cacheable
    const cacheableMetadata = this.reflector.get<CacheableMetadata>(
      CACHEABLE_METADATA_KEY,
      handler,
    );

    if (cacheableMetadata) {
      return this.handleCacheable(cacheableMetadata, args, next);
    }

    // Check for @CacheEvict
    const cacheEvictMetadata = this.reflector.get<CacheEvictMetadata>(
      CACHE_EVICT_METADATA_KEY,
      handler,
    );

    if (cacheEvictMetadata) {
      return this.handleCacheEvict(cacheEvictMetadata, args, next);
    }

    // Check for @CachePut
    const cachePutMetadata = this.reflector.get<CachePutMetadata>(CACHE_PUT_METADATA_KEY, handler);

    if (cachePutMetadata) {
      return this.handleCachePut(cachePutMetadata, args, next);
    }

    // No cache decorator, proceed normally
    return next.handle();
  }

  /**
   * Handle @Cacheable decorator.
   * Check cache first, return cached value if found, otherwise execute and cache.
   */
  private handleCacheable(
    metadata: CacheableMetadata,
    args: unknown[],
    next: CallHandler,
  ): Observable<unknown> {
    const { options } = metadata;
    const cacheKey = this.resolveKey(options.key, args);
    const ttl = options.ttl ?? CacheTTL.LISTING;

    return from(this.cacheService.get(cacheKey)).pipe(
      switchMap((cached) => {
        if (cached !== null) {
          this.logger.debug(`Cache hit: ${cacheKey}`);

          // Extend TTL if configured
          if (options.refreshTtl) {
            void this.cacheService.extendTtl(cacheKey, ttl);
          }

          return of(cached);
        }

        this.logger.debug(`Cache miss: ${cacheKey}`);

        // Execute method and cache result
        return next.handle().pipe(
          tap(async (result) => {
            // Check condition
            const shouldCache =
              options.condition?.(result) ?? (result !== null && result !== undefined);

            if (shouldCache) {
              await this.cacheService.set(cacheKey, result, {
                ttl,
                useMemoryCache: options.useMemoryCache,
                memoryTtl: options.memoryTtl,
              });
            }
          }),
        );
      }),
    );
  }

  /**
   * Handle @CacheEvict decorator.
   * Evict cache keys before or after method execution.
   */
  private handleCacheEvict(
    metadata: CacheEvictMetadata,
    args: unknown[],
    next: CallHandler,
  ): Observable<unknown> {
    const { options } = metadata;
    const keys = this.resolveKeys(options.keys, args);
    const timing = options.timing ?? 'after';

    if (timing === 'before') {
      // Evict before execution
      return from(this.evictKeys(keys, options.pattern ?? false)).pipe(
        switchMap(() => next.handle()),
      );
    }

    // Evict after execution
    return next.handle().pipe(
      tap(async (result) => {
        const shouldEvict = options.condition?.(result) ?? true;
        if (shouldEvict) {
          await this.evictKeys(keys, options.pattern ?? false);
        }
      }),
    );
  }

  /**
   * Handle @CachePut decorator.
   * Always execute method and update cache with result.
   */
  private handleCachePut(
    metadata: CachePutMetadata,
    args: unknown[],
    next: CallHandler,
  ): Observable<unknown> {
    const { options } = metadata;
    const cacheKey = this.resolveKey(options.key, args);
    const ttl = options.ttl ?? CacheTTL.LISTING;

    return next.handle().pipe(
      tap(async (result) => {
        const shouldCache =
          options.condition?.(result) ?? (result !== null && result !== undefined);

        if (shouldCache) {
          await this.cacheService.set(cacheKey, result, {
            ttl,
            useMemoryCache: options.useMemoryCache,
          });
          this.logger.debug(`Cache put: ${cacheKey}`);
        }
      }),
    );
  }

  /**
   * Resolve cache key from string or function.
   */
  private resolveKey(key: string | ((...args: unknown[]) => string), args: unknown[]): string {
    if (typeof key === 'function') {
      return key(...args);
    }
    return key;
  }

  /**
   * Resolve cache keys from string, array, or function.
   */
  private resolveKeys(
    keys: string | string[] | ((...args: unknown[]) => string | string[]),
    args: unknown[],
  ): string[] {
    if (typeof keys === 'function') {
      const result = keys(...args);
      return Array.isArray(result) ? result : [result];
    }
    return Array.isArray(keys) ? keys : [keys];
  }

  /**
   * Evict cache keys.
   */
  private async evictKeys(keys: string[], pattern: boolean): Promise<void> {
    for (const key of keys) {
      if (pattern) {
        await this.cacheService.delByPattern(key);
      } else {
        await this.cacheService.del(key);
      }
      this.logger.debug(`Cache evict: ${key}`);
    }
  }
}
