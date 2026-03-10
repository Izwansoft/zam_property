// =============================================================================
// Query Configuration — Stale times and retry policies per domain
// =============================================================================
// Centralized configuration for TanStack Query behavior tuning.
// Import these constants in individual hooks to override global defaults.
//
// Guidelines:
//   - Static/reference data → long stale time (10-30 min)
//   - User profile/settings → medium stale time (5-10 min)
//   - Listing/entity data   → default stale time (1-5 min)
//   - Real-time data        → short stale time (15-30s)
//   - Analytics dashboard   → medium stale time (2 min)
// =============================================================================

// ---------------------------------------------------------------------------
// Stale Time Presets (in milliseconds)
// ---------------------------------------------------------------------------

export const STALE_TIMES = {
  /** 15 seconds — real-time data (notifications, unread counts) */
  REALTIME: 15 * 1000,

  /** 30 seconds — default (global default already set in QueryClient) */
  DEFAULT: 30 * 1000,

  /** 1 minute — frequently updated data (activity feeds, job queues) */
  FREQUENT: 60 * 1000,

  /** 2 minutes — analytics dashboards, audit logs */
  ANALYTICS: 2 * 60 * 1000,

  /** 5 minutes — entity lists (listings, vendors, tenancies) */
  ENTITY_LIST: 5 * 60 * 1000,

  /** 10 minutes — user profile, subscription, settings */
  USER_DATA: 10 * 60 * 1000,

  /** 30 minutes — static/reference data (verticals, plans, feature flags) */
  STATIC: 30 * 60 * 1000,

  /** 1 hour — virtually immutable data (audit action types, target types) */
  IMMUTABLE: 60 * 60 * 1000,
} as const;

// ---------------------------------------------------------------------------
// Domain-Specific Stale Times
// ---------------------------------------------------------------------------

/**
 * Recommended stale times per domain.
 * Hooks can import and use: `staleTime: DOMAIN_STALE_TIMES.listings`
 */
export const DOMAIN_STALE_TIMES = {
  // --- Auth & User ---
  auth: STALE_TIMES.USER_DATA,
  profile: STALE_TIMES.USER_DATA,
  notificationPreferences: STALE_TIMES.USER_DATA,

  // --- Core Domains ---
  listings: STALE_TIMES.ENTITY_LIST,
  listingDetail: STALE_TIMES.DEFAULT,
  vendors: STALE_TIMES.ENTITY_LIST,
  vendorDetail: STALE_TIMES.DEFAULT,
  interactions: STALE_TIMES.FREQUENT,
  reviews: STALE_TIMES.ENTITY_LIST,
  reviewStats: STALE_TIMES.ANALYTICS,

  // --- Real-time ---
  notifications: STALE_TIMES.REALTIME,
  unreadCount: STALE_TIMES.REALTIME,
  activityFeed: STALE_TIMES.FREQUENT,
  chat: STALE_TIMES.REALTIME,

  // --- Subscriptions & Plans ---
  subscription: STALE_TIMES.USER_DATA,
  plans: STALE_TIMES.STATIC,
  usage: STALE_TIMES.ANALYTICS,
  entitlements: STALE_TIMES.USER_DATA,

  // --- Analytics ---
  analytics: STALE_TIMES.ANALYTICS,

  // --- Platform Admin ---
  partners: STALE_TIMES.ENTITY_LIST,
  audit: STALE_TIMES.FREQUENT,
  auditActionTypes: STALE_TIMES.IMMUTABLE,
  auditTargetTypes: STALE_TIMES.IMMUTABLE,
  featureFlags: STALE_TIMES.ENTITY_LIST,
  experiments: STALE_TIMES.ENTITY_LIST,
  featureFlagCheck: STALE_TIMES.STATIC,
  jobs: STALE_TIMES.REALTIME,
  adminListings: STALE_TIMES.ENTITY_LIST,
  pricing: STALE_TIMES.ENTITY_LIST,

  // --- Property Management ---
  tenancies: STALE_TIMES.ENTITY_LIST,
  tenancyDetail: STALE_TIMES.DEFAULT,
  contracts: STALE_TIMES.ENTITY_LIST,
  deposits: STALE_TIMES.ENTITY_LIST,
  billings: STALE_TIMES.ENTITY_LIST,
  payments: STALE_TIMES.ENTITY_LIST,
  payouts: STALE_TIMES.ENTITY_LIST,
  maintenance: STALE_TIMES.FREQUENT,
  inspections: STALE_TIMES.ENTITY_LIST,
  claims: STALE_TIMES.ENTITY_LIST,

  // --- Growth ---
  companies: STALE_TIMES.ENTITY_LIST,
  agents: STALE_TIMES.ENTITY_LIST,
  commissions: STALE_TIMES.ENTITY_LIST,
  affiliates: STALE_TIMES.ENTITY_LIST,
  legalCases: STALE_TIMES.ENTITY_LIST,

  // --- Reference Data ---
  verticals: STALE_TIMES.STATIC,
  verticalSchema: STALE_TIMES.STATIC,
  search: STALE_TIMES.DEFAULT,
  media: STALE_TIMES.ENTITY_LIST,
} as const;

// ---------------------------------------------------------------------------
// Retry Configuration
// ---------------------------------------------------------------------------

/**
 * Retry policy factory.
 * Mutations should NOT retry by default — the user should be informed and retry manually.
 * Queries retry on server/network errors only (not 4xx client errors).
 */
export const RETRY_CONFIG = {
  /** No retries — for mutations and user-initiated actions */
  NONE: 0,

  /** Single retry — for idempotent mutations (status changes) */
  ONCE: 1,

  /** Standard retry — for query failures (5xx, network) */
  STANDARD: 3,
} as const;

/**
 * Smart retry function for queries — skips retry on 4xx errors.
 * Use this as the `retry` option in QueryClient defaults or individual hooks.
 */
export function smartQueryRetry(failureCount: number, error: unknown): boolean {
  if (error && typeof error === "object" && "status" in error) {
    const status = (error as { status: number }).status;
    // Don't retry on client errors (4xx)
    if (status >= 400 && status < 500) return false;
  }
  return failureCount < RETRY_CONFIG.STANDARD;
}
