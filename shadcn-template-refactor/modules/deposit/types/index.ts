// =============================================================================
// Deposit Module Types
// =============================================================================
// Types for deposit-related entities in the Property Management system.
// Matches backend Prisma schema (Phase 5.7).
// =============================================================================

// ---------------------------------------------------------------------------
// Deposit Type (matches backend enum)
// ---------------------------------------------------------------------------

export enum DepositType {
  /** Security deposit for damages/breach */
  SECURITY = "SECURITY",
  /** Utility deposit for bills */
  UTILITY = "UTILITY",
  /** Key/access card deposit */
  KEY = "KEY",
}

// ---------------------------------------------------------------------------
// Deposit Status (matches backend enum)
// ---------------------------------------------------------------------------

export enum DepositStatus {
  /** Awaiting collection */
  PENDING = "PENDING",
  /** Deposit collected */
  COLLECTED = "COLLECTED",
  /** Held with deductions applied */
  HELD = "HELD",
  /** Some amount refunded */
  PARTIALLY_REFUNDED = "PARTIALLY_REFUNDED",
  /** Full amount refunded */
  FULLY_REFUNDED = "FULLY_REFUNDED",
  /** Deposit forfeited */
  FORFEITED = "FORFEITED",
}

// ---------------------------------------------------------------------------
// Deduction Claim
// ---------------------------------------------------------------------------

export interface DeductionClaim {
  claimId?: string;
  description: string;
  amount: number;
  addedAt: string;
}

// ---------------------------------------------------------------------------
// Deposit
// ---------------------------------------------------------------------------

export interface Deposit {
  id: string;
  tenancyId: string;
  partnerId: string;
  ownerId: string;
  tenantId?: string;
  type: DepositType;
  amount: number;
  currency: string;
  status: DepositStatus;
  collectedAt?: string;
  collectedBy?: string;
  refundedAt?: string;
  refundedAmount?: number;
  refundRef?: string;
  refundNotes?: string;
  deductionClaims: DeductionClaim[];
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Deposit Summary (for tenancy)
// ---------------------------------------------------------------------------

export interface DepositSummary {
  tenancyId: string;
  totalDeposits: number;
  totalCollected: number;
  totalRefunded: number;
  totalDeductions: number;
  totalPending: number;
  deposits: DepositSummaryItem[];
}

export interface DepositSummaryItem {
  id: string;
  type: DepositType;
  amount: number;
  status: DepositStatus;
  refundableAmount: number | null;
}

// ---------------------------------------------------------------------------
// Refund Calculation
// ---------------------------------------------------------------------------

export interface RefundCalculation {
  depositId: string;
  depositType: DepositType;
  originalAmount: number;
  totalDeductions: number;
  refundableAmount: number;
  deductions: DeductionClaim[];
  canRefund: boolean;
  reason?: string;
}

// ---------------------------------------------------------------------------
// Filter Params
// ---------------------------------------------------------------------------

export interface DepositFilters {
  tenancyId?: string;
  type?: DepositType;
  status?: DepositStatus;
  ownerId?: string;
  tenantId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}

// ---------------------------------------------------------------------------
// Mutation Payloads
// ---------------------------------------------------------------------------

export interface CreateDepositPayload {
  tenancyId: string;
  type: DepositType;
  amount: number;
  currency?: string;
}

export interface CollectDepositPayload {
  collectedBy?: string;
  notes?: string;
}

export interface AddDeductionPayload {
  claimId?: string;
  description: string;
  amount: number;
}

export interface RefundDepositPayload {
  refundRef?: string;
  notes?: string;
}

export interface FinalizeDepositPayload {
  refundRef?: string;
  notes?: string;
}

// ---------------------------------------------------------------------------
// Status Configuration (for UI)
// ---------------------------------------------------------------------------

export type DepositStatusVariant =
  | "default"
  | "secondary"
  | "destructive"
  | "outline"
  | "success"
  | "warning";

export interface DepositStatusConfig {
  label: string;
  variant: DepositStatusVariant;
  description: string;
  color: string;
}

export const DEPOSIT_STATUS_CONFIG: Record<DepositStatus, DepositStatusConfig> = {
  [DepositStatus.PENDING]: {
    label: "Pending",
    variant: "secondary",
    description: "Awaiting collection",
    color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  },
  [DepositStatus.COLLECTED]: {
    label: "Collected",
    variant: "success",
    description: "Deposit collected and held",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  },
  [DepositStatus.HELD]: {
    label: "Held",
    variant: "warning",
    description: "Held with deductions",
    color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  },
  [DepositStatus.PARTIALLY_REFUNDED]: {
    label: "Partially Refunded",
    variant: "default",
    description: "Partial amount refunded after deductions",
    color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  },
  [DepositStatus.FULLY_REFUNDED]: {
    label: "Fully Refunded",
    variant: "success",
    description: "Full amount refunded",
    color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  },
  [DepositStatus.FORFEITED]: {
    label: "Forfeited",
    variant: "destructive",
    description: "Deposit forfeited",
    color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  },
};

// ---------------------------------------------------------------------------
// Type Configuration (for UI)
// ---------------------------------------------------------------------------

export interface DepositTypeConfig {
  label: string;
  description: string;
  icon: "shield" | "zap" | "key";
}

export const DEPOSIT_TYPE_CONFIG: Record<DepositType, DepositTypeConfig> = {
  [DepositType.SECURITY]: {
    label: "Security Deposit",
    description: "Protection against property damage or breach of contract",
    icon: "shield",
  },
  [DepositType.UTILITY]: {
    label: "Utility Deposit",
    description: "Deposit for utility bills (electricity, water, gas)",
    icon: "zap",
  },
  [DepositType.KEY]: {
    label: "Key Deposit",
    description: "Deposit for keys and access cards",
    icon: "key",
  },
};

// ---------------------------------------------------------------------------
// Transaction History Types
// ---------------------------------------------------------------------------

export interface DepositTransaction {
  id: string;
  depositId: string;
  type: "COLLECTION" | "DEDUCTION" | "REFUND" | "FORFEIT";
  amount: number;
  balanceAfter: number;
  description: string;
  performedBy?: string;
  performedAt: string;
  metadata?: Record<string, unknown>;
}
