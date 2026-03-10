// =============================================================================
// Tenancy Module Types
// =============================================================================
// Types for tenancy-related entities in the Property Management system.
// Matches backend Prisma schema.
// =============================================================================

// ---------------------------------------------------------------------------
// Tenancy Status (matches backend enum)
// ---------------------------------------------------------------------------

export enum TenancyStatus {
  /** Initial booking - pending deposit and documents */
  PENDING_BOOKING = "PENDING_BOOKING",
  /** Deposit received, awaiting contract */
  PENDING_CONTRACT = "PENDING_CONTRACT",
  /** Contract sent, awaiting signatures */
  PENDING_SIGNATURES = "PENDING_SIGNATURES",
  /** Contract signed, awaiting move-in */
  APPROVED = "APPROVED",
  /** Currently occupied */
  ACTIVE = "ACTIVE",
  /** Rent overdue */
  OVERDUE = "OVERDUE",
  /** Termination requested */
  TERMINATION_REQUESTED = "TERMINATION_REQUESTED",
  /** Move-out in progress */
  TERMINATING = "TERMINATING",
  /** Tenancy ended */
  TERMINATED = "TERMINATED",
  /** Cancelled before activation */
  CANCELLED = "CANCELLED",
}

// ---------------------------------------------------------------------------
// Tenancy Type
// ---------------------------------------------------------------------------

export enum TenancyType {
  /** Standard residential lease */
  RESIDENTIAL = "RESIDENTIAL",
  /** Commercial property lease */
  COMMERCIAL = "COMMERCIAL",
  /** Short-term rental */
  SHORT_TERM = "SHORT_TERM",
}

// ---------------------------------------------------------------------------
// Embedded Property Summary (for listing display)
// ---------------------------------------------------------------------------

export interface TenancyPropertySummary {
  id: string;
  title: string;
  address: string;
  city?: string;
  state?: string;
  thumbnailUrl?: string;
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
}

// ---------------------------------------------------------------------------
// Embedded Unit Summary (for unit display)
// ---------------------------------------------------------------------------

export interface TenancyUnitSummary {
  id: string;
  unitNumber: string;
  floor?: number;
  block?: string;
}

// ---------------------------------------------------------------------------
// Embedded Owner Summary
// ---------------------------------------------------------------------------

export interface TenancyOwnerSummary {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

// ---------------------------------------------------------------------------
// Financial Summary
// ---------------------------------------------------------------------------

export interface TenancyFinancialSummary {
  monthlyRent: number;
  securityDeposit: number;
  utilityDeposit: number;
  stampDutyFee?: number;
  currency: string;
  totalDeposits: number;
  depositsCollected: number;
  depositsPending: number;
  outstandingBalance: number;
}

// ---------------------------------------------------------------------------
// Tenancy (list item view)
// ---------------------------------------------------------------------------

export interface Tenancy {
  id: string;
  partnerId: string;
  tenantId: string;
  propertyId: string;
  unitId?: string;
  ownerId: string;
  type: TenancyType;
  status: TenancyStatus;
  
  // Dates
  startDate: string;
  endDate: string;
  moveInDate?: string;
  moveOutDate?: string;
  
  // Financial
  monthlyRent: number;
  currency: string;
  securityDeposit: number;
  utilityDeposit: number;
  
  // Embedded summaries
  property: TenancyPropertySummary;
  unit?: TenancyUnitSummary;
  owner?: TenancyOwnerSummary;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Tenancy Detail (single entity view)
// ---------------------------------------------------------------------------

export interface TenancyDetail extends Tenancy {
  // Contract info
  contractId?: string;
  contractUrl?: string;
  contractStatus?: "DRAFT" | "PENDING_SIGNATURES" | "SIGNED" | "EXPIRED";
  
  // Financial summary
  financial: TenancyFinancialSummary;
  
  // Timeline events
  statusHistory?: TenancyStatusChange[];
  
  // Terms
  noticePeriodDays: number;
  renewalTerms?: string;
  specialTerms?: string;
}

// ---------------------------------------------------------------------------
// Tenancy Status Change (for timeline)
// ---------------------------------------------------------------------------

export interface TenancyStatusChange {
  id: string;
  fromStatus: TenancyStatus;
  toStatus: TenancyStatus;
  changedAt: string;
  changedById: string;
  reason?: string;
}

// ---------------------------------------------------------------------------
// Filter Params
// ---------------------------------------------------------------------------

export interface TenancyFilters {
  status?: TenancyStatus | TenancyStatus[];
  type?: TenancyType;
  propertyId?: string;
  search?: string;
  startDateFrom?: string;
  startDateTo?: string;
  page?: number;
  pageSize?: number;
  sortBy?: "startDate" | "endDate" | "createdAt" | "monthlyRent";
  sortOrder?: "asc" | "desc";
}

// ---------------------------------------------------------------------------
// Status Configuration (for UI badges)
// ---------------------------------------------------------------------------

export type TenancyStatusVariant =
  | "default"
  | "secondary"
  | "destructive"
  | "outline"
  | "success"
  | "warning";

export interface TenancyStatusConfig {
  label: string;
  variant: TenancyStatusVariant;
  description: string;
}

export const TENANCY_STATUS_CONFIG: Record<TenancyStatus, TenancyStatusConfig> = {
  [TenancyStatus.PENDING_BOOKING]: {
    label: "Pending Booking",
    variant: "secondary",
    description: "Awaiting deposit and documents",
  },
  [TenancyStatus.PENDING_CONTRACT]: {
    label: "Pending Contract",
    variant: "secondary",
    description: "Deposit received, preparing contract",
  },
  [TenancyStatus.PENDING_SIGNATURES]: {
    label: "Pending Signatures",
    variant: "warning",
    description: "Contract sent, awaiting signatures",
  },
  [TenancyStatus.APPROVED]: {
    label: "Approved",
    variant: "success",
    description: "Contract signed, awaiting move-in",
  },
  [TenancyStatus.ACTIVE]: {
    label: "Active",
    variant: "success",
    description: "Currently occupied",
  },
  [TenancyStatus.OVERDUE]: {
    label: "Overdue",
    variant: "destructive",
    description: "Rent payment overdue",
  },
  [TenancyStatus.TERMINATION_REQUESTED]: {
    label: "Termination Requested",
    variant: "warning",
    description: "Partner requested termination",
  },
  [TenancyStatus.TERMINATING]: {
    label: "Terminating",
    variant: "warning",
    description: "Move-out in progress",
  },
  [TenancyStatus.TERMINATED]: {
    label: "Terminated",
    variant: "outline",
    description: "Tenancy ended",
  },
  [TenancyStatus.CANCELLED]: {
    label: "Cancelled",
    variant: "outline",
    description: "Cancelled before activation",
  },
};
