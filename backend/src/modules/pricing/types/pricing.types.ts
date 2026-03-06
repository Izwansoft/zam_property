import { PricingModel, ChargeType, PricingConfig, PricingRule, ChargeEvent } from '@prisma/client';

// ─────────────────────────────────────────────────────────────────────────────
// Pricing Configuration Types
// ─────────────────────────────────────────────────────────────────────────────

export interface SaasPricingConfig {
  monthlyFee: number;
  yearlyFee?: number;
  features: string[];
}

export interface LeadBasedPricingConfig {
  pricePerLead: number;
  freeQuota?: number;
  verticalPricing?: Record<string, number>; // vertical -> price
}

export interface CommissionPricingConfig {
  commissionPercentage: number;
  minimumCommission?: number;
  maximumCommission?: number;
  flatFee?: number; // Optional flat fee + commission
}

export interface ListingBasedPricingConfig {
  pricePerListing: number;
  pricePerFeaturedListing?: number;
  freeListingQuota?: number;
}

export interface HybridPricingConfig {
  models: {
    saas?: SaasPricingConfig;
    leadBased?: LeadBasedPricingConfig;
    commission?: CommissionPricingConfig;
    listingBased?: ListingBasedPricingConfig;
  };
}

export type PricingConfigData =
  | SaasPricingConfig
  | LeadBasedPricingConfig
  | CommissionPricingConfig
  | ListingBasedPricingConfig
  | HybridPricingConfig;

// ─────────────────────────────────────────────────────────────────────────────
// Pricing Rule Conditions
// ─────────────────────────────────────────────────────────────────────────────

export interface PricingRuleConditions {
  verticalId?: string;
  listingType?: string;
  interactionType?: string;
  minAmount?: number;
  maxAmount?: number;
  customFilters?: Record<string, unknown>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Charge Calculation
// ─────────────────────────────────────────────────────────────────────────────

export interface ChargeCalculationInput {
  eventType: string;
  resourceType: string;
  resourceId: string;
  amount?: number; // For commission calculations
  metadata?: Record<string, unknown>;
}

export interface ChargeCalculationResult {
  shouldCharge: boolean;
  chargeType?: ChargeType;
  amount?: number;
  currency?: string;
  pricingConfigId?: string;
  pricingRuleId?: string;
  reason?: string;
  metadata?: Record<string, unknown>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Extended Types
// ─────────────────────────────────────────────────────────────────────────────

export type PricingConfigWithRules = PricingConfig & {
  rules: PricingRule[];
};

export type ChargeEventDetail = ChargeEvent & {
  partner?: { name: string; slug: string };
};

// ─────────────────────────────────────────────────────────────────────────────
// Pricing Summary
// ─────────────────────────────────────────────────────────────────────────────

export interface PricingSummary {
  partnerId: string;
  activeConfigs: PricingConfigWithRules[];
  totalCharges: {
    current: number;
    pending: number;
    processed: number;
  };
  breakdownByType: Record<ChargeType, number>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Pricing Strategy Interface
// ─────────────────────────────────────────────────────────────────────────────

export interface IPricingStrategy {
  /**
   * Calculate charge for given input
   */
  calculateCharge(
    config: PricingConfigData,
    input: ChargeCalculationInput,
  ): Promise<ChargeCalculationResult>;

  /**
   * Validate pricing configuration
   */
  validateConfig(config: unknown): boolean;

  /**
   * Get pricing model type
   */
  getModelType(): PricingModel;
}
