// =============================================================================
// Affiliate Types — AffiliateProfile, Referral, Payout, Earnings
// =============================================================================
// Matches backend Prisma schema enums exactly. Do NOT invent statuses.
// Backend: modules/affiliate/affiliate.controller.ts (13 endpoints)
// =============================================================================

// ---------------------------------------------------------------------------
// Enums (match backend Prisma schema)
// ---------------------------------------------------------------------------

export type AffiliateType = "INDIVIDUAL" | "COMPANY";

export type AffiliateStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

export type ReferralType =
  | "OWNER_REGISTRATION"
  | "partner_BOOKING"
  | "AGENT_SIGNUP";

export type ReferralStatus = "PENDING" | "CONFIRMED" | "PAID" | "CANCELLED";

export type AffiliatePayoutStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED";

// ---------------------------------------------------------------------------
// Display configs
// ---------------------------------------------------------------------------

export const AFFILIATE_STATUS_CONFIG: Record<
  AffiliateStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  ACTIVE: { label: "Active", variant: "default" },
  INACTIVE: { label: "Inactive", variant: "secondary" },
  SUSPENDED: { label: "Suspended", variant: "destructive" },
};

export const REFERRAL_STATUS_CONFIG: Record<
  ReferralStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  PENDING: { label: "Pending", variant: "outline" },
  CONFIRMED: { label: "Confirmed", variant: "default" },
  PAID: { label: "Paid", variant: "secondary" },
  CANCELLED: { label: "Cancelled", variant: "destructive" },
};

export const REFERRAL_TYPE_CONFIG: Record<
  ReferralType,
  { label: string; description: string }
> = {
  OWNER_REGISTRATION: {
    label: "Owner Registration",
    description: "Referred a property owner who registered",
  },
  partner_BOOKING: {
    label: "Partner Booking",
    description: "Referred a partner who booked a property",
  },
  AGENT_SIGNUP: {
    label: "Agent Sign-up",
    description: "Referred an agent who signed up",
  },
};

export const PAYOUT_STATUS_CONFIG: Record<
  AffiliatePayoutStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  PENDING: { label: "Pending", variant: "outline" },
  PROCESSING: { label: "Processing", variant: "secondary" },
  COMPLETED: { label: "Completed", variant: "default" },
  FAILED: { label: "Failed", variant: "destructive" },
};

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface AffiliateProfile {
  id: string;
  partnerId: string;
  userId: string;
  code: string;
  type: AffiliateType;
  bankName: string | null;
  bankAccount: string | null;
  bankAccountName: string | null;
  totalReferrals: number;
  totalEarnings: number;
  unpaidEarnings: number;
  status: AffiliateStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    fullName: string;
    email: string;
  };
}

export interface AffiliateReferral {
  id: string;
  affiliateId: string;
  referralType: ReferralType;
  referredId: string;
  commissionRate: number;
  commissionAmount: number;
  status: ReferralStatus;
  confirmedAt: string | null;
  paidAt: string | null;
  notes: string | null;
  createdAt: string;
}

export interface AffiliatePayout {
  id: string;
  affiliateId: string;
  amount: number;
  status: AffiliatePayoutStatus;
  processedAt: string | null;
  reference: string | null;
  notes: string | null;
  createdAt: string;
}

export interface AffiliateEarnings {
  totalEarnings: number;
  unpaidEarnings: number;
  pendingReferrals: number;
  confirmedReferrals: number;
  paidReferrals: number;
  byType: {
    type: ReferralType;
    count: number;
    totalAmount: number;
  }[];
}

// ---------------------------------------------------------------------------
// DTOs
// ---------------------------------------------------------------------------

export interface CreateAffiliateDto {
  userId: string;
  type?: AffiliateType;
  bankName?: string;
  bankAccount?: string;
  bankAccountName?: string;
  notes?: string;
}

export interface UpdateAffiliateDto {
  type?: AffiliateType;
  bankName?: string;
  bankAccount?: string;
  bankAccountName?: string;
  notes?: string;
}

export interface TrackReferralDto {
  affiliateId: string;
  referralType: ReferralType;
  referredId: string;
  commissionRate?: number;
  commissionAmount?: number;
  notes?: string;
}

export interface ProcessPayoutDto {
  reference?: string;
  notes?: string;
}

// ---------------------------------------------------------------------------
// Filters
// ---------------------------------------------------------------------------

export interface AffiliateFilters {
  status?: AffiliateStatus;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}

export interface ReferralFilters {
  referralType?: ReferralType;
  status?: ReferralStatus;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}

export interface PayoutFilters {
  status?: AffiliatePayoutStatus;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}

export const DEFAULT_REFERRAL_FILTERS: ReferralFilters = {
  page: 1,
  pageSize: 20,
};

export const DEFAULT_PAYOUT_FILTERS: PayoutFilters = {
  page: 1,
  pageSize: 20,
};

// ---------------------------------------------------------------------------
// Utility functions
// ---------------------------------------------------------------------------

/**
 * Clean referral filters by removing undefined/empty values.
 */
export function cleanReferralFilters(
  filters: Partial<ReferralFilters>
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(filters).filter(
      ([, v]) => v !== undefined && v !== null && v !== ""
    )
  );
}

/**
 * Clean payout filters by removing undefined/empty values.
 */
export function cleanPayoutFilters(
  filters: Partial<PayoutFilters>
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(filters).filter(
      ([, v]) => v !== undefined && v !== null && v !== ""
    )
  );
}

/**
 * Format affiliate earnings as Malaysian Ringgit.
 */
export function formatAffiliateAmount(amount: number): string {
  return `RM ${amount.toLocaleString("en-MY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Get human-readable label for a referral type.
 */
export function getReferralTypeLabel(type: ReferralType): string {
  return REFERRAL_TYPE_CONFIG[type]?.label ?? type;
}

/**
 * Generate a shareable referral link from a referral code.
 */
export function generateReferralLink(code: string): string {
  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://zam-property.com";
  return `${baseUrl}/register?ref=${code}`;
}
