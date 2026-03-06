import {
  Plan,
  Subscription,
  EntitlementSnapshot,
  UsageCounter,
  SubscriptionStatus,
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

// ─────────────────────────────────────────────────────────────────────────────
// PLAN TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type PlanRecord = Plan;

export interface PlanEntitlements {
  // Listing limits per vertical
  listings?: {
    limit?: number; // total limit across all verticals
    verticals?: Record<string, number>; // per-vertical limits
  };

  // Interaction/lead limits
  interactions?: {
    limit?: number; // monthly interaction limit
  };

  // Media/storage limits
  media?: {
    uploadLimit?: number; // monthly upload limit (MB)
    storageLimit?: number; // total storage limit (GB)
  };

  // Feature flags
  features?: string[]; // e.g., ['analytics', 'featured_listings', 'priority_support']

  // Vertical access
  verticals?: string[]; // allowed verticals

  // API rate limits
  api?: {
    requestsPerMinute?: number;
  };

  // Allow additional properties for flexibility
  [key: string]: unknown;
}

export interface CreatePlanParams {
  name: string;
  slug: string;
  description?: string;
  priceMonthly?: Decimal;
  priceYearly?: Decimal;
  currency?: string;
  entitlements: PlanEntitlements;
  isActive?: boolean;
  isPublic?: boolean;
}

export interface UpdatePlanParams {
  name?: string;
  description?: string;
  priceMonthly?: Decimal;
  priceYearly?: Decimal;
  entitlements?: PlanEntitlements;
  isActive?: boolean;
  isPublic?: boolean;
}

export interface FindManyPlansParams {
  isActive?: boolean;
  isPublic?: boolean;
  page?: number;
  pageSize?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// SUBSCRIPTION TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type SubscriptionRecord = Subscription & {
  plan?: Plan;
};

export interface CreateSubscriptionParams {
  partnerId: string;
  planId: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  externalId?: string;
  externalProvider?: string;
  overrides?: Record<string, unknown>;
}

export interface UpdateSubscriptionParams {
  status?: SubscriptionStatus;
  currentPeriodEnd?: Date;
  externalId?: string;
  overrides?: Record<string, unknown>;
}

export interface ChangePlanParams {
  newPlanId: string;
  effectiveDate?: Date; // when to apply the change (defaults to immediate)
}

// ─────────────────────────────────────────────────────────────────────────────
// ENTITLEMENT TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type EntitlementSnapshotRecord = EntitlementSnapshot;

export interface ResolvedEntitlements {
  // Boolean entitlements
  [key: string]: boolean | number | string | undefined;
}

export interface EntitlementCheckResult {
  allowed: boolean;
  reason?: string;
  currentUsage?: number;
  limit?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// USAGE TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type UsageCounterRecord = UsageCounter;

export interface IncrementUsageParams {
  partnerId: string;
  metricKey: string;
  amount?: number; // defaults to 1
}

export interface GetUsageParams {
  partnerId: string;
  metricKey: string;
  periodStart: Date;
  periodEnd: Date;
}

export interface UsageSummary {
  metricKey: string;
  currentPeriod: {
    count: number;
    periodStart: Date;
    periodEnd: Date;
  };
  limit?: number;
  percentage?: number; // percentage of limit used
}
