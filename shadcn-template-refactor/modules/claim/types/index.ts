// =============================================================================
// Claim Module — Type Definitions
// =============================================================================
// Matches backend Prisma schema exactly.
// Enums: ClaimType, ClaimStatus
// API: /api/v1/claims
// =============================================================================

import type { LucideIcon } from "lucide-react";
import {
  Hammer,
  Sparkles,
  PackageSearch,
  Zap,
  HelpCircle,
  FileText,
  Search,
  CheckCircle2,
  CheckCheck,
  XCircle,
  Handshake,
  AlertTriangle,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Enums (must match backend exactly)
// ---------------------------------------------------------------------------

export enum ClaimType {
  DAMAGE = "DAMAGE",
  CLEANING = "CLEANING",
  MISSING_ITEM = "MISSING_ITEM",
  UTILITY = "UTILITY",
  OTHER = "OTHER",
}

export enum ClaimStatus {
  SUBMITTED = "SUBMITTED",
  UNDER_REVIEW = "UNDER_REVIEW",
  APPROVED = "APPROVED",
  PARTIALLY_APPROVED = "PARTIALLY_APPROVED",
  REJECTED = "REJECTED",
  SETTLED = "SETTLED",
  DISPUTED = "DISPUTED",
}

export enum EvidenceType {
  PHOTO = "PHOTO",
  VIDEO = "VIDEO",
  RECEIPT = "RECEIPT",
  QUOTE = "QUOTE",
}

// ---------------------------------------------------------------------------
// Status config for UI display
// ---------------------------------------------------------------------------

export type ClaimStatusVariant =
  | "default"
  | "secondary"
  | "outline"
  | "destructive"
  | "success"
  | "warning";

export interface ClaimStatusConfig {
  label: string;
  variant: ClaimStatusVariant;
  icon: LucideIcon;
  description: string;
}

export const CLAIM_STATUS_CONFIG: Record<ClaimStatus, ClaimStatusConfig> = {
  [ClaimStatus.SUBMITTED]: {
    label: "Submitted",
    variant: "warning",
    icon: FileText,
    description: "Claim has been submitted and awaiting review",
  },
  [ClaimStatus.UNDER_REVIEW]: {
    label: "Under Review",
    variant: "secondary",
    icon: Search,
    description: "Claim is being reviewed by the owner",
  },
  [ClaimStatus.APPROVED]: {
    label: "Approved",
    variant: "success",
    icon: CheckCircle2,
    description: "Claim has been fully approved",
  },
  [ClaimStatus.PARTIALLY_APPROVED]: {
    label: "Partially Approved",
    variant: "default",
    icon: CheckCheck,
    description: "Claim has been partially approved with adjusted amount",
  },
  [ClaimStatus.REJECTED]: {
    label: "Rejected",
    variant: "destructive",
    icon: XCircle,
    description: "Claim has been rejected",
  },
  [ClaimStatus.SETTLED]: {
    label: "Settled",
    variant: "success",
    icon: Handshake,
    description: "Claim has been settled via deposit or billing deduction",
  },
  [ClaimStatus.DISPUTED]: {
    label: "Disputed",
    variant: "destructive",
    icon: AlertTriangle,
    description: "Claim decision has been disputed",
  },
};

// ---------------------------------------------------------------------------
// Type config for UI display
// ---------------------------------------------------------------------------

export interface ClaimTypeConfig {
  label: string;
  icon: LucideIcon;
  description: string;
}

export const CLAIM_TYPE_CONFIG: Record<ClaimType, ClaimTypeConfig> = {
  [ClaimType.DAMAGE]: {
    label: "Property Damage",
    icon: Hammer,
    description: "Damage to property structure, fixtures, or fittings",
  },
  [ClaimType.CLEANING]: {
    label: "Cleaning",
    icon: Sparkles,
    description: "Professional cleaning required beyond normal wear",
  },
  [ClaimType.MISSING_ITEM]: {
    label: "Missing Item",
    icon: PackageSearch,
    description: "Items from inventory that are missing",
  },
  [ClaimType.UTILITY]: {
    label: "Utility",
    icon: Zap,
    description: "Outstanding utility charges",
  },
  [ClaimType.OTHER]: {
    label: "Other",
    icon: HelpCircle,
    description: "Other claims not covered by standard categories",
  },
};

// ---------------------------------------------------------------------------
// Evidence type config
// ---------------------------------------------------------------------------

export interface EvidenceTypeConfig {
  label: string;
  accept: string;
  maxSize: number; // bytes
}

export const EVIDENCE_TYPE_CONFIG: Record<EvidenceType, EvidenceTypeConfig> = {
  [EvidenceType.PHOTO]: {
    label: "Photo",
    accept: "image/jpeg,image/png,image/webp,image/heic",
    maxSize: 10 * 1024 * 1024, // 10MB
  },
  [EvidenceType.VIDEO]: {
    label: "Video",
    accept: "video/mp4,video/quicktime,video/webm",
    maxSize: 100 * 1024 * 1024, // 100MB
  },
  [EvidenceType.RECEIPT]: {
    label: "Receipt",
    accept: "image/jpeg,image/png,application/pdf",
    maxSize: 10 * 1024 * 1024, // 10MB
  },
  [EvidenceType.QUOTE]: {
    label: "Quote",
    accept: "image/jpeg,image/png,application/pdf",
    maxSize: 10 * 1024 * 1024, // 10MB
  },
};

// ---------------------------------------------------------------------------
// Data interfaces
// ---------------------------------------------------------------------------

export interface ClaimEvidence {
  id: string;
  claimId: string;
  type: string; // PHOTO | VIDEO | RECEIPT | QUOTE
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  mimeType?: string;
  description?: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface ClaimTenancyRef {
  id: string;
  listing?: {
    id: string;
    title: string;
  };
  owner?: {
    id: string;
    name: string;
  };
  tenant?: {
    id: string;
    name: string;
    email?: string;
  };
}

export interface Claim {
  id: string;

  // Context
  tenancyId: string;
  tenancy?: ClaimTenancyRef;
  maintenanceId?: string;

  // Claim Details
  claimNumber: string;
  type: ClaimType;
  status: ClaimStatus;
  title: string;
  description: string;

  // Amounts
  claimedAmount: number;
  approvedAmount?: number;

  // Submission
  submittedBy: string;
  submittedRole: string; // 'OWNER' | 'TENANT'
  submittedAt: string;

  // Review
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;

  // Settlement
  settledAt?: string;
  settlementMethod?: string; // DEPOSIT_DEDUCTION | BILLING_DEDUCTION | DIRECT_PAYMENT

  // Dispute
  isDisputed: boolean;
  disputeReason?: string;
  disputedAt?: string;

  // Audit
  createdAt: string;
  updatedAt: string;

  // Relations
  evidence?: ClaimEvidence[];
}

// ---------------------------------------------------------------------------
// Filter types
// ---------------------------------------------------------------------------

export interface ClaimFilters {
  tenancyId?: string;
  type?: ClaimType;
  status?: ClaimStatus;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface ClaimFilterTab {
  value: string;
  label: string;
  statuses?: ClaimStatus[];
}

export const CLAIM_FILTER_TABS: ClaimFilterTab[] = [
  { value: "all", label: "All" },
  {
    value: "pending",
    label: "Pending",
    statuses: [ClaimStatus.SUBMITTED, ClaimStatus.UNDER_REVIEW],
  },
  {
    value: "approved",
    label: "Approved",
    statuses: [ClaimStatus.APPROVED, ClaimStatus.PARTIALLY_APPROVED],
  },
  {
    value: "rejected",
    label: "Rejected",
    statuses: [ClaimStatus.REJECTED],
  },
  {
    value: "settled",
    label: "Settled",
    statuses: [ClaimStatus.SETTLED],
  },
  {
    value: "disputed",
    label: "Disputed",
    statuses: [ClaimStatus.DISPUTED],
  },
];

/**
 * Get statuses to filter by based on a filter tab value.
 */
export function getStatusesForClaimFilter(
  filter: string
): ClaimStatus[] | undefined {
  const tab = CLAIM_FILTER_TABS.find((t) => t.value === filter);
  return tab?.statuses;
}

// ---------------------------------------------------------------------------
// DTOs
// ---------------------------------------------------------------------------

export interface CreateClaimDto {
  tenancyId: string;
  maintenanceId?: string;
  type: ClaimType;
  title: string;
  description: string;
  claimedAmount: number;
  submittedRole: string; // 'OWNER' | 'TENANT'
}

export interface UploadEvidenceDto {
  type: string; // PHOTO | VIDEO | RECEIPT | QUOTE
  fileName: string;
  mimeType: string;
  fileSize?: number;
  description?: string;
}

export interface UploadEvidenceResponse {
  uploadUrl: string;
  expiresAt: string;
  evidence: ClaimEvidence;
}

export interface ReviewClaimDto {
  decision: "APPROVED" | "PARTIALLY_APPROVED" | "REJECTED";
  approvedAmount?: number;
  notes?: string;
}

export interface DisputeClaimDto {
  reason: string;
  notes?: string;
}

// ---------------------------------------------------------------------------
// Settlement method labels
// ---------------------------------------------------------------------------

export const SETTLEMENT_METHOD_LABELS: Record<string, string> = {
  DEPOSIT_DEDUCTION: "Deposit Deduction",
  BILLING_DEDUCTION: "Billing Deduction",
  DIRECT_PAYMENT: "Direct Payment",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Statuses where the claim can be reviewed by the owner */
export function canReviewClaim(claim: Claim): boolean {
  return [
    ClaimStatus.SUBMITTED,
    ClaimStatus.UNDER_REVIEW,
    ClaimStatus.DISPUTED,
  ].includes(claim.status);
}

/** Statuses where the claim can be disputed */
export function canDisputeClaim(claim: Claim): boolean {
  return [
    ClaimStatus.APPROVED,
    ClaimStatus.PARTIALLY_APPROVED,
    ClaimStatus.REJECTED,
  ].includes(claim.status);
}

/** Whether the claim is in a terminal state */
export function isTerminalClaimStatus(status: ClaimStatus): boolean {
  return status === ClaimStatus.SETTLED;
}

/** Format currency for Malaysian Ringgit */
export function formatClaimAmount(amount: number): string {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    minimumFractionDigits: 2,
  }).format(amount);
}
