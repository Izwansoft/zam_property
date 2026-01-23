import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key for cacheable decorator.
 */
export const CACHEABLE_METADATA_KEY = 'cacheable';

/**
 * Options for the @Cacheable() decorator.
 */
export interface CacheableOptions {
  /**
   * Cache key or function to generate cache key.
   * If a function, receives the method arguments.
   */
  key: string | ((...args: unknown[]) => string);

  /**
   * TTL in seconds.
   */
  ttl?: number;

  /**
   * Whether to use L1 (memory) cache in addition to L2 (Redis).
   * Default: true
   */
  useMemoryCache?: boolean;

  /**
   * TTL for memory cache (L1) in seconds.
   * Default: min(ttl, 60)
   */
  memoryTtl?: number;

  /**
   * Condition function to determine if result should be cached.
   * Default: cache if result is not null/undefined
   */
  condition?: (result: unknown) => boolean;

  /**
   * Whether to extend TTL on cache hit.
   * Keeps frequently accessed data warm.
   * Default: false
   */
  refreshTtl?: boolean;
}

/**
 * Metadata for cacheable methods.
 */
export interface CacheableMetadata {
  options: CacheableOptions;
}

/**
 * Decorator to mark a method as cacheable.
 *
 * The actual caching is handled by CacheInterceptor which reads this metadata.
 *
 * @example
 * ```typescript
 * @Cacheable({
 *   key: (tenantId: string, listingId: string) =>
 *     EntityCacheKeys.listing(tenantId, listingId),
 *   ttl: CacheTTL.LISTING,
 * })
 * async getListing(tenantId: string, listingId: string): Promise<Listing> {
 *   return this.prisma.listing.findUnique({ where: { id: listingId } });
 * }
 * ```
 *
 * @example With static key
 * ```typescript
 * @Cacheable({ key: 'cfg:g:feature-flags', ttl: 60 })
 * async getFeatureFlags(): Promise<FeatureFlags> {
 *   return this.prisma.featureFlag.findMany();
 * }
 * ```
 */
export function Cacheable(options: CacheableOptions): MethodDecorator {
  return SetMetadata<string, CacheableMetadata>(CACHEABLE_METADATA_KEY, {
    options,
  });
}

/**
 * Metadata key for cache evict decorator.
 */
export const CACHE_EVICT_METADATA_KEY = 'cache_evict';

/**
 * Options for the @CacheEvict() decorator.
 */
export interface CacheEvictOptions {
  /**
   * Cache key(s) or pattern(s) to evict.
   * Can be a function that receives method arguments.
   */
  keys: string | string[] | ((...args: unknown[]) => string | string[]);

  /**
   * Whether to use pattern matching (SCAN).
   * Default: false
   */
  pattern?: boolean;

  /**
   * Whether to evict before or after method execution.
   * Default: 'after'
   */
  timing?: 'before' | 'after';

  /**
   * Condition function to determine if cache should be evicted.
   * Default: always evict
   */
  condition?: (result: unknown) => boolean;
}

/**
 * Metadata for cache evict methods.
 */
export interface CacheEvictMetadata {
  options: CacheEvictOptions;
}

/**
 * Decorator to evict cache on method execution.
 *
 * @example
 * ```typescript
 * @CacheEvict({
 *   keys: (tenantId: string, listingId: string) => [
 *     EntityCacheKeys.listing(tenantId, listingId),
 *     EntityCacheKeys.listingFull(tenantId, listingId),
 *   ],
 * })
 * async updateListing(tenantId: string, listingId: string, data: UpdateDto): Promise<Listing> {
 *   return this.prisma.listing.update({ where: { id: listingId }, data });
 * }
 * ```
 *
 * @example Pattern-based eviction
 * ```typescript
 * @CacheEvict({
 *   keys: (tenantId: string) => `ent:t:${tenantId}:listing:*`,
 *   pattern: true,
 * })
 * async bulkDeleteListings(tenantId: string): Promise<void> {
 *   // ...
 * }
 * ```
 */
export function CacheEvict(options: CacheEvictOptions): MethodDecorator {
  return SetMetadata<string, CacheEvictMetadata>(CACHE_EVICT_METADATA_KEY, {
    options,
  });
}

/**
 * Metadata key for cache put decorator.
 */
export const CACHE_PUT_METADATA_KEY = 'cache_put';

/**
 * Options for the @CachePut() decorator.
 */
export interface CachePutOptions {
  /**
   * Cache key or function to generate cache key.
   */
  key: string | ((...args: unknown[]) => string);

  /**
   * TTL in seconds.
   */
  ttl?: number;

  /**
   * Whether to use L1 (memory) cache.
   * Default: true
   */
  useMemoryCache?: boolean;

  /**
   * Condition function to determine if result should be cached.
   */
  condition?: (result: unknown) => boolean;
}

/**
 * Metadata for cache put methods.
 */
export interface CachePutMetadata {
  options: CachePutOptions;
}

/**
 * Decorator to always update cache after method execution.
 * Unlike @Cacheable, this always executes the method and updates the cache.
 *
 * @example
 * ```typescript
 * @CachePut({
 *   key: (tenantId: string, listingId: string) =>
 *     EntityCacheKeys.listing(tenantId, listingId),
 *   ttl: CacheTTL.LISTING,
 * })
 * async updateListing(tenantId: string, listingId: string, data: UpdateDto): Promise<Listing> {
 *   return this.prisma.listing.update({ where: { id: listingId }, data });
 * }
 * ```
 */
export function CachePut(options: CachePutOptions): MethodDecorator {
  return SetMetadata<string, CachePutMetadata>(CACHE_PUT_METADATA_KEY, {
    options,
  });
}
