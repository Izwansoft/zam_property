// =============================================================================
// Contract Module Types
// =============================================================================
// Types for contract-related entities in the Property Management system.
// Matches backend Prisma schema.
// =============================================================================

// ---------------------------------------------------------------------------
// Contract Status (matches backend enum)
// ---------------------------------------------------------------------------

export enum ContractStatus {
  /** Initial draft, not yet sent */
  DRAFT = "DRAFT",
  /** Sent to parties, awaiting signatures */
  PENDING_SIGNATURES = "PENDING_SIGNATURES",
  /** Partially signed, waiting for remaining parties */
  PARTIALLY_SIGNED = "PARTIALLY_SIGNED",
  /** All parties have signed, contract is active */
  SIGNED = "SIGNED",
  /** Contract has expired */
  EXPIRED = "EXPIRED",
  /** Contract was voided/cancelled */
  VOIDED = "VOIDED",
}

// ---------------------------------------------------------------------------
// Contract Type
// ---------------------------------------------------------------------------

export enum ContractType {
  /** Standard tenancy agreement */
  TENANCY_AGREEMENT = "TENANCY_AGREEMENT",
  /** Addendum to existing contract */
  ADDENDUM = "ADDENDUM",
  /** Renewal agreement */
  RENEWAL = "RENEWAL",
  /** Early termination agreement */
  TERMINATION = "TERMINATION",
}

// ---------------------------------------------------------------------------
// Signer Status
// ---------------------------------------------------------------------------

export enum SignerStatus {
  /** Signature requested but not yet signed */
  PENDING = "PENDING",
  /** Signer has viewed the document */
  VIEWED = "VIEWED",
  /** Signer has signed */
  SIGNED = "SIGNED",
  /** Signer declined to sign */
  DECLINED = "DECLINED",
}

// ---------------------------------------------------------------------------
// Signer Role
// ---------------------------------------------------------------------------

export enum SignerRole {
  /** Property owner/landlord */
  OWNER = "OWNER",
  /** Partner/tenant */
  TENANT = "TENANT",
  /** Witness */
  WITNESS = "WITNESS",
  /** Guarantor */
  GUARANTOR = "GUARANTOR",
}

// ---------------------------------------------------------------------------
// Contract Signer
// ---------------------------------------------------------------------------

export interface ContractSigner {
  id: string;
  contractId: string;
  userId: string;
  role: SignerRole;
  status: SignerStatus;
  name: string;
  email: string;
  signedAt?: string;
  signatureUrl?: string;
  ipAddress?: string;
  order: number;
}

// ---------------------------------------------------------------------------
// Contract Terms Summary
// ---------------------------------------------------------------------------

export interface ContractTermsSummary {
  tenancyPeriod: {
    startDate: string;
    endDate: string;
    durationMonths: number;
  };
  financials: {
    monthlyRent: number;
    securityDeposit: number;
    utilityDeposit: number;
    stampDuty?: number;
    currency: string;
  };
  noticePeriodDays: number;
  renewalTerms?: string;
  specialClauses?: string[];
  petPolicy?: string;
  maintenanceResponsibilities?: {
    owner: string[];
    tenant: string[];
  };
}

// ---------------------------------------------------------------------------
// Contract Event (for activity tracking)
// ---------------------------------------------------------------------------

export interface ContractEvent {
  id: string;
  contractId: string;
  eventType: "CREATED" | "SENT" | "VIEWED" | "SIGNED" | "DECLINED" | "VOIDED" | "EXPIRED";
  actorId?: string;
  actorName?: string;
  actorRole?: SignerRole;
  description: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Contract (list item view)
// ---------------------------------------------------------------------------

export interface Contract {
  id: string;
  partnerId: string;
  tenancyId: string;
  type: ContractType;
  status: ContractStatus;
  version: number;
  title: string;
  description?: string;
  documentUrl?: string;
  pdfUrl?: string;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  signedAt?: string;
}

// ---------------------------------------------------------------------------
// Contract Detail (single entity view)
// ---------------------------------------------------------------------------

export interface ContractDetail extends Contract {
  /** All signers for this contract */
  signers: ContractSigner[];
  /** Extracted terms summary */
  terms: ContractTermsSummary;
  /** Contract events timeline */
  events: ContractEvent[];
  /** Related tenancy summary */
  tenancy?: {
    id: string;
    propertyTitle: string;
    propertyAddress: string;
    tenantName: string;
    ownerName: string;
  };
  /** HTML content for preview (if available) */
  htmlContent?: string;
  /** External signing URL (e.g., DocuSign) */
  externalSigningUrl?: string;
}

// ---------------------------------------------------------------------------
// Filter Params
// ---------------------------------------------------------------------------

export interface ContractFilters {
  status?: ContractStatus | ContractStatus[];
  type?: ContractType;
  tenancyId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: "createdAt" | "updatedAt" | "expiresAt";
  sortOrder?: "asc" | "desc";
}

// ---------------------------------------------------------------------------
// Status Configuration (for UI badges)
// ---------------------------------------------------------------------------

export type ContractStatusVariant =
  | "default"
  | "secondary"
  | "destructive"
  | "outline"
  | "success"
  | "warning";

export interface ContractStatusConfig {
  label: string;
  variant: ContractStatusVariant;
  description: string;
}

export const CONTRACT_STATUS_CONFIG: Record<ContractStatus, ContractStatusConfig> = {
  [ContractStatus.DRAFT]: {
    label: "Draft",
    variant: "outline",
    description: "Contract is being prepared",
  },
  [ContractStatus.PENDING_SIGNATURES]: {
    label: "Pending Signatures",
    variant: "warning",
    description: "Awaiting all parties to sign",
  },
  [ContractStatus.PARTIALLY_SIGNED]: {
    label: "Partially Signed",
    variant: "secondary",
    description: "Some parties have signed",
  },
  [ContractStatus.SIGNED]: {
    label: "Signed",
    variant: "success",
    description: "All parties have signed",
  },
  [ContractStatus.EXPIRED]: {
    label: "Expired",
    variant: "destructive",
    description: "Contract has expired",
  },
  [ContractStatus.VOIDED]: {
    label: "Voided",
    variant: "outline",
    description: "Contract was cancelled",
  },
};

// ---------------------------------------------------------------------------
// Signer Status Configuration
// ---------------------------------------------------------------------------

export const SIGNER_STATUS_CONFIG: Record<SignerStatus, {
  label: string;
  variant: ContractStatusVariant;
}> = {
  [SignerStatus.PENDING]: {
    label: "Pending",
    variant: "secondary",
  },
  [SignerStatus.VIEWED]: {
    label: "Viewed",
    variant: "warning",
  },
  [SignerStatus.SIGNED]: {
    label: "Signed",
    variant: "success",
  },
  [SignerStatus.DECLINED]: {
    label: "Declined",
    variant: "destructive",
  },
};
