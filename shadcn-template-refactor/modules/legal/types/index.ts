// =============================================================================
// Legal Module — Type Definitions
// =============================================================================
// Matches backend Prisma schema exactly.
// Enums: LegalCaseStatus, LegalCaseReason, LegalDocumentType, NoticeType
// API: /api/v1/legal-cases, /api/v1/panel-lawyers
// =============================================================================

import type { LucideIcon } from "lucide-react";
import {
  Send,
  Clock,
  Handshake,
  Gavel,
  CalendarClock,
  Scale,
  ShieldCheck,
  Lock,
  FileWarning,
  AlertTriangle,
  Ban,
  HelpCircle,
  FileText,
  MessageSquare,
  FilePlus,
  FileCheck,
  Mail,
  MailWarning,
  FileX,
  FolderOpen,
  Receipt,
  MoreHorizontal,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Enums (must match backend exactly)
// ---------------------------------------------------------------------------

export enum LegalCaseStatus {
  NOTICE_SENT = "NOTICE_SENT",
  RESPONSE_PENDING = "RESPONSE_PENDING",
  MEDIATION = "MEDIATION",
  COURT_FILED = "COURT_FILED",
  HEARING_SCHEDULED = "HEARING_SCHEDULED",
  JUDGMENT = "JUDGMENT",
  ENFORCING = "ENFORCING",
  CLOSED = "CLOSED",
}

export enum LegalCaseReason {
  NON_PAYMENT = "NON_PAYMENT",
  BREACH = "BREACH",
  DAMAGE = "DAMAGE",
  OTHER = "OTHER",
}

export enum LegalDocumentType {
  NOTICE = "NOTICE",
  RESPONSE = "RESPONSE",
  COURT_FILING = "COURT_FILING",
  JUDGMENT = "JUDGMENT",
  FIRST_REMINDER = "FIRST_REMINDER",
  SECOND_REMINDER = "SECOND_REMINDER",
  LEGAL_NOTICE = "LEGAL_NOTICE",
  TERMINATION_NOTICE = "TERMINATION_NOTICE",
  EVIDENCE = "EVIDENCE",
  CORRESPONDENCE = "CORRESPONDENCE",
  SETTLEMENT = "SETTLEMENT",
  OTHER = "OTHER",
}

export enum NoticeType {
  FIRST_REMINDER = "FIRST_REMINDER",
  SECOND_REMINDER = "SECOND_REMINDER",
  LEGAL_NOTICE = "LEGAL_NOTICE",
  TERMINATION_NOTICE = "TERMINATION_NOTICE",
}

// ---------------------------------------------------------------------------
// Status config for UI display
// ---------------------------------------------------------------------------

export type LegalStatusVariant =
  | "default"
  | "secondary"
  | "outline"
  | "destructive"
  | "success"
  | "warning";

export interface LegalStatusConfig {
  label: string;
  variant: LegalStatusVariant;
  icon: LucideIcon;
  description: string;
}

export const LEGAL_CASE_STATUS_CONFIG: Record<LegalCaseStatus, LegalStatusConfig> = {
  [LegalCaseStatus.NOTICE_SENT]: {
    label: "Notice Sent",
    variant: "warning",
    icon: Send,
    description: "Initial notice has been sent to the tenant",
  },
  [LegalCaseStatus.RESPONSE_PENDING]: {
    label: "Response Pending",
    variant: "secondary",
    icon: Clock,
    description: "Awaiting response from the tenant",
  },
  [LegalCaseStatus.MEDIATION]: {
    label: "Mediation",
    variant: "default",
    icon: Handshake,
    description: "Case is in mediation process",
  },
  [LegalCaseStatus.COURT_FILED]: {
    label: "Court Filed",
    variant: "destructive",
    icon: Gavel,
    description: "Case has been filed with the court",
  },
  [LegalCaseStatus.HEARING_SCHEDULED]: {
    label: "Hearing Scheduled",
    variant: "destructive",
    icon: CalendarClock,
    description: "Court hearing has been scheduled",
  },
  [LegalCaseStatus.JUDGMENT]: {
    label: "Judgment",
    variant: "destructive",
    icon: Scale,
    description: "Court judgment has been delivered",
  },
  [LegalCaseStatus.ENFORCING]: {
    label: "Enforcing",
    variant: "warning",
    icon: ShieldCheck,
    description: "Judgment is being enforced",
  },
  [LegalCaseStatus.CLOSED]: {
    label: "Closed",
    variant: "success",
    icon: Lock,
    description: "Case has been resolved and closed",
  },
};

// ---------------------------------------------------------------------------
// Reason config for UI display
// ---------------------------------------------------------------------------

export interface LegalReasonConfig {
  label: string;
  icon: LucideIcon;
  description: string;
}

export const LEGAL_CASE_REASON_CONFIG: Record<LegalCaseReason, LegalReasonConfig> = {
  [LegalCaseReason.NON_PAYMENT]: {
    label: "Non-Payment",
    icon: FileWarning,
    description: "Overdue rent or charges remain unpaid",
  },
  [LegalCaseReason.BREACH]: {
    label: "Breach of Contract",
    icon: AlertTriangle,
    description: "Violation of tenancy agreement terms",
  },
  [LegalCaseReason.DAMAGE]: {
    label: "Property Damage",
    icon: Ban,
    description: "Significant damage to the property",
  },
  [LegalCaseReason.OTHER]: {
    label: "Other",
    icon: HelpCircle,
    description: "Other legal grounds",
  },
};

// ---------------------------------------------------------------------------
// Document type config
// ---------------------------------------------------------------------------

export interface LegalDocTypeConfig {
  label: string;
  icon: LucideIcon;
  description: string;
}

export const LEGAL_DOCUMENT_TYPE_CONFIG: Record<LegalDocumentType, LegalDocTypeConfig> = {
  [LegalDocumentType.NOTICE]: {
    label: "Notice",
    icon: FileText,
    description: "Formal notice document",
  },
  [LegalDocumentType.RESPONSE]: {
    label: "Response",
    icon: MessageSquare,
    description: "Response from the other party",
  },
  [LegalDocumentType.COURT_FILING]: {
    label: "Court Filing",
    icon: FilePlus,
    description: "Filed with the court",
  },
  [LegalDocumentType.JUDGMENT]: {
    label: "Judgment",
    icon: FileCheck,
    description: "Court judgment document",
  },
  [LegalDocumentType.FIRST_REMINDER]: {
    label: "First Reminder",
    icon: Mail,
    description: "First reminder notice",
  },
  [LegalDocumentType.SECOND_REMINDER]: {
    label: "Second Reminder",
    icon: MailWarning,
    description: "Second reminder notice",
  },
  [LegalDocumentType.LEGAL_NOTICE]: {
    label: "Legal Notice",
    icon: FileWarning,
    description: "Formal legal notice",
  },
  [LegalDocumentType.TERMINATION_NOTICE]: {
    label: "Termination Notice",
    icon: FileX,
    description: "Tenancy termination notice",
  },
  [LegalDocumentType.EVIDENCE]: {
    label: "Evidence",
    icon: FolderOpen,
    description: "Supporting evidence documents",
  },
  [LegalDocumentType.CORRESPONDENCE]: {
    label: "Correspondence",
    icon: MessageSquare,
    description: "General correspondence",
  },
  [LegalDocumentType.SETTLEMENT]: {
    label: "Settlement",
    icon: Receipt,
    description: "Settlement agreement document",
  },
  [LegalDocumentType.OTHER]: {
    label: "Other",
    icon: MoreHorizontal,
    description: "Other document type",
  },
};

// ---------------------------------------------------------------------------
// Notice type config
// ---------------------------------------------------------------------------

export interface NoticeTypeConfig {
  label: string;
  description: string;
}

export const NOTICE_TYPE_CONFIG: Record<NoticeType, NoticeTypeConfig> = {
  [NoticeType.FIRST_REMINDER]: {
    label: "First Reminder",
    description: "Initial reminder for overdue obligation",
  },
  [NoticeType.SECOND_REMINDER]: {
    label: "Second Reminder",
    description: "Final reminder before escalation",
  },
  [NoticeType.LEGAL_NOTICE]: {
    label: "Legal Notice",
    description: "Formal legal notice through counsel",
  },
  [NoticeType.TERMINATION_NOTICE]: {
    label: "Termination Notice",
    description: "Notice of tenancy termination",
  },
};

// ---------------------------------------------------------------------------
// Status transitions (state machine)
// ---------------------------------------------------------------------------

export const LEGAL_CASE_TRANSITIONS: Record<LegalCaseStatus, LegalCaseStatus[]> = {
  [LegalCaseStatus.NOTICE_SENT]: [LegalCaseStatus.RESPONSE_PENDING, LegalCaseStatus.CLOSED],
  [LegalCaseStatus.RESPONSE_PENDING]: [LegalCaseStatus.MEDIATION, LegalCaseStatus.COURT_FILED, LegalCaseStatus.CLOSED],
  [LegalCaseStatus.MEDIATION]: [LegalCaseStatus.COURT_FILED, LegalCaseStatus.CLOSED],
  [LegalCaseStatus.COURT_FILED]: [LegalCaseStatus.HEARING_SCHEDULED, LegalCaseStatus.CLOSED],
  [LegalCaseStatus.HEARING_SCHEDULED]: [LegalCaseStatus.JUDGMENT, LegalCaseStatus.CLOSED],
  [LegalCaseStatus.JUDGMENT]: [LegalCaseStatus.ENFORCING, LegalCaseStatus.CLOSED],
  [LegalCaseStatus.ENFORCING]: [LegalCaseStatus.CLOSED],
  [LegalCaseStatus.CLOSED]: [],
};

// ---------------------------------------------------------------------------
// Data interfaces
// ---------------------------------------------------------------------------

export interface PanelLawyer {
  id: string;
  partnerId: string;
  name: string;
  firm?: string | null;
  email: string;
  phone: string;
  specialization: string[];
  isActive: boolean;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LegalDocument {
  id: string;
  caseId: string;
  type: string;
  title: string;
  fileName: string;
  fileUrl: string;
  generatedBy?: string | null;
  notes?: string | null;
  createdAt: string;
}

export interface LegalCaseTenancyRef {
  id: string;
  listing?: {
    id: string;
    title: string;
  };
  tenant?: {
    id: string;
    name: string;
    email?: string;
  };
}

export interface LegalCase {
  id: string;

  // Context
  partnerId: string;
  tenancyId: string;
  tenancy?: LegalCaseTenancyRef;

  // Case Details
  caseNumber: string;
  status: LegalCaseStatus;
  reason: string; // LegalCaseReason value
  description: string;
  amountOwed: number;

  // Lawyer
  lawyerId?: string | null;
  lawyer?: PanelLawyer | null;

  // Dates
  noticeDate?: string | null;
  noticeDeadline?: string | null;
  courtDate?: string | null;
  judgmentDate?: string | null;

  // Resolution
  resolvedAt?: string | null;
  resolution?: string | null;
  settlementAmount?: number | null;
  notes?: string | null;

  // Audit
  createdAt: string;
  updatedAt: string;

  // Relations
  documents?: LegalDocument[];
}

// ---------------------------------------------------------------------------
// Filter types
// ---------------------------------------------------------------------------

export interface LegalCaseFilters {
  status?: LegalCaseStatus;
  reason?: LegalCaseReason;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface LegalCaseFilterTab {
  value: string;
  label: string;
  statuses?: LegalCaseStatus[];
}

export const LEGAL_CASE_FILTER_TABS: LegalCaseFilterTab[] = [
  { value: "all", label: "All Cases" },
  {
    value: "active",
    label: "Active",
    statuses: [
      LegalCaseStatus.NOTICE_SENT,
      LegalCaseStatus.RESPONSE_PENDING,
      LegalCaseStatus.MEDIATION,
    ],
  },
  {
    value: "court",
    label: "In Court",
    statuses: [
      LegalCaseStatus.COURT_FILED,
      LegalCaseStatus.HEARING_SCHEDULED,
      LegalCaseStatus.JUDGMENT,
    ],
  },
  {
    value: "enforcing",
    label: "Enforcing",
    statuses: [LegalCaseStatus.ENFORCING],
  },
  {
    value: "closed",
    label: "Closed",
    statuses: [LegalCaseStatus.CLOSED],
  },
];

/**
 * Get statuses to filter by based on a filter tab value.
 */
export function getStatusesForLegalFilter(
  filter: string
): LegalCaseStatus[] | undefined {
  const tab = LEGAL_CASE_FILTER_TABS.find((t) => t.value === filter);
  return tab?.statuses;
}

// ---------------------------------------------------------------------------
// DTOs
// ---------------------------------------------------------------------------

export interface CreateLegalCaseDto {
  tenancyId: string;
  reason: LegalCaseReason;
  description: string;
  amountOwed: number;
  notes?: string;
}

export interface UpdateLegalCaseDto {
  description?: string;
  amountOwed?: number;
  courtDate?: string;
  notes?: string;
}

export interface AssignLawyerDto {
  lawyerId: string;
}

export interface GenerateNoticeDto {
  type: NoticeType;
  notes?: string;
}

export interface ResolveCaseDto {
  resolution?: string;
  settlementAmount?: number;
  notes?: string;
}

export interface UploadLegalDocumentDto {
  type: LegalDocumentType;
  title: string;
  fileName: string;
  fileUrl: string;
  notes?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Clean filters for API query (strip empty values, rename pageSize→limit) */
export function cleanLegalCaseFilters(
  filters: LegalCaseFilters
): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== "") {
      if (key === "pageSize") {
        cleaned["limit"] = value;
      } else {
        cleaned[key] = value;
      }
    }
  }
  return cleaned;
}

/** Whether the case has possible next transitions */
export function canTransitionCase(status: LegalCaseStatus): boolean {
  return LEGAL_CASE_TRANSITIONS[status].length > 0;
}

/** Whether the case is in a terminal state */
export function isTerminalLegalStatus(status: LegalCaseStatus): boolean {
  return status === LegalCaseStatus.CLOSED;
}

/** Whether the case involves court proceedings */
export function isCourtPhase(status: LegalCaseStatus): boolean {
  return [
    LegalCaseStatus.COURT_FILED,
    LegalCaseStatus.HEARING_SCHEDULED,
    LegalCaseStatus.JUDGMENT,
    LegalCaseStatus.ENFORCING,
  ].includes(status);
}

/** Format currency for Malaysian Ringgit */
export function formatLegalAmount(amount: number): string {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    minimumFractionDigits: 2,
  }).format(amount);
}

/** Get ordered status list for timeline display */
export function getLegalStatusOrder(): LegalCaseStatus[] {
  return [
    LegalCaseStatus.NOTICE_SENT,
    LegalCaseStatus.RESPONSE_PENDING,
    LegalCaseStatus.MEDIATION,
    LegalCaseStatus.COURT_FILED,
    LegalCaseStatus.HEARING_SCHEDULED,
    LegalCaseStatus.JUDGMENT,
    LegalCaseStatus.ENFORCING,
    LegalCaseStatus.CLOSED,
  ];
}
