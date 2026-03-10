// =============================================================================
// Commission Types — Matches backend Prisma schema
// =============================================================================

import type { Agent } from "@/modules/agent/types";

// ---------------------------------------------------------------------------
// Enums (match backend exactly)
// ---------------------------------------------------------------------------

export type CommissionType = "BOOKING" | "RENEWAL";

export type CommissionStatus = "PENDING" | "APPROVED" | "PAID" | "CANCELLED";

// ---------------------------------------------------------------------------
// Status display config
// ---------------------------------------------------------------------------

export const COMMISSION_STATUS_CONFIG: Record<
  CommissionStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  PENDING: { label: "Pending", variant: "outline" },
  APPROVED: { label: "Approved", variant: "default" },
  PAID: { label: "Paid", variant: "secondary" },
  CANCELLED: { label: "Cancelled", variant: "destructive" },
};

export const COMMISSION_TYPE_CONFIG: Record<
  CommissionType,
  { label: string; description: string }
> = {
  BOOKING: { label: "Booking", description: "Commission from new tenancy booking" },
  RENEWAL: { label: "Renewal", description: "Commission from tenancy renewal" },
};

// ---------------------------------------------------------------------------
// Commission interface (matches backend CommissionView)
// ---------------------------------------------------------------------------

export interface Commission {
  id: string;
  agentId: string;
  tenancyId: string;
  type: CommissionType;
  rate: number;
  amount: number;
  status: CommissionStatus;
  paidAt: string | null;
  paidRef: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  agent?: Agent;
  tenancy?: {
    id: string;
    listing?: {
      id: string;
      title: string;
      slug: string;
    };
  };
}

// ---------------------------------------------------------------------------
// Commission Detail (with required relations)
// ---------------------------------------------------------------------------

export interface CommissionDetail extends Commission {
  agent: Agent;
  tenancy: {
    id: string;
    listing?: {
      id: string;
      title: string;
      slug: string;
    };
  };
}

// ---------------------------------------------------------------------------
// Commission Summary (from GET /agents/:id/commissions/summary)
// ---------------------------------------------------------------------------

export interface CommissionSummary {
  totalCommissions: number;
  totalAmount: number;
  pendingCount: number;
  pendingAmount: number;
  approvedCount: number;
  approvedAmount: number;
  paidCount: number;
  paidAmount: number;
}

// ---------------------------------------------------------------------------
// DTOs
// ---------------------------------------------------------------------------

export interface CreateCommissionDto {
  agentId: string;
  tenancyId: string;
  type: CommissionType;
  rate?: number;
  notes?: string;
}

export interface ApproveCommissionDto {
  notes?: string;
}

export interface PayCommissionDto {
  paidRef?: string;
  notes?: string;
}

// ---------------------------------------------------------------------------
// Filters
// ---------------------------------------------------------------------------

export type CommissionSortBy = "createdAt" | "updatedAt" | "amount";

export interface CommissionFilters {
  agentId?: string;
  tenancyId?: string;
  type?: CommissionType;
  status?: CommissionStatus;
  page?: number;
  limit?: number;
  sortBy?: CommissionSortBy;
  sortDir?: "asc" | "desc";
}

export const DEFAULT_COMMISSION_FILTERS: CommissionFilters = {
  page: 1,
  limit: 20,
  sortBy: "createdAt",
  sortDir: "desc",
};

// ---------------------------------------------------------------------------
// Utility functions
// ---------------------------------------------------------------------------

/**
 * Remove empty filter values for API query params.
 */
export function cleanCommissionFilters(
  filters: CommissionFilters
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(filters).filter(
      ([, v]) => v !== undefined && v !== null && v !== ""
    )
  );
}

/**
 * Format commission amount as RM currency.
 */
export function formatCommissionAmount(amount: number): string {
  return `RM ${amount.toLocaleString("en-MY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Get a human-readable label for commission type.
 */
export function getCommissionTypeLabel(type: CommissionType): string {
  return COMMISSION_TYPE_CONFIG[type].label;
}
