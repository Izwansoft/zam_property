// =============================================================================
// Tenant Module Types
// =============================================================================
// Types for tenant-related entities in the Property Management system.
// Matches backend Prisma schema.
// =============================================================================

// ---------------------------------------------------------------------------
// Tenant Status (matches backend enum)
// ---------------------------------------------------------------------------

export enum TenantStatus {
  PENDING = "PENDING",
  SCREENING = "SCREENING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  ACTIVE = "ACTIVE",
  NOTICE_GIVEN = "NOTICE_GIVEN",
  VACATED = "VACATED",
}

// ---------------------------------------------------------------------------
// Tenant Type (matches backend enum)
// ---------------------------------------------------------------------------

export enum TenantType {
  PRIMARY = "PRIMARY",
  SECONDARY = "SECONDARY",
  DEPENDENT = "DEPENDENT",
}

// ---------------------------------------------------------------------------
// Document Type (matches backend enum)
// ---------------------------------------------------------------------------

export enum TenantDocumentType {
  IC_FRONT = "IC_FRONT",
  IC_BACK = "IC_BACK",
  PASSPORT = "PASSPORT",
  EMPLOYMENT_LETTER = "EMPLOYMENT_LETTER",
  PAYSLIP = "PAYSLIP",
  BANK_STATEMENT = "BANK_STATEMENT",
  UTILITY_BILL = "UTILITY_BILL",
  REFERENCE_LETTER = "REFERENCE_LETTER",
  OTHER = "OTHER",
}

// ---------------------------------------------------------------------------
// Document Verification Status
// ---------------------------------------------------------------------------

export enum DocumentVerificationStatus {
  PENDING = "PENDING",
  VERIFIED = "VERIFIED",
  REJECTED = "REJECTED",
}

// ---------------------------------------------------------------------------
// Emergency Contact
// ---------------------------------------------------------------------------

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
}

// ---------------------------------------------------------------------------
// Tenant Document
// ---------------------------------------------------------------------------

export interface TenantDocument {
  id: string;
  tenantId: string;
  type: TenantDocumentType;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  verificationStatus: DocumentVerificationStatus;
  verifiedAt?: string;
  verifiedById?: string;
  rejectionReason?: string;
  expiryDate?: string;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Tenant — Main entity for property tenants/partners
// ---------------------------------------------------------------------------

export interface Tenant {
  id: string;
  userId: string;
  partnerId: string;
  status: TenantStatus;
  type: TenantType;

  // Personal information
  fullName: string;
  icNumber?: string;
  passportNumber?: string;
  dateOfBirth?: string;
  nationality?: string;
  phone: string;
  email: string;

  // Employment information
  employmentStatus?: string;
  employerName?: string;
  employerAddress?: string;
  jobTitle?: string;
  monthlyIncome?: number;

  // Emergency contacts
  emergencyContacts: EmergencyContact[];

  // Verification
  verifiedAt?: string;
  verifiedById?: string;
  rejectionReason?: string;

  // Documents
  documents: TenantDocument[];

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Tenant Profile — Summary view for dashboards
// ---------------------------------------------------------------------------

export interface TenantProfile {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  status: TenantStatus;
  type: TenantType;
  hasActiveTenancy: boolean;
  documentCount: number;
  verifiedDocumentCount: number;
}

// ---------------------------------------------------------------------------
// Create/Update DTOs
// ---------------------------------------------------------------------------

export interface CreateTenantDto {
  fullName: string;
  phone: string;
  email: string;
  icNumber?: string;
  passportNumber?: string;
  dateOfBirth?: string;
  nationality?: string;
  employmentStatus?: string;
  employerName?: string;
  employerAddress?: string;
  jobTitle?: string;
  monthlyIncome?: number;
  emergencyContacts?: EmergencyContact[];
}

export interface UpdateTenantDto extends Partial<CreateTenantDto> {}

// ---------------------------------------------------------------------------
// Upload Document DTO
// ---------------------------------------------------------------------------

export interface UploadTenantDocumentDto {
  type: TenantDocumentType;
  expiryDate?: string;
}

// ---------------------------------------------------------------------------
// Verify Document DTO
// ---------------------------------------------------------------------------

export interface VerifyDocumentDto {
  status: DocumentVerificationStatus;
  rejectionReason?: string;
}

// ---------------------------------------------------------------------------
// Query Parameters
// ---------------------------------------------------------------------------

export interface TenantQueryParams {
  page?: number;
  pageSize?: number;
  status?: TenantStatus;
  type?: TenantType;
  search?: string;
  partnerId?: string;
}

// ---------------------------------------------------------------------------
// API Responses
// ---------------------------------------------------------------------------

export interface TenantListResponse {
  data: Tenant[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export interface TenantResponse {
  data: Tenant;
}
