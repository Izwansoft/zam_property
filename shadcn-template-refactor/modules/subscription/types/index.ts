// =============================================================================
// Subscription Module — Type Definitions
// =============================================================================
// Types for plans, subscriptions, entitlements, and usage tracking.
// Matches backend API contracts from API-REGISTRY.md.
// =============================================================================

// ---------------------------------------------------------------------------
// Plan Types
// ---------------------------------------------------------------------------

/** Entitlements structure as defined by backend */
export interface PlanEntitlements {
  listings?: {
    limit: number;
    verticals?: Record<string, number>;
  };
  interactions?: {
    limit: number;
  };
  media?: {
    uploadSizeLimit: number; // MB
    storageSizeLimit: number; // GB
  };
  features?: string[];
  verticals?: string[];
  api?: {
    requestsPerMinute: number;
  };
}

/** Plan entity from GET /api/v1/plans */
export interface Plan {
  id: string;
  name: string;
  slug: string;
  description?: string;
  priceMonthly: string; // Decimal(10,2) as string
  priceYearly: string;
  currency: string;
  entitlements: PlanEntitlements;
  isActive: boolean;
  isPublic: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/** Plan summary (embedded in subscription) */
export interface PlanSummary {
  id: string;
  name: string;
  slug: string;
  priceMonthly: string;
}

// ---------------------------------------------------------------------------
// Subscription Types
// ---------------------------------------------------------------------------

export type SubscriptionStatus = "ACTIVE" | "PAST_DUE" | "PAUSED" | "CANCELLED";

/** Subscription entity from GET /api/v1/subscriptions/current */
export interface Subscription {
  id: string;
  partnerId: string;
  planId: string;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  externalId?: string | null;
  externalProvider?: string | null;
  overrides?: Partial<PlanEntitlements> | null;
  cancelledAt?: string | null;
  createdAt: string;
  updatedAt: string;
  plan: PlanSummary;
}

// ---------------------------------------------------------------------------
// Entitlements Types
// ---------------------------------------------------------------------------

/** Resolved entitlements from GET /api/v1/subscriptions/entitlements */
export type ResolvedEntitlements = PlanEntitlements;

// ---------------------------------------------------------------------------
// Usage Types
// ---------------------------------------------------------------------------

/** Usage period details */
export interface UsagePeriod {
  count: number;
  periodStart: string;
  periodEnd: string;
}

/** Single usage metric from GET /api/v1/subscriptions/usage */
export interface UsageMetric {
  metricKey: string;
  currentPeriod: UsagePeriod;
  limit: number;
  percentage: number;
}

// ---------------------------------------------------------------------------
// Warning Level
// ---------------------------------------------------------------------------

export type UsageWarningLevel = "normal" | "warning" | "critical" | "exceeded";

/**
 * Determine warning level from usage percentage.
 * Normal: 0-79%, Warning: 80-94%, Critical: 95-99%, Exceeded: 100%+
 */
export function getUsageWarningLevel(percentage: number): UsageWarningLevel {
  if (percentage >= 100) return "exceeded";
  if (percentage >= 95) return "critical";
  if (percentage >= 80) return "warning";
  return "normal";
}

// ---------------------------------------------------------------------------
// Status Badge Mapping
// ---------------------------------------------------------------------------

export const SUBSCRIPTION_STATUS_CONFIG: Record<
  SubscriptionStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  ACTIVE: { label: "Active", variant: "default" },
  PAST_DUE: { label: "Past Due", variant: "destructive" },
  PAUSED: { label: "Paused", variant: "secondary" },
  CANCELLED: { label: "Cancelled", variant: "outline" },
};

// ---------------------------------------------------------------------------
// Feature Category (for plan comparison table)
// ---------------------------------------------------------------------------

export interface FeatureCategory {
  name: string;
  features: FeatureRow[];
}

export interface FeatureRow {
  label: string;
  description?: string;
  /** Extractor: given a plan's entitlements, return display value */
  getValue: (entitlements: PlanEntitlements) => string | number | boolean;
}

/** Human-friendly metric key labels */
export const METRIC_KEY_LABELS: Record<string, string> = {
  listings_created: "Active Listings",
  interactions_received: "Interactions",
  media_uploads: "Media Uploads",
  api_requests: "API Requests",
  storage_used: "Storage Used",
};

/** Human-friendly metric descriptions */
export const METRIC_KEY_DESCRIPTIONS: Record<string, string> = {
  listings_created: "Number of active listings in the current billing period",
  interactions_received: "Total leads and inquiries received this period",
  media_uploads: "Files uploaded this billing period",
  api_requests: "API calls made this period",
  storage_used: "Total storage consumed",
};

// ---------------------------------------------------------------------------
// Feature Categories Definition (for plan comparison)
// ---------------------------------------------------------------------------

export const PLAN_FEATURE_CATEGORIES: FeatureCategory[] = [
  {
    name: "Listings",
    features: [
      {
        label: "Maximum Active Listings",
        description: "Total number of listings you can keep active",
        getValue: (e) => e.listings?.limit ?? 0,
      },
    ],
  },
  {
    name: "Interactions",
    features: [
      {
        label: "Monthly Interactions",
        description: "Leads and inquiries per billing period",
        getValue: (e) => e.interactions?.limit ?? 0,
      },
    ],
  },
  {
    name: "Media & Storage",
    features: [
      {
        label: "Max Upload Size",
        description: "Maximum file size per upload (MB)",
        getValue: (e) => e.media?.uploadSizeLimit ? `${e.media.uploadSizeLimit} MB` : "—",
      },
      {
        label: "Storage Limit",
        description: "Total storage allowance (GB)",
        getValue: (e) => e.media?.storageSizeLimit ? `${e.media.storageSizeLimit} GB` : "—",
      },
    ],
  },
  {
    name: "Features",
    features: [
      {
        label: "Analytics",
        description: "Access to analytics dashboard",
        getValue: (e) => e.features?.includes("analytics") ?? false,
      },
      {
        label: "Priority Support",
        description: "Dedicated priority support channel",
        getValue: (e) => e.features?.includes("priority_support") ?? false,
      },
    ],
  },
  {
    name: "Verticals",
    features: [
      {
        label: "Available Verticals",
        description: "Property verticals enabled for your plan",
        getValue: (e) => e.verticals?.length ?? 0,
      },
    ],
  },
  {
    name: "API",
    features: [
      {
        label: "API Rate Limit",
        description: "Maximum API requests per minute",
        getValue: (e) => e.api?.requestsPerMinute ?? 0,
      },
    ],
  },
];
