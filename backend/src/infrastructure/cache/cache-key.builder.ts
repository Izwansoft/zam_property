/**
 * Cache key builder utilities following conventions from part-32.md
 *
 * Key Structure: {prefix}:{scope}:{entity}:{identifier}:{variant}
 *
 * Prefixes:
 * - sess: Session data
 * - ent: Entity cache
 * - comp: Computed/derived
 * - cfg: Configuration
 * - rate: Rate limiting
 * - lock: Distributed locks
 * - temp: Temporary data
 *
 * Scope Abbreviations:
 * - g: Global (platform-wide)
 * - t: Partner-scoped
 * - v: Vendor-scoped
 * - u: User-scoped
 */

export type CacheScope = 'g' | 't' | 'v' | 'u';
export type CachePrefix = 'sess' | 'ent' | 'comp' | 'cfg' | 'rate' | 'lock' | 'temp';

/**
 * Build a cache key following the standard convention.
 */
export function buildCacheKey(prefix: CachePrefix, scope: CacheScope, ...parts: string[]): string {
  return [prefix, scope, ...parts].join(':');
}

// ─────────────────────────────────────────────────────────────────────────────
// Session Cache Keys
// ─────────────────────────────────────────────────────────────────────────────

export const SessionCacheKeys = {
  /** User session data - TTL: 24h */
  user: (userId: string) => buildCacheKey('sess', 'u', userId),

  /** Refresh token mapping - TTL: 7d */
  refreshToken: (token: string) => `sess:refresh:${token}`,

  /** Active sessions list - TTL: 30d */
  activeSessions: (userId: string) => buildCacheKey('sess', 'u', userId, 'active'),
};

// ─────────────────────────────────────────────────────────────────────────────
// Entity Cache Keys
// ─────────────────────────────────────────────────────────────────────────────

export const EntityCacheKeys = {
  /** Partner details - TTL: 1h */
  partner: (partnerId: string) => buildCacheKey('ent', 't', partnerId, 'partner'),

  /** Vendor details - TTL: 15m */
  vendor: (partnerId: string, vendorId: string) =>
    buildCacheKey('ent', 't', partnerId, 'vendor', vendorId),

  /** Listing details - TTL: 5m */
  listing: (partnerId: string, listingId: string) =>
    buildCacheKey('ent', 't', partnerId, 'listing', listingId),

  /** Listing with relations - TTL: 5m */
  listingFull: (partnerId: string, listingId: string) =>
    buildCacheKey('ent', 't', partnerId, 'listing', listingId, 'full'),

  /** User profile - TTL: 15m */
  user: (partnerId: string, userId: string) => buildCacheKey('ent', 't', partnerId, 'user', userId),

  /** Plan details (global) - TTL: 1h */
  plan: (planId: string) => buildCacheKey('ent', 'g', 'plan', planId),
};

// ─────────────────────────────────────────────────────────────────────────────
// Computed/Derived Cache Keys
// ─────────────────────────────────────────────────────────────────────────────

export const ComputedCacheKeys = {
  /** Resolved entitlements - TTL: 5m */
  entitlements: (partnerId: string) => buildCacheKey('comp', 't', partnerId, 'entitlements'),

  /** Usage counters - TTL: 1m */
  usage: (partnerId: string, period: string) =>
    buildCacheKey('comp', 't', partnerId, 'usage', period),

  /** Dashboard stats - TTL: 5m */
  dashboardStats: (partnerId: string) => buildCacheKey('comp', 't', partnerId, 'stats', 'dashboard'),

  /** Vendor statistics - TTL: 5m */
  vendorStats: (partnerId: string, vendorId: string) =>
    buildCacheKey('comp', 't', partnerId, 'vendor', vendorId, 'stats'),

  /** Available verticals (global) - TTL: 1h */
  verticalsList: () => buildCacheKey('comp', 'g', 'verticals', 'list'),
};

// ─────────────────────────────────────────────────────────────────────────────
// Configuration Cache Keys
// ─────────────────────────────────────────────────────────────────────────────

export const ConfigCacheKeys = {
  /** Global feature flags - TTL: 1m */
  featureFlags: () => buildCacheKey('cfg', 'g', 'feature-flags'),

  /** Partner feature flag overrides - TTL: 1m */
  featureFlagsTenantOverrides: (partnerId: string) =>
    buildCacheKey('cfg', 't', partnerId, 'feature-flag-overrides'),

  /** Experiments (global) - TTL: 1m */
  experiments: () => buildCacheKey('cfg', 'g', 'experiments'),

  /** Experiment opt-ins for a partner - TTL: 1m */
  experimentOptInsForTenant: (partnerId: string) =>
    buildCacheKey('cfg', 't', partnerId, 'experiments', 'opt-ins'),

  /** Partner settings - TTL: 5m */
  PartnerSettings: (partnerId: string) => buildCacheKey('cfg', 't', partnerId, 'settings'),

  /** Enabled verticals - TTL: 15m */
  PartnerVerticals: (partnerId: string) => buildCacheKey('cfg', 't', partnerId, 'verticals'),

  /** Vertical schema - TTL: 1h */
  verticalSchema: (partnerId: string, verticalType: string) =>
    buildCacheKey('cfg', 't', partnerId, 'vertical', verticalType, 'schema'),

  /** Active plans list (global) - TTL: 15m */
  activePlans: () => buildCacheKey('cfg', 'g', 'plans', 'active'),
};

// ─────────────────────────────────────────────────────────────────────────────
// Rate Limiting Cache Keys
// ─────────────────────────────────────────────────────────────────────────────

export const RateLimitCacheKeys = {
  /** IP-based rate limit - TTL: 1m */
  byIp: (ip: string) => `rate:api:ip:${ip}`,

  /** Partner endpoint limit - TTL: 1m */
  byTenantEndpoint: (partnerId: string, endpoint: string) => `rate:api:t:${partnerId}:${endpoint}`,

  /** User endpoint limit - TTL: 1m */
  byUserEndpoint: (userId: string, endpoint: string) => `rate:api:u:${userId}:${endpoint}`,

  /** Login attempt limit by IP - TTL: 15m */
  loginByIp: (ip: string) => `rate:login:ip:${ip}`,

  /** Login attempt limit by email - TTL: 15m */
  loginByEmail: (email: string) => `rate:login:email:${email}`,
};

// ─────────────────────────────────────────────────────────────────────────────
// Temporary/Operational Cache Keys
// ─────────────────────────────────────────────────────────────────────────────

export const TempCacheKeys = {
  /** Pending upload info - TTL: 1h */
  upload: (mediaId: string) => `temp:upload:${mediaId}`,

  /** OTP codes - TTL: 10m */
  otp: (email: string) => `temp:otp:${email}`,

  /** Password reset tokens - TTL: 1h */
  resetToken: (token: string) => `temp:reset:${token}`,

  /** Email verification tokens - TTL: 24h */
  verifyToken: (token: string) => `temp:verify:${token}`,
};

// ─────────────────────────────────────────────────────────────────────────────
// Lock Cache Keys
// ─────────────────────────────────────────────────────────────────────────────

export const LockCacheKeys = {
  /** Listing publish lock - TTL: 30s */
  listingPublish: (listingId: string) => `lock:listing:publish:${listingId}`,

  /** Subscription change lock - TTL: 60s */
  subscription: (partnerId: string) => `lock:subscription:${partnerId}`,

  /** Invoice generation lock - TTL: 120s */
  invoice: (subscriptionId: string, period: string) => `lock:invoice:${subscriptionId}:${period}`,

  /** Media processing lock - TTL: 300s */
  mediaProcess: (mediaId: string) => `lock:media:process:${mediaId}`,

  /** Generic resource lock */
  resource: (resource: string, id: string) => `lock:${resource}:${id}`,
};

// ─────────────────────────────────────────────────────────────────────────────
// TTL Constants (in seconds)
// ─────────────────────────────────────────────────────────────────────────────

export const CacheTTL = {
  // Session
  SESSION: 24 * 60 * 60, // 24 hours
  REFRESH_TOKEN: 7 * 24 * 60 * 60, // 7 days
  ACTIVE_SESSIONS: 30 * 24 * 60 * 60, // 30 days

  // Entity
  TENANT: 60 * 60, // 1 hour
  VENDOR: 15 * 60, // 15 minutes
  LISTING: 5 * 60, // 5 minutes
  USER: 15 * 60, // 15 minutes
  PLAN: 60 * 60, // 1 hour

  // Computed
  ENTITLEMENTS: 5 * 60, // 5 minutes
  USAGE: 60, // 1 minute
  STATS: 5 * 60, // 5 minutes
  VERTICALS_LIST: 60 * 60, // 1 hour

  // Configuration
  FEATURE_FLAGS: 60, // 1 minute
  TENANT_SETTINGS: 5 * 60, // 5 minutes
  TENANT_VERTICALS: 15 * 60, // 15 minutes
  VERTICAL_SCHEMA: 60 * 60, // 1 hour
  ACTIVE_PLANS: 15 * 60, // 15 minutes

  // Rate Limiting
  RATE_API: 60, // 1 minute
  RATE_LOGIN: 15 * 60, // 15 minutes

  // Temporary
  UPLOAD: 60 * 60, // 1 hour
  OTP: 10 * 60, // 10 minutes
  RESET_TOKEN: 60 * 60, // 1 hour
  VERIFY_TOKEN: 24 * 60 * 60, // 24 hours

  // Locks
  LOCK_DEFAULT: 30, // 30 seconds
  LOCK_SUBSCRIPTION: 60, // 60 seconds
  LOCK_INVOICE: 120, // 2 minutes
  LOCK_MEDIA: 300, // 5 minutes

  // Memory Cache (L1)
  MEMORY_SHORT: 30, // 30 seconds
  MEMORY_MEDIUM: 60, // 1 minute
  MEMORY_LONG: 5 * 60, // 5 minutes
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Pattern Helpers for Invalidation
// ─────────────────────────────────────────────────────────────────────────────

export const CachePatterns = {
  /** All keys for a partner */
  allTenant: (partnerId: string) => `*:t:${partnerId}:*`,

  /** All entity keys for a partner */
  allTenantEntities: (partnerId: string) => `ent:t:${partnerId}:*`,

  /** All computed keys for a partner */
  allTenantComputed: (partnerId: string) => `comp:t:${partnerId}:*`,

  /** All config keys for a partner */
  allTenantConfig: (partnerId: string) => `cfg:t:${partnerId}:*`,

  /** All listing keys */
  allListings: (partnerId: string, listingId: string) => `ent:t:${partnerId}:listing:${listingId}*`,

  /** All vendor keys */
  allVendor: (partnerId: string, vendorId: string) => `*:t:${partnerId}:vendor:${vendorId}*`,
};
