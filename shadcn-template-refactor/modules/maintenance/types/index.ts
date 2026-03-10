// =============================================================================
// Maintenance Types — Matches backend Prisma schema exactly
// =============================================================================
// Backend: src/modules/maintenance/ | Prisma: Maintenance, MaintenanceAttachment, MaintenanceUpdate
// API: /api/v1/maintenance
// =============================================================================

// ---------------------------------------------------------------------------
// Enums (match backend Prisma schema)
// ---------------------------------------------------------------------------

/**
 * MaintenanceStatus — Backend Prisma enum
 * Flow: OPEN → VERIFIED → ASSIGNED → IN_PROGRESS → PENDING_APPROVAL → CLOSED
 *       ↘ CANCELLED (from OPEN/VERIFIED/ASSIGNED)
 *       Claim flow: IN_PROGRESS → CLAIM_SUBMITTED → CLAIM_APPROVED/CLAIM_REJECTED
 */
export enum MaintenanceStatus {
  OPEN = "OPEN",
  VERIFIED = "VERIFIED",
  ASSIGNED = "ASSIGNED",
  IN_PROGRESS = "IN_PROGRESS",
  PENDING_APPROVAL = "PENDING_APPROVAL",
  CLAIM_SUBMITTED = "CLAIM_SUBMITTED",
  CLAIM_APPROVED = "CLAIM_APPROVED",
  CLAIM_REJECTED = "CLAIM_REJECTED",
  CLOSED = "CLOSED",
  CANCELLED = "CANCELLED",
}

/** MaintenancePriority — Backend Prisma enum */
export enum MaintenancePriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  URGENT = "URGENT",
}

/** MaintenanceCategory — Backend categories */
export enum MaintenanceCategory {
  PLUMBING = "PLUMBING",
  ELECTRICAL = "ELECTRICAL",
  APPLIANCE = "APPLIANCE",
  STRUCTURAL = "STRUCTURAL",
  OTHER = "OTHER",
}

/** Attachment type */
export enum MaintenanceAttachmentType {
  IMAGE = "IMAGE",
  VIDEO = "VIDEO",
  DOCUMENT = "DOCUMENT",
}

// ---------------------------------------------------------------------------
// Status Configuration (UI display)
// ---------------------------------------------------------------------------

export type MaintenanceStatusVariant =
  | "default"
  | "success"
  | "warning"
  | "destructive"
  | "outline";

export interface MaintenanceStatusConfig {
  label: string;
  variant: MaintenanceStatusVariant;
  description: string;
}

export const MAINTENANCE_STATUS_CONFIG: Record<
  MaintenanceStatus,
  MaintenanceStatusConfig
> = {
  [MaintenanceStatus.OPEN]: {
    label: "Open",
    variant: "warning",
    description: "Ticket submitted, awaiting verification",
  },
  [MaintenanceStatus.VERIFIED]: {
    label: "Verified",
    variant: "default",
    description: "Issue verified by property manager",
  },
  [MaintenanceStatus.ASSIGNED]: {
    label: "Assigned",
    variant: "default",
    description: "Assigned to technician or contractor",
  },
  [MaintenanceStatus.IN_PROGRESS]: {
    label: "In Progress",
    variant: "default",
    description: "Repair work is underway",
  },
  [MaintenanceStatus.PENDING_APPROVAL]: {
    label: "Pending Approval",
    variant: "warning",
    description: "Work completed, awaiting approval",
  },
  [MaintenanceStatus.CLAIM_SUBMITTED]: {
    label: "Claim Submitted",
    variant: "warning",
    description: "Claim submitted for costs",
  },
  [MaintenanceStatus.CLAIM_APPROVED]: {
    label: "Claim Approved",
    variant: "success",
    description: "Cost claim approved",
  },
  [MaintenanceStatus.CLAIM_REJECTED]: {
    label: "Claim Rejected",
    variant: "destructive",
    description: "Cost claim rejected",
  },
  [MaintenanceStatus.CLOSED]: {
    label: "Closed",
    variant: "success",
    description: "Issue resolved and closed",
  },
  [MaintenanceStatus.CANCELLED]: {
    label: "Cancelled",
    variant: "outline",
    description: "Ticket was cancelled",
  },
};

// ---------------------------------------------------------------------------
// Priority Configuration
// ---------------------------------------------------------------------------

export interface MaintenancePriorityConfig {
  label: string;
  variant: MaintenanceStatusVariant;
  icon: string;
}

export const MAINTENANCE_PRIORITY_CONFIG: Record<
  MaintenancePriority,
  MaintenancePriorityConfig
> = {
  [MaintenancePriority.LOW]: {
    label: "Low",
    variant: "outline",
    icon: "ArrowDown",
  },
  [MaintenancePriority.MEDIUM]: {
    label: "Medium",
    variant: "default",
    icon: "Minus",
  },
  [MaintenancePriority.HIGH]: {
    label: "High",
    variant: "warning",
    icon: "ArrowUp",
  },
  [MaintenancePriority.URGENT]: {
    label: "Urgent",
    variant: "destructive",
    icon: "AlertTriangle",
  },
};

// ---------------------------------------------------------------------------
// Category Configuration
// ---------------------------------------------------------------------------

export interface MaintenanceCategoryConfig {
  label: string;
  icon: string;
  description: string;
}

export const MAINTENANCE_CATEGORY_CONFIG: Record<
  MaintenanceCategory,
  MaintenanceCategoryConfig
> = {
  [MaintenanceCategory.PLUMBING]: {
    label: "Plumbing",
    icon: "Droplets",
    description: "Water pipes, faucets, drainage, toilet",
  },
  [MaintenanceCategory.ELECTRICAL]: {
    label: "Electrical",
    icon: "Zap",
    description: "Wiring, outlets, lighting, switches",
  },
  [MaintenanceCategory.APPLIANCE]: {
    label: "Appliance",
    icon: "Refrigerator",
    description: "AC, water heater, washing machine, stove",
  },
  [MaintenanceCategory.STRUCTURAL]: {
    label: "Structural",
    icon: "Building2",
    description: "Walls, floors, ceiling, doors, windows",
  },
  [MaintenanceCategory.OTHER]: {
    label: "Other",
    icon: "HelpCircle",
    description: "Pest control, cleaning, general issues",
  },
};

// ---------------------------------------------------------------------------
// Data Interfaces
// ---------------------------------------------------------------------------

/** Maintenance attachment record */
export interface MaintenanceAttachment {
  id: string;
  maintenanceId: string;
  type: MaintenanceAttachmentType;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  uploadedAt: string;
}

/** Maintenance update/comment record */
export interface MaintenanceUpdate {
  id: string;
  maintenanceId: string;
  message: string;
  isInternal: boolean;
  createdBy: string;
  createdAt: string;
}

/** Tenancy reference embedded in maintenance */
export interface MaintenanceTenancyRef {
  id: string;
  property?: {
    id: string;
    title: string;
    address?: string;
  };
  tenant?: {
    id: string;
    name: string;
    email?: string;
  };
  owner?: {
    id: string;
    name: string;
    email?: string;
  };
}

/** Full maintenance ticket */
export interface Maintenance {
  id: string;
  tenancyId: string;
  ticketNumber: string;
  title: string;
  description: string;
  category: MaintenanceCategory;
  location?: string;
  status: MaintenanceStatus;
  priority: MaintenancePriority;
  reportedBy: string;
  reportedAt: string;
  verifiedBy?: string;
  verifiedAt?: string;
  verificationNotes?: string;
  assignedTo?: string;
  assignedAt?: string;
  contractorName?: string;
  contractorPhone?: string;
  startedAt?: string;
  closedAt?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolution?: string;
  estimatedCost?: number;
  actualCost?: number;
  paidBy?: string;
  createdAt: string;
  updatedAt: string;
  attachments: MaintenanceAttachment[];
  updates: MaintenanceUpdate[];
  tenancy?: MaintenanceTenancyRef;
}

// ---------------------------------------------------------------------------
// Filter / Query Types
// ---------------------------------------------------------------------------

export interface MaintenanceFilters {
  status?: MaintenanceStatus | MaintenanceStatus[];
  priority?: MaintenancePriority;
  category?: MaintenanceCategory;
  tenancyId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: "createdAt" | "updatedAt" | "priority" | "status";
  sortOrder?: "asc" | "desc";
}

export interface MaintenanceFilterTab {
  value: string;
  label: string;
  statuses?: MaintenanceStatus[];
}

export const MAINTENANCE_FILTER_TABS: MaintenanceFilterTab[] = [
  { value: "all", label: "All" },
  {
    value: "active",
    label: "Active",
    statuses: [
      MaintenanceStatus.OPEN,
      MaintenanceStatus.VERIFIED,
      MaintenanceStatus.ASSIGNED,
      MaintenanceStatus.IN_PROGRESS,
      MaintenanceStatus.PENDING_APPROVAL,
    ],
  },
  {
    value: "open",
    label: "Open",
    statuses: [MaintenanceStatus.OPEN],
  },
  {
    value: "in-progress",
    label: "In Progress",
    statuses: [
      MaintenanceStatus.VERIFIED,
      MaintenanceStatus.ASSIGNED,
      MaintenanceStatus.IN_PROGRESS,
    ],
  },
  {
    value: "closed",
    label: "Closed",
    statuses: [MaintenanceStatus.CLOSED, MaintenanceStatus.CANCELLED],
  },
];

// ---------------------------------------------------------------------------
// Create / Update DTOs
// ---------------------------------------------------------------------------

/** DTO for creating a new maintenance ticket */
export interface CreateMaintenanceDto {
  tenancyId: string;
  title: string;
  description: string;
  category: MaintenanceCategory;
  location?: string;
  priority?: MaintenancePriority;
}

/** DTO for adding an attachment (returns presigned URL) */
export interface AddAttachmentDto {
  type: MaintenanceAttachmentType;
  fileName: string;
  mimeType: string;
  fileSize: number;
}

/** Response from attachment creation */
export interface AttachmentUploadResponse {
  attachment: MaintenanceAttachment;
  uploadUrl: string;
  expiresAt: string;
}

/** DTO for adding a comment */
export interface AddCommentDto {
  message: string;
  isInternal?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Get statuses for a filter tab value.
 * Returns undefined for "all" tab (no status filter).
 */
export function getStatusesForMaintenanceFilter(
  filterValue: string
): MaintenanceStatus[] | undefined {
  const tab = MAINTENANCE_FILTER_TABS.find((t) => t.value === filterValue);
  return tab?.statuses;
}
