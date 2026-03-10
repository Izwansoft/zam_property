// =============================================================================
// Billing Types — Matches backend Prisma schema exactly
// =============================================================================
// Backend: src/modules/billing/ | Prisma: RentBilling, RentBillingLineItem
// API: /api/v1/rent-billings
// =============================================================================

// ---------------------------------------------------------------------------
// Enums (match backend Prisma schema)
// ---------------------------------------------------------------------------

/**
 * RentBillingStatus — Backend enum
 * Flow: DRAFT → GENERATED → SENT → PAID
 *                         ↘       ↗
 *                    PARTIALLY_PAID
 *                         ↘
 *                        OVERDUE → WRITTEN_OFF
 */
export enum BillingStatus {
  DRAFT = "DRAFT",
  GENERATED = "GENERATED",
  SENT = "SENT",
  PARTIALLY_PAID = "PARTIALLY_PAID",
  PAID = "PAID",
  OVERDUE = "OVERDUE",
  WRITTEN_OFF = "WRITTEN_OFF",
}

/** RentBillingLineItemType — Backend enum */
export enum BillingLineItemType {
  RENT = "RENT",
  UTILITY = "UTILITY",
  LATE_FEE = "LATE_FEE",
  CLAIM_DEDUCTION = "CLAIM_DEDUCTION",
  OTHER = "OTHER",
}

/** RentBillingReminderType — Backend enum */
export enum BillingReminderType {
  EMAIL = "EMAIL",
  SMS = "SMS",
  LETTER = "LETTER",
  LEGAL_NOTICE = "LEGAL_NOTICE",
}

// ---------------------------------------------------------------------------
// Status Configuration (UI display)
// ---------------------------------------------------------------------------

export type BillingStatusVariant =
  | "default"
  | "success"
  | "warning"
  | "destructive"
  | "outline";

export interface BillingStatusConfig {
  label: string;
  variant: BillingStatusVariant;
  description: string;
}

export const BILLING_STATUS_CONFIG: Record<BillingStatus, BillingStatusConfig> =
  {
    [BillingStatus.DRAFT]: {
      label: "Draft",
      variant: "outline",
      description: "Bill is being prepared",
    },
    [BillingStatus.GENERATED]: {
      label: "Generated",
      variant: "outline",
      description: "Bill has been generated",
    },
    [BillingStatus.SENT]: {
      label: "Pending",
      variant: "warning",
      description: "Bill has been sent and awaits payment",
    },
    [BillingStatus.PARTIALLY_PAID]: {
      label: "Partial",
      variant: "warning",
      description: "Bill has been partially paid",
    },
    [BillingStatus.PAID]: {
      label: "Paid",
      variant: "success",
      description: "Bill has been fully paid",
    },
    [BillingStatus.OVERDUE]: {
      label: "Overdue",
      variant: "destructive",
      description: "Payment is past the due date",
    },
    [BillingStatus.WRITTEN_OFF]: {
      label: "Written Off",
      variant: "outline",
      description: "Bill has been written off",
    },
  };

// ---------------------------------------------------------------------------
// Line Item Interface
// ---------------------------------------------------------------------------

export interface BillingLineItem {
  id: string;
  billingId: string;
  description: string;
  type: BillingLineItemType;
  amount: number;
  claimId?: string | null;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Billing Reminder Interface
// ---------------------------------------------------------------------------

export interface BillingReminder {
  id: string;
  partnerId: string;
  billingId: string;
  sequence: number;
  type: BillingReminderType;
  status: string;
  sentAt: string;
  sentTo: string;
  response?: string | null;
  respondedAt?: string | null;
  escalatedAt?: string | null;
  escalatedTo?: string | null;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Tenancy Reference (embedded in billing)
// ---------------------------------------------------------------------------

export interface BillingTenancyRef {
  id: string;
  status: string;
  monthlyRent: number;
  billingDay: number;
  paymentDueDay: number;
  lateFeePercent: number | null;
  listing: {
    id: string;
    title: string;
  };
  owner: {
    id: string;
    name: string;
    email: string | null;
  };
  tenant: {
    id: string;
    user: {
      fullName: string;
      email: string;
    };
  };
}

// ---------------------------------------------------------------------------
// Billing (main interface)
// ---------------------------------------------------------------------------

export interface Billing {
  id: string;
  tenancyId: string;
  billNumber: string;
  billingPeriod: string;
  status: BillingStatus;
  rentAmount: number;
  lateFee: number;
  adjustments: number;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  issueDate: string;
  dueDate: string;
  paidDate: string | null;
  createdAt: string;
  updatedAt: string;
  /** Included in list/detail responses */
  lineItems?: BillingLineItem[];
  /** Included in detail view */
  tenancy?: BillingTenancyRef;
  /** Included in detail view */
  reminders?: BillingReminder[];
}

// ---------------------------------------------------------------------------
// Filter types
// ---------------------------------------------------------------------------

export interface BillingFilters {
  tenancyId?: string;
  status?: BillingStatus | BillingStatus[];
  billingPeriod?: string;
  fromDate?: string;
  toDate?: string;
  overdueOnly?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// ---------------------------------------------------------------------------
// Payment types (for PaymentHistory in bill detail)
// ---------------------------------------------------------------------------

/** RentPaymentStatus — Backend enum */
export enum PaymentStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  REFUNDED = "REFUNDED",
  DISPUTED = "DISPUTED",
}

/** PaymentMethod — Backend DTO enum */
export enum PaymentMethod {
  CARD = "CARD",
  FPX = "FPX",
  BANK_TRANSFER = "BANK_TRANSFER",
  CASH = "CASH",
  OTHER = "OTHER",
}

export type PaymentStatusVariant =
  | "default"
  | "success"
  | "warning"
  | "destructive"
  | "outline";

export interface PaymentStatusConfig {
  label: string;
  variant: PaymentStatusVariant;
  icon: string;
}

export const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, PaymentStatusConfig> =
  {
    [PaymentStatus.PENDING]: {
      label: "Pending",
      variant: "warning",
      icon: "clock",
    },
    [PaymentStatus.PROCESSING]: {
      label: "Processing",
      variant: "warning",
      icon: "loader",
    },
    [PaymentStatus.COMPLETED]: {
      label: "Completed",
      variant: "success",
      icon: "check-circle",
    },
    [PaymentStatus.FAILED]: {
      label: "Failed",
      variant: "destructive",
      icon: "x-circle",
    },
    [PaymentStatus.REFUNDED]: {
      label: "Refunded",
      variant: "outline",
      icon: "rotate-ccw",
    },
    [PaymentStatus.DISPUTED]: {
      label: "Disputed",
      variant: "destructive",
      icon: "alert-triangle",
    },
  };

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  [PaymentMethod.CARD]: "Credit/Debit Card",
  [PaymentMethod.FPX]: "FPX Online Banking",
  [PaymentMethod.BANK_TRANSFER]: "Bank Transfer",
  [PaymentMethod.CASH]: "Cash",
  [PaymentMethod.OTHER]: "Other",
};

/** A payment record associated with a billing */
export interface BillingPayment {
  id: string;
  billingId: string;
  paymentNumber: string;
  amount: number;
  status: PaymentStatus;
  method: PaymentMethod | string;
  currency: string;
  reference?: string | null;
  receiptNumber?: string | null;
  receiptUrl?: string | null;
  paymentDate?: string | null;
  processedAt?: string | null;
  payerName?: string | null;
  payerEmail?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Filter Tab Configuration
// ---------------------------------------------------------------------------

export interface BillingFilterTab {
  value: string;
  label: string;
  statuses?: BillingStatus[];
  overdueOnly?: boolean;
}

export const BILLING_FILTER_TABS: BillingFilterTab[] = [
  { value: "all", label: "All" },
  {
    value: "pending",
    label: "Pending",
    statuses: [BillingStatus.SENT, BillingStatus.GENERATED],
  },
  {
    value: "overdue",
    label: "Overdue",
    statuses: [BillingStatus.OVERDUE],
  },
  {
    value: "partial",
    label: "Partial",
    statuses: [BillingStatus.PARTIALLY_PAID],
  },
  {
    value: "paid",
    label: "Paid",
    statuses: [BillingStatus.PAID],
  },
];

/**
 * Get the statuses for a given filter tab value.
 * Returns undefined for "all" (no status filter).
 */
export function getStatusesForBillingFilter(
  filterValue: string
): BillingStatus[] | undefined {
  const tab = BILLING_FILTER_TABS.find((t) => t.value === filterValue);
  return tab?.statuses;
}

// ---------------------------------------------------------------------------
// Owner Billing Types (Session 6.5)
// ---------------------------------------------------------------------------

/** Summary stats returned by GET /rent-billings/summary */
export interface BillingSummary {
  tenancyId: string;
  totalBilled: number;
  totalPaid: number;
  totalOutstanding: number;
  totalBills: number;
  overdueCount: number;
  lastPaymentDate: string | null;
}

/** Owner billing dashboard overview stats (aggregated across properties) */
export interface OwnerBillingStats {
  totalDue: number;
  totalCollected: number;
  totalOverdue: number;
  totalBills: number;
  overdueCount: number;
  collectionRate: number;
}

/** Owner billing filter params — includes propertyId for property grouping */
export interface OwnerBillingFilters extends BillingFilters {
  /** Filter by owner ID (backend-scoped) */
  ownerId?: string;
  /** Filter by specific property/listing */
  listingId?: string;
}

/** Property grouping for owner bill list */
export interface PropertyBillingGroup {
  listingId: string;
  listingTitle: string;
  tenancyId: string;
  tenantName: string;
  billings: Billing[];
  totalDue: number;
  totalCollected: number;
  totalOverdue: number;
}

/** Owner billing filter tabs (extends base with "collected" tab) */
export const OWNER_BILLING_FILTER_TABS: BillingFilterTab[] = [
  { value: "all", label: "All Bills" },
  {
    value: "pending",
    label: "Pending",
    statuses: [BillingStatus.SENT, BillingStatus.GENERATED],
  },
  {
    value: "overdue",
    label: "Overdue",
    statuses: [BillingStatus.OVERDUE],
  },
  {
    value: "partial",
    label: "Partial",
    statuses: [BillingStatus.PARTIALLY_PAID],
  },
  {
    value: "collected",
    label: "Collected",
    statuses: [BillingStatus.PAID],
  },
  {
    value: "written_off",
    label: "Written Off",
    statuses: [BillingStatus.WRITTEN_OFF],
  },
];
