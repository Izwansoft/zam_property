// =============================================================================
// Feature Flags & Experiments — Type Definitions
// =============================================================================
// Types aligned with backend Prisma schema and API contracts.
// =============================================================================

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export type FeatureFlagType = "BOOLEAN" | "PERCENTAGE";

// ---------------------------------------------------------------------------
// Feature Flag
// ---------------------------------------------------------------------------

export interface FeatureFlag {
  id: string;
  key: string;
  type: FeatureFlagType;
  description: string;
  owner: string;
  defaultValue: boolean;
  rolloutPercentage: number | null;
  allowedVerticals: string[];
  allowedRoles: string[];
  reviewAt: string | null;
  expiresAt: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FeatureFlagOverride {
  id: string;
  featureFlagId: string;
  partnerId: string | null;
  verticalType: string | null;
  role: string | null;
  isEmergency: boolean;
  value: boolean;
  rolloutPercentage: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface FeatureFlagUserTarget {
  id: string;
  featureFlagId: string;
  partnerId: string;
  userId: string;
  value: boolean;
  createdAt: string;
}

export interface FeatureFlagDetail extends FeatureFlag {
  overrides?: FeatureFlagOverride[];
  userTargets?: FeatureFlagUserTarget[];
}

// ---------------------------------------------------------------------------
// Experiment
// ---------------------------------------------------------------------------

export interface ExperimentVariant {
  key: string;
  weight: number;
}

export interface Experiment {
  id: string;
  key: string;
  description: string;
  owner: string;
  successMetrics: string;
  variants: ExperimentVariant[];
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  featureFlagKey?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ---------------------------------------------------------------------------
// DTOs (Create/Update)
// ---------------------------------------------------------------------------

export interface CreateFeatureFlagDto {
  key: string;
  type: FeatureFlagType;
  description: string;
  owner: string;
  defaultValue: boolean;
  rolloutPercentage?: number | null;
  allowedVerticals?: string[];
  allowedRoles?: string[];
  reviewAt?: string | null;
  expiresAt?: string | null;
}

export interface UpdateFeatureFlagDto {
  description?: string;
  owner?: string;
  defaultValue?: boolean;
  rolloutPercentage?: number | null;
  allowedVerticals?: string[];
  allowedRoles?: string[];
  reviewAt?: string | null;
  expiresAt?: string | null;
  isArchived?: boolean;
}

export interface AddFlagOverrideDto {
  partnerId?: string;
  verticalType?: string;
  role?: string;
  isEmergency?: boolean;
  value: boolean;
  rolloutPercentage?: number | null;
}

export interface AddFlagUserTargetDto {
  partnerId: string;
  userId: string;
  value: boolean;
}

export interface CreateExperimentDto {
  key: string;
  description?: string;
  owner: string;
  successMetrics?: string;
  variants: ExperimentVariant[];
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  featureFlagKey?: string;
}

export interface PartnerOptInDto {
  partnerId?: string;
  optIn: boolean;
}

// ---------------------------------------------------------------------------
// Runtime Check
// ---------------------------------------------------------------------------

export interface FeatureFlagCheckResult {
  enabled: boolean;
  variant?: string;
}

// ---------------------------------------------------------------------------
// Display Helpers
// ---------------------------------------------------------------------------

export const FLAG_TYPE_LABELS: Record<FeatureFlagType, string> = {
  BOOLEAN: "Boolean",
  PERCENTAGE: "Percentage Rollout",
};

export const FLAG_TYPE_COLORS: Record<FeatureFlagType, string> = {
  BOOLEAN: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  PERCENTAGE:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
};

/**
 * Format a flag key for display: new-search-ranking → New Search Ranking
 */
export function formatFlagKey(key: string): string {
  return key
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
