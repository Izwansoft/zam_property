// =============================================================================
// Pricing Module — Type Definitions
// =============================================================================
// Types aligned with backend Prisma schema and API contracts.
// Covers pricing configs, rules, charge events, and charge calculation.
// =============================================================================

// ---------------------------------------------------------------------------
// Enums (match backend Prisma exactly)
// ---------------------------------------------------------------------------

export type ChargeType =
  | "SUBSCRIPTION"
  | "LEAD"
  | "INTERACTION"
  | "COMMISSION"
  | "LISTING"
  | "ADDON"
  | "OVERAGE";

export type PricingModel =
  | "SAAS"
  | "LEAD_BASED"
  | "COMMISSION"
  | "LISTING_BASED"
  | "HYBRID";

export type ChargeEventStatus =
  | "PENDING"
  | "COMPLETED"
  | "FAILED"
  | "REFUNDED";

// ---------------------------------------------------------------------------
// Pricing Config
// ---------------------------------------------------------------------------

export interface PricingConfig {
  id: string;
  name: string;
  description: string | null;
  chargeType: ChargeType;
  pricingModel: PricingModel;
  currency: string;
  baseAmount: number;
  metadata: Record<string, unknown> | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Pricing Rule
// ---------------------------------------------------------------------------

export interface PricingRule {
  id: string;
  pricingConfigId: string;
  name: string;
  description: string | null;
  condition: Record<string, unknown>;
  multiplier: number;
  priority: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  pricingConfig?: PricingConfig;
}

// ---------------------------------------------------------------------------
// Charge Event
// ---------------------------------------------------------------------------

export interface ChargeEvent {
  id: string;
  partnerId: string;
  vendorId: string;
  chargeType: ChargeType;
  amount: number;
  currency: string;
  status: ChargeEventStatus;
  description: string | null;
  metadata: Record<string, unknown> | null;
  calculationBreakdown: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// DTOs (Create/Update)
// ---------------------------------------------------------------------------

export interface CreatePricingConfigDto {
  name: string;
  description?: string;
  chargeType: ChargeType;
  pricingModel: PricingModel;
  currency?: string;
  baseAmount: number;
  metadata?: Record<string, unknown>;
  isActive?: boolean;
}

export interface UpdatePricingConfigDto {
  name?: string;
  description?: string;
  chargeType?: ChargeType;
  pricingModel?: PricingModel;
  currency?: string;
  baseAmount?: number;
  metadata?: Record<string, unknown>;
  isActive?: boolean;
}

export interface CreatePricingRuleDto {
  pricingConfigId: string;
  name: string;
  description?: string;
  condition: Record<string, unknown>;
  multiplier: number;
  priority?: number;
  isActive?: boolean;
}

export interface CalculateChargeDto {
  chargeType: ChargeType;
  partnerId?: string;
  vendorId?: string;
  quantity?: number;
  metadata?: Record<string, unknown>;
}

export interface CalculateChargeResult {
  chargeType: ChargeType;
  amount: number;
  currency: string;
  breakdown: {
    baseAmount: number;
    appliedRules: Array<{
      ruleName: string;
      multiplier: number;
      effect: number;
    }>;
    finalAmount: number;
  };
  pricingConfigId: string;
  pricingConfigName: string;
}

// ---------------------------------------------------------------------------
// Filter Params
// ---------------------------------------------------------------------------

export interface PricingConfigFilters {
  page: number;
  pageSize: number;
  search?: string;
  chargeType?: ChargeType;
  pricingModel?: PricingModel;
  isActive?: boolean;
}

export interface PricingRuleFilters {
  page: number;
  pageSize: number;
  pricingConfigId?: string;
  isActive?: boolean;
}

export interface ChargeEventFilters {
  page: number;
  pageSize: number;
  partnerId?: string;
  vendorId?: string;
  chargeType?: ChargeType;
  status?: ChargeEventStatus;
  startDate?: string;
  endDate?: string;
}

export const DEFAULT_PRICING_CONFIG_FILTERS: PricingConfigFilters = {
  page: 1,
  pageSize: 20,
};

export const DEFAULT_PRICING_RULE_FILTERS: PricingRuleFilters = {
  page: 1,
  pageSize: 20,
};

export const DEFAULT_CHARGE_EVENT_FILTERS: ChargeEventFilters = {
  page: 1,
  pageSize: 20,
};

// ---------------------------------------------------------------------------
// Display Helpers
// ---------------------------------------------------------------------------

export const CHARGE_TYPE_LABELS: Record<ChargeType, string> = {
  SUBSCRIPTION: "Subscription",
  LEAD: "Lead",
  INTERACTION: "Interaction",
  COMMISSION: "Commission",
  LISTING: "Listing",
  ADDON: "Add-on",
  OVERAGE: "Overage",
};

export const CHARGE_TYPE_COLORS: Record<ChargeType, string> = {
  SUBSCRIPTION:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  LEAD:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  INTERACTION:
    "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  COMMISSION:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  LISTING:
    "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
  ADDON:
    "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
  OVERAGE:
    "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

export const PRICING_MODEL_LABELS: Record<PricingModel, string> = {
  SAAS: "SaaS",
  LEAD_BASED: "Lead-Based",
  COMMISSION: "Commission",
  LISTING_BASED: "Listing-Based",
  HYBRID: "Hybrid",
};

export const PRICING_MODEL_COLORS: Record<PricingModel, string> = {
  SAAS: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  LEAD_BASED:
    "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  COMMISSION:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  LISTING_BASED:
    "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
  HYBRID:
    "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
};

export const CHARGE_EVENT_STATUS_LABELS: Record<ChargeEventStatus, string> = {
  PENDING: "Pending",
  COMPLETED: "Completed",
  FAILED: "Failed",
  REFUNDED: "Refunded",
};

export const CHARGE_EVENT_STATUS_COLORS: Record<ChargeEventStatus, string> = {
  PENDING:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  COMPLETED:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  FAILED:
    "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  REFUNDED:
    "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
};

/** All charge type values for dropdown/select usage */
export const CHARGE_TYPES: ChargeType[] = [
  "SUBSCRIPTION",
  "LEAD",
  "INTERACTION",
  "COMMISSION",
  "LISTING",
  "ADDON",
  "OVERAGE",
];

/** All pricing model values for dropdown/select usage */
export const PRICING_MODELS: PricingModel[] = [
  "SAAS",
  "LEAD_BASED",
  "COMMISSION",
  "LISTING_BASED",
  "HYBRID",
];

/** All charge event status values for dropdown/select usage */
export const CHARGE_EVENT_STATUSES: ChargeEventStatus[] = [
  "PENDING",
  "COMPLETED",
  "FAILED",
  "REFUNDED",
];

/**
 * Format a currency amount for display.
 */
export function formatAmount(amount: number, currency: string = "MYR"): string {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}
