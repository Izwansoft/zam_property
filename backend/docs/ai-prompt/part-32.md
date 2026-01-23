# PART 32 — CACHING STRATEGY (LOCKED)

This part defines all **caching patterns, cache keys, TTLs, and invalidation strategies**.
All implementations must conform exactly to these specifications.

All rules from PART 0–31 apply.

---

## 32.1 CACHING ARCHITECTURE

### Technology Stack
- **Redis** as primary cache store
- **In-memory cache** (node-cache) for hot data
- **CDN cache** (CloudFront/Cloudflare) for static assets
- **Browser cache** for frontend assets

### Cache Layers
```
┌─────────────────────────────────────────────────┐
│  Browser Cache (static assets, API responses)  │
├─────────────────────────────────────────────────┤
│  CDN Cache (media files, public pages)          │
├─────────────────────────────────────────────────┤
│  Application Memory Cache (hot config data)     │
├─────────────────────────────────────────────────┤
│  Redis Cache (sessions, entities, computed)     │
├─────────────────────────────────────────────────┤
│  Database (PostgreSQL - source of truth)        │
└─────────────────────────────────────────────────┘
```

---

## 32.2 CACHE KEY CONVENTIONS

### Key Structure
```
{prefix}:{scope}:{entity}:{identifier}:{variant}
```

### Prefix by Data Type
| Prefix | Description | Example |
|--------|-------------|---------|
| `sess` | Session data | `sess:user:uuid` |
| `ent` | Entity cache | `ent:t:uuid:listing:uuid` |
| `comp` | Computed/derived | `comp:t:uuid:entitlements` |
| `cfg` | Configuration | `cfg:t:uuid:settings` |
| `rate` | Rate limiting | `rate:api:ip:1.2.3.4` |
| `lock` | Distributed locks | `lock:listing:uuid` |
| `temp` | Temporary data | `temp:upload:uuid` |

### Scope Abbreviations
| Abbreviation | Scope |
|--------------|-------|
| `g` | Global (platform-wide) |
| `t` | Tenant-scoped |
| `v` | Vendor-scoped |
| `u` | User-scoped |

### Examples
```
sess:u:550e8400-e29b-41d4-a716-446655440000
ent:t:tenant-uuid:listing:listing-uuid
comp:t:tenant-uuid:entitlements
cfg:t:tenant-uuid:vertical:real_estate:schema
rate:api:t:tenant-uuid:listings:create
lock:listing:publish:listing-uuid
```

---

## 32.3 CACHE CATEGORIES & TTLs

### 32.3.1 Session Cache

| Key Pattern | TTL | Description |
|-------------|-----|-------------|
| `sess:u:{userId}` | 24h | User session data |
| `sess:refresh:{token}` | 7d | Refresh token mapping |
| `sess:u:{userId}:active` | 30d | Active sessions list |

**Data Structure:**
```typescript
interface SessionCache {
  userId: string;
  email: string;
  tenantMemberships: {
    tenantId: string;
    roles: string[];
    vendorId?: string;
  }[];
  permissions: string[];
  createdAt: string;
  expiresAt: string;
}
```

---

### 32.3.2 Entity Cache

| Key Pattern | TTL | Description |
|-------------|-----|-------------|
| `ent:t:{tenantId}:tenant` | 1h | Tenant details |
| `ent:t:{tenantId}:vendor:{vendorId}` | 15m | Vendor details |
| `ent:t:{tenantId}:listing:{listingId}` | 5m | Listing details |
| `ent:t:{tenantId}:listing:{listingId}:full` | 5m | Listing with relations |
| `ent:t:{tenantId}:user:{userId}` | 15m | User profile |
| `ent:g:plan:{planId}` | 1h | Plan details |

**Cache-Aside Pattern:**
```typescript
async getListing(tenantId: string, listingId: string): Promise<Listing> {
  const cacheKey = `ent:t:${tenantId}:listing:${listingId}`;
  
  // Try cache first
  const cached = await this.redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }
  
  // Cache miss - fetch from DB
  const listing = await this.prisma.listing.findUnique({
    where: { id: listingId, tenantId },
  });
  
  if (listing) {
    await this.redis.setex(cacheKey, 300, JSON.stringify(listing));
  }
  
  return listing;
}
```

---

### 32.3.3 Computed/Derived Cache

| Key Pattern | TTL | Description |
|-------------|-----|-------------|
| `comp:t:{tenantId}:entitlements` | 5m | Resolved entitlements |
| `comp:t:{tenantId}:usage:{period}` | 1m | Usage counters |
| `comp:t:{tenantId}:stats:dashboard` | 5m | Dashboard stats |
| `comp:t:{tenantId}:vendor:{vendorId}:stats` | 5m | Vendor statistics |
| `comp:g:verticals:list` | 1h | Available verticals |

**Entitlements Cache:**
```typescript
interface EntitlementsCache {
  tenantId: string;
  planId: string;
  entitlements: Record<string, boolean | number | string[]>;
  overrides: Record<string, boolean | number>;
  computedAt: string;
  expiresAt: string;
}
```

---

### 32.3.4 Configuration Cache

| Key Pattern | TTL | Description |
|-------------|-----|-------------|
| `cfg:g:feature-flags` | 1m | Global feature flags |
| `cfg:t:{tenantId}:settings` | 5m | Tenant settings |
| `cfg:t:{tenantId}:verticals` | 15m | Enabled verticals |
| `cfg:t:{tenantId}:vertical:{type}:schema` | 1h | Vertical schema |
| `cfg:g:plans:active` | 15m | Active plans list |

---

### 32.3.5 Rate Limiting Cache

| Key Pattern | TTL | Description |
|-------------|-----|-------------|
| `rate:api:ip:{ip}` | 1m | IP-based rate limit |
| `rate:api:t:{tenantId}:{endpoint}` | 1m | Tenant endpoint limit |
| `rate:api:u:{userId}:{endpoint}` | 1m | User endpoint limit |
| `rate:login:ip:{ip}` | 15m | Login attempt limit |
| `rate:login:email:{email}` | 15m | Login by email limit |

**Sliding Window Implementation:**
```typescript
async checkRateLimit(key: string, limit: number, windowSec: number): Promise<boolean> {
  const now = Date.now();
  const windowStart = now - (windowSec * 1000);
  
  // Remove old entries
  await this.redis.zremrangebyscore(key, 0, windowStart);
  
  // Count current window
  const count = await this.redis.zcard(key);
  
  if (count >= limit) {
    return false; // Rate limited
  }
  
  // Add current request
  await this.redis.zadd(key, now, `${now}:${Math.random()}`);
  await this.redis.expire(key, windowSec);
  
  return true;
}
```

---

### 32.3.6 Temporary/Operational Cache

| Key Pattern | TTL | Description |
|-------------|-----|-------------|
| `temp:upload:{mediaId}` | 1h | Pending upload info |
| `temp:otp:{email}` | 10m | OTP codes |
| `temp:reset:{token}` | 1h | Password reset tokens |
| `temp:verify:{token}` | 24h | Email verification tokens |
| `lock:{resource}:{id}` | 30s | Distributed locks |

---

## 32.4 IN-MEMORY CACHE (HOT DATA)

For extremely hot data, use in-memory cache with short TTL:

| Data | TTL | Max Size |
|------|-----|----------|
| Feature flags | 30s | 100 entries |
| Vertical schemas | 5m | 50 entries |
| Plan definitions | 5m | 20 entries |
| Tenant basic info | 1m | 1000 entries |

**Implementation:**
```typescript
@Injectable()
export class MemoryCacheService {
  private cache = new NodeCache({
    stdTTL: 60,
    checkperiod: 30,
    maxKeys: 1000,
  });

  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds?: number,
  ): Promise<T> {
    const cached = this.cache.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }

    const value = await fetcher();
    this.cache.set(key, value, ttlSeconds);
    return value;
  }
}
```

---

## 32.5 CACHE INVALIDATION STRATEGIES

### 32.5.1 Event-Driven Invalidation

```typescript
@OnEvent('listing.updated')
async handleListingUpdated(event: ListingUpdatedEvent) {
  const { tenantId, listingId } = event;
  
  // Invalidate entity cache
  await this.redis.del(`ent:t:${tenantId}:listing:${listingId}`);
  await this.redis.del(`ent:t:${tenantId}:listing:${listingId}:full`);
  
  // Invalidate related computed caches
  await this.redis.del(`comp:t:${tenantId}:vendor:${event.vendorId}:stats`);
}

@OnEvent('subscription.changed')
async handleSubscriptionChanged(event: SubscriptionChangedEvent) {
  const { tenantId } = event;
  
  // Invalidate entitlements
  await this.redis.del(`comp:t:${tenantId}:entitlements`);
  await this.redis.del(`comp:t:${tenantId}:usage:*`);
}
```

### 32.5.2 Pattern-Based Invalidation

```typescript
async invalidateTenantCache(tenantId: string): Promise<void> {
  // Use SCAN to find and delete matching keys
  const pattern = `*:t:${tenantId}:*`;
  let cursor = '0';
  
  do {
    const [nextCursor, keys] = await this.redis.scan(
      cursor,
      'MATCH', pattern,
      'COUNT', 100,
    );
    cursor = nextCursor;
    
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  } while (cursor !== '0');
}
```

### 32.5.3 Cascading Invalidation Map

| Event | Keys to Invalidate |
|-------|-------------------|
| `tenant.updated` | `ent:t:{id}:tenant`, `cfg:t:{id}:*` |
| `tenant.suspended` | `ent:t:{id}:*`, `comp:t:{id}:*`, `cfg:t:{id}:*` |
| `vendor.updated` | `ent:t:{tid}:vendor:{id}`, `comp:t:{tid}:vendor:{id}:*` |
| `listing.updated` | `ent:t:{tid}:listing:{id}*` |
| `listing.published` | `ent:t:{tid}:listing:{id}*`, `comp:t:{tid}:stats:*` |
| `subscription.changed` | `comp:t:{tid}:entitlements`, `comp:t:{tid}:usage:*` |
| `plan.updated` | `ent:g:plan:{id}`, `cfg:g:plans:*` |
| `feature_flag.changed` | `cfg:g:feature-flags` |
| `vertical.schema_updated` | `cfg:t:*:vertical:{type}:schema` |

---

## 32.6 CACHE WARMING

### Startup Warming
```typescript
@Injectable()
export class CacheWarmerService implements OnApplicationBootstrap {
  async onApplicationBootstrap() {
    await this.warmGlobalCaches();
  }

  private async warmGlobalCaches() {
    // Warm feature flags
    const flags = await this.featureFlagService.getAllFlags();
    await this.redis.setex('cfg:g:feature-flags', 60, JSON.stringify(flags));
    
    // Warm plans
    const plans = await this.planService.getActivePlans();
    await this.redis.setex('cfg:g:plans:active', 900, JSON.stringify(plans));
    
    // Warm vertical schemas
    const verticals = await this.verticalRegistry.getAllSchemas();
    for (const vertical of verticals) {
      await this.redis.setex(
        `cfg:g:vertical:${vertical.type}:schema`,
        3600,
        JSON.stringify(vertical.schema),
      );
    }
  }
}
```

### Proactive Warming on Miss
```typescript
async getEntitlements(tenantId: string): Promise<Entitlements> {
  const cacheKey = `comp:t:${tenantId}:entitlements`;
  const cached = await this.redis.get(cacheKey);
  
  if (cached) {
    // Extend TTL on access (keep hot data warm)
    await this.redis.expire(cacheKey, 300);
    return JSON.parse(cached);
  }
  
  // Compute and cache
  const entitlements = await this.computeEntitlements(tenantId);
  await this.redis.setex(cacheKey, 300, JSON.stringify(entitlements));
  
  return entitlements;
}
```

---

## 32.7 DISTRIBUTED LOCKING

### Lock Pattern
```typescript
@Injectable()
export class DistributedLockService {
  async acquireLock(
    resource: string,
    ttlMs: number = 30000,
  ): Promise<string | null> {
    const lockId = randomUUID();
    const key = `lock:${resource}`;
    
    const acquired = await this.redis.set(
      key,
      lockId,
      'PX', ttlMs,
      'NX',
    );
    
    return acquired ? lockId : null;
  }

  async releaseLock(resource: string, lockId: string): Promise<boolean> {
    const key = `lock:${resource}`;
    
    // Only release if we own the lock
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;
    
    const result = await this.redis.eval(script, 1, key, lockId);
    return result === 1;
  }

  async withLock<T>(
    resource: string,
    fn: () => Promise<T>,
    ttlMs: number = 30000,
  ): Promise<T> {
    const lockId = await this.acquireLock(resource, ttlMs);
    
    if (!lockId) {
      throw new ConflictException('Resource is locked');
    }
    
    try {
      return await fn();
    } finally {
      await this.releaseLock(resource, lockId);
    }
  }
}
```

### Lock Use Cases
| Resource | Lock Key | TTL | Purpose |
|----------|----------|-----|---------|
| Listing publish | `lock:listing:publish:{id}` | 30s | Prevent double publish |
| Subscription change | `lock:subscription:{tenantId}` | 60s | Prevent race conditions |
| Invoice generation | `lock:invoice:{subscriptionId}:{period}` | 120s | Prevent duplicate invoices |
| Media processing | `lock:media:process:{id}` | 300s | Prevent duplicate processing |

---

## 32.8 CACHE HEADERS (HTTP)

### API Response Headers
```typescript
@Get('listings/:id')
async getListing(@Param('id') id: string, @Res() res: Response) {
  const listing = await this.listingService.findOne(id);
  
  // Public listings can be cached
  if (listing.status === 'PUBLISHED') {
    res.set({
      'Cache-Control': 'public, max-age=60, s-maxage=300',
      'ETag': `"${listing.updatedAt.getTime()}"`,
    });
  } else {
    res.set({
      'Cache-Control': 'private, no-cache',
    });
  }
  
  return res.json({ data: listing });
}
```

### Cache-Control Policies
| Endpoint Type | Cache-Control |
|--------------|---------------|
| Public listing | `public, max-age=60, s-maxage=300` |
| Private data | `private, no-cache` |
| User profile | `private, max-age=0, must-revalidate` |
| Static config | `public, max-age=3600, immutable` |
| Media files | `public, max-age=31536000, immutable` |

---

## 32.9 CDN CACHING

### Media Files
```
Cache-Control: public, max-age=31536000, immutable
```

### Public Listing Pages
```
Cache-Control: public, max-age=60, s-maxage=300, stale-while-revalidate=600
```

### CDN Invalidation
```typescript
@OnEvent('listing.updated')
async invalidateCDNCache(event: ListingUpdatedEvent) {
  if (event.wasPublished) {
    await this.cdnService.invalidate([
      `/listings/${event.listingId}`,
      `/listings/${event.slug}`,
    ]);
  }
}
```

---

## 32.10 MONITORING & METRICS

### Key Metrics
| Metric | Description |
|--------|-------------|
| `cache.hit.count` | Cache hits by key pattern |
| `cache.miss.count` | Cache misses by key pattern |
| `cache.hit.ratio` | Hit ratio (target > 80%) |
| `cache.latency.p95` | Cache operation latency |
| `cache.memory.used` | Redis memory usage |
| `cache.evictions` | Key evictions count |

### Health Check
```typescript
@Get('/health/cache')
async getCacheHealth() {
  const info = await this.redis.info('memory');
  const stats = await this.redis.info('stats');
  
  return {
    status: 'healthy',
    memory: {
      used: parseMemoryUsed(info),
      maxMemory: parseMaxMemory(info),
    },
    stats: {
      hits: parseHits(stats),
      misses: parseMisses(stats),
      hitRatio: calculateHitRatio(stats),
    },
  };
}
```

---

## 32.11 CACHE DEBUGGING

### Debug Commands
```bash
# List all keys for a tenant
redis-cli KEYS "*:t:tenant-uuid:*"

# Check TTL
redis-cli TTL "ent:t:tenant-uuid:listing:listing-uuid"

# Monitor cache operations
redis-cli MONITOR

# Memory analysis
redis-cli MEMORY DOCTOR
```

### Debug Endpoint (Dev Only)
```typescript
@Get('/debug/cache/:pattern')
@UseGuards(DevOnlyGuard)
async debugCache(@Param('pattern') pattern: string) {
  const keys = await this.redis.keys(pattern);
  const values = await Promise.all(
    keys.map(async (key) => ({
      key,
      ttl: await this.redis.ttl(key),
      type: await this.redis.type(key),
    })),
  );
  return { keys: values };
}
```

END OF PART 32.
