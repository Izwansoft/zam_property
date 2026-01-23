import { Global, Module } from '@nestjs/common';

import { RedisModule } from '../redis/redis.module';
import { MemoryCacheService } from './memory-cache.service';
import { CacheService } from './cache.service';
import { DistributedLockService } from './distributed-lock.service';
import { CacheInvalidationService } from './cache-invalidation.service';
import { RateLimitService } from './rate-limit.service';
import { CacheInterceptor } from './decorators/cache.interceptor';

/**
 * Cache module providing multi-tier caching (L1 + L2).
 *
 * Services:
 * - MemoryCacheService: L1 in-memory cache (node-cache)
 * - CacheService: Multi-tier cache (L1 + L2 Redis)
 * - DistributedLockService: Redis-based distributed locking
 * - CacheInvalidationService: Event-driven cache invalidation
 * - RateLimitService: Sliding window rate limiting
 *
 * Decorators:
 * - @Cacheable(): Cache method results
 * - @CacheEvict(): Evict cache on method execution
 * - @CachePut(): Always update cache after method execution
 *
 * Apply CacheInterceptor to enable decorator-based caching.
 */
@Global()
@Module({
  imports: [RedisModule],
  providers: [
    MemoryCacheService,
    CacheService,
    DistributedLockService,
    CacheInvalidationService,
    RateLimitService,
    CacheInterceptor,
  ],
  exports: [
    MemoryCacheService,
    CacheService,
    DistributedLockService,
    CacheInvalidationService,
    RateLimitService,
    CacheInterceptor,
  ],
})
export class CacheModule {}
