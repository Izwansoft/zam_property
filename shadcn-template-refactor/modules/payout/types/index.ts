// =============================================================================
// Payout Types — Matches backend Prisma schema exactly
// =============================================================================
// Backend: src/modules/payout/ | Prisma: OwnerPayout, PayoutLineItem
// API: /api/v1/payouts
// =============================================================================

// ---------------------------------------------------------------------------
// Enums (match backend Prisma schema)
// ---------------------------------------------------------------------------

/**
 * PayoutStatus — Backend enum
 * Flow: PENDING → CALCULATED → APPROVED → PROCESSING → COMPLETED
 *                                                     ↘ FAILED
 */
export enum PayoutStatus {
  PENDING = "PENDING",
  CALCULATED = "CALCULATED",
  APPROVED = "APPROVED",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

/** PayoutLineItemType — Backend DTO values */
export enum PayoutLineItemType {
  RENTAL = "RENTAL",
  PLATFORM_FEE = "PLATFORM_FEE",
  MAINTENANCE = "MAINTENANCE",
  CLAIM_DEDUCTION = "CLAIM_DEDUCTION",
  OTHER = "OTHER",
}

// ---------------------------------------------------------------------------
// Status Configuration (UI display)
// ---------------------------------------------------------------------------

export type PayoutStatusVariant =
  | "default"
  | "success"
  | "warning"
  | "destructive"
  | "outline";

export interface PayoutStatusConfig {
  label: string;
  variant: PayoutStatusVariant;
  description: string;
}

export const PAYOUT_STATUS_CONFIG: Record<PayoutStatus, PayoutStatusConfig> = {
  [PayoutStatus.PENDING]: {
    label: "Pending",
    variant: "outline",
    description: "Payout is pending calculation",
  },
  [PayoutStatus.CALCULATED]: {
    label: "Calculated",
    variant: "warning",
    description: "Payout has been calculated, awaiting approval",
  },
  [PayoutStatus.APPROVED]: {
    label: "Approved",
    variant: "default",
    description: "Payout approved, awaiting processing",
  },
  [PayoutStatus.PROCESSING]: {
    label: "Processing",
    variant: "warning",
    description: "Payout is being processed",
  },
  [PayoutStatus.COMPLETED]: {
    label: "Completed",
    variant: "success",
    description: "Payout has been completed",
  },
  [PayoutStatus.FAILED]: {
    label: "Failed",
    variant: "destructive",
    description: "Payout processing failed",
  },
};

// ---------------------------------------------------------------------------
// Payout Line Item Interface
// ---------------------------------------------------------------------------

export interface PayoutLineItem {
  id: string;
  payoutId: string;
  tenancyId: string;
  billingId?: string | null;
  type: PayoutLineItemType | string;
  description: string;
  amount: number;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Payout (main interface)
// ---------------------------------------------------------------------------

export interface Payout {
  id: string;
  partnerId: string;
  ownerId: string;
  ownerName?: string;
  payoutNumber: string;
  periodStart: string;
  periodEnd: string;
  status: PayoutStatus;
  grossRental: number;
  platformFee: number;
  maintenanceCost: number;
  otherDeductions: number;
  netPayout: number;
  /** Bank details (snapshot at payout time) */
  bankName?: string | null;
  bankAccount?: string | null;
  bankAccountName?: string | null;
  /** Processing info */
  approvedBy?: string | null;
  approvedAt?: string | null;
  processedAt?: string | null;
  bankReference?: string | null;
  /** Line items (included in detail) */
  lineItems?: PayoutLineItem[];
  lineItemCount?: number;
  tenancyCount?: number;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Filter types
// ---------------------------------------------------------------------------

export interface PayoutFilters {
  ownerId?: string;
  status?: PayoutStatus | PayoutStatus[];
  periodStart?: string;
  periodEnd?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// ---------------------------------------------------------------------------
// Filter Tab Configuration
// ---------------------------------------------------------------------------

export interface PayoutFilterTab {
  value: string;
  label: string;
  statuses?: PayoutStatus[];
}

export const PAYOUT_FILTER_TABS: PayoutFilterTab[] = [
  { value: "all", label: "All Payouts" },
  {
    value: "calculated",
    label: "Calculated",
    statuses: [PayoutStatus.CALCULATED],
  },
  {
    value: "approved",
    label: "Approved",
    statuses: [PayoutStatus.APPROVED],
  },
  {
    value: "processing",
    label: "Processing",
    statuses: [PayoutStatus.PROCESSING],
  },
  {
    value: "completed",
    label: "Completed",
    statuses: [PayoutStatus.COMPLETED],
  },
  {
    value: "failed",
    label: "Failed",
    statuses: [PayoutStatus.FAILED],
  },
];

/**
 * Get the statuses for a given filter tab value.
 * Returns undefined for "all" (no status filter).
 */
export function getStatusesForPayoutFilter(
  filterValue: string
): PayoutStatus[] | undefined {
  const tab = PAYOUT_FILTER_TABS.find((t) => t.value === filterValue);
  return tab?.statuses;
}
