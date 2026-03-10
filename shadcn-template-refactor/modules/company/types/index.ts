// =============================================================================
// Company Module — Type Definitions
// =============================================================================
// Types for company registration, management, and admin operations.
// Matches backend Prisma enums and API contracts exactly.
// =============================================================================

import type { LucideIcon } from "lucide-react";
import { Building2, Briefcase, Users } from "lucide-react";

// ---------------------------------------------------------------------------
// Enums (match Prisma exactly)
// ---------------------------------------------------------------------------

/** Company type — matches backend CompanyType enum */
export const CompanyType = {
  PROPERTY_COMPANY: "PROPERTY_COMPANY",
  MANAGEMENT_COMPANY: "MANAGEMENT_COMPANY",
  AGENCY: "AGENCY",
} as const;
export type CompanyType = (typeof CompanyType)[keyof typeof CompanyType];

/** Company status — matches backend CompanyStatus enum */
export const CompanyStatus = {
  PENDING: "PENDING",
  ACTIVE: "ACTIVE",
  SUSPENDED: "SUSPENDED",
} as const;
export type CompanyStatus = (typeof CompanyStatus)[keyof typeof CompanyStatus];

/** Company admin role — matches backend CompanyAdminRole enum */
export const CompanyAdminRole = {
  ADMIN: "ADMIN",
  PIC: "PIC",
} as const;
export type CompanyAdminRole =
  (typeof CompanyAdminRole)[keyof typeof CompanyAdminRole];

// ---------------------------------------------------------------------------
// Display Configs
// ---------------------------------------------------------------------------

export interface CompanyTypeConfig {
  label: string;
  description: string;
  icon: LucideIcon;
}

export const COMPANY_TYPE_CONFIG: Record<CompanyType, CompanyTypeConfig> = {
  [CompanyType.PROPERTY_COMPANY]: {
    label: "Property Company",
    description: "Owns and manages property portfolios",
    icon: Building2,
  },
  [CompanyType.MANAGEMENT_COMPANY]: {
    label: "Management Company",
    description: "Provides property management services",
    icon: Briefcase,
  },
  [CompanyType.AGENCY]: {
    label: "Agency",
    description: "Real estate agency with licensed agents",
    icon: Users,
  },
};

export interface CompanyStatusConfig {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
  description: string;
}

export const COMPANY_STATUS_CONFIG: Record<CompanyStatus, CompanyStatusConfig> =
  {
    [CompanyStatus.PENDING]: {
      label: "Pending Verification",
      variant: "secondary",
      description: "Awaiting document verification",
    },
    [CompanyStatus.ACTIVE]: {
      label: "Active",
      variant: "default",
      description: "Company is verified and active",
    },
    [CompanyStatus.SUSPENDED]: {
      label: "Suspended",
      variant: "destructive",
      description: "Company has been suspended",
    },
  };

export const COMPANY_ADMIN_ROLE_CONFIG: Record<
  CompanyAdminRole,
  { label: string; description: string }
> = {
  [CompanyAdminRole.ADMIN]: {
    label: "Admin",
    description: "Full company management access",
  },
  [CompanyAdminRole.PIC]: {
    label: "Person in Charge",
    description: "Main contact for the company",
  },
};

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

/** Company admin view from API */
export interface CompanyAdmin {
  id: string;
  companyId: string;
  userId: string;
  role: CompanyAdminRole;
  isOwner: boolean;
  createdAt: string;
  user?: {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
  };
}

/** Company entity from API */
export interface Company {
  id: string;
  partnerId: string;
  name: string;
  registrationNo: string;
  type: CompanyType;
  verticalTypes: string[];
  email: string;
  phone: string;
  address: string | null;
  businessLicense: string | null;
  ssmDocument: string | null;
  status: CompanyStatus;
  verifiedAt: string | null;
  verifiedBy: string | null;
  createdAt: string;
  updatedAt: string;
  admins: CompanyAdmin[];
}

/** Paginated company list result */
export interface CompanyListResult {
  data: Company[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ---------------------------------------------------------------------------
// Filter & Query
// ---------------------------------------------------------------------------

export interface CompanyFilters {
  type?: CompanyType;
  status?: CompanyStatus;
  verticalType?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}

export const COMPANY_FILTER_TABS = [
  { value: "all", label: "All", statuses: undefined },
  {
    value: "pending",
    label: "Pending",
    statuses: [CompanyStatus.PENDING],
  },
  {
    value: "active",
    label: "Active",
    statuses: [CompanyStatus.ACTIVE],
  },
  {
    value: "suspended",
    label: "Suspended",
    statuses: [CompanyStatus.SUSPENDED],
  },
] as const;

// ---------------------------------------------------------------------------
// DTOs
// ---------------------------------------------------------------------------

/** POST /api/v1/companies/register */
export interface RegisterCompanyDto {
  name: string;
  registrationNo: string;
  type: CompanyType;
  email: string;
  phone: string;
  address?: string;
}

/** PATCH /api/v1/companies/:id */
export interface UpdateCompanyDto {
  name?: string;
  type?: CompanyType;
  email?: string;
  phone?: string;
  address?: string;
  businessLicense?: string;
  ssmDocument?: string;
}

/** POST /api/v1/companies/:id/admins */
export interface AddCompanyAdminDto {
  userId: string;
  role?: CompanyAdminRole;
  isOwner?: boolean;
}

// ---------------------------------------------------------------------------
// Registration Wizard Types
// ---------------------------------------------------------------------------

export type RegistrationStepId = 1 | 2 | 3 | 4 | 5 | 6;

export interface RegistrationStep {
  readonly id: RegistrationStepId;
  readonly label: string;
  readonly description: string;
}

export const REGISTRATION_STEPS: readonly RegistrationStep[] = [
  {
    id: 1,
    label: "Company Details",
    description: "Basic company information",
  },
  {
    id: 2,
    label: "Admin Details",
    description: "Primary admin user",
  },
  {
    id: 3,
    label: "Documents",
    description: "Upload business documents",
  },
  {
    id: 4,
    label: "Package",
    description: "Select subscription plan",
  },
  {
    id: 5,
    label: "Payment",
    description: "Payment details",
  },
  {
    id: 6,
    label: "Confirmation",
    description: "Review and confirm",
  },
] as const;

// Wizard form data (accumulated across steps)
export interface CompanyRegistrationData {
  // Step 1: Company details
  companyName: string;
  registrationNo: string;
  companyType: CompanyType | "";
  companyEmail: string;
  companyPhone: string;
  companyAddress: string;

  // Step 2: Admin details
  adminFullName: string;
  adminEmail: string;
  adminPhone: string;
  adminPassword: string;
  adminConfirmPassword: string;

  // Step 3: Documents
  ssmDocumentUrl: string;
  businessLicenseUrl: string;

  // Step 4: Package
  selectedPlanId: string;
  billingCycle: "monthly" | "yearly";

  // Step 5: Payment (handled externally)
  paymentIntentId: string;
}

export const DEFAULT_REGISTRATION_DATA: CompanyRegistrationData = {
  companyName: "",
  registrationNo: "",
  companyType: "",
  companyEmail: "",
  companyPhone: "",
  companyAddress: "",

  adminFullName: "",
  adminEmail: "",
  adminPhone: "",
  adminPassword: "",
  adminConfirmPassword: "",

  ssmDocumentUrl: "",
  businessLicenseUrl: "",

  selectedPlanId: "",
  billingCycle: "monthly",

  paymentIntentId: "",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Check if company can be verified */
export function canVerifyCompany(company: Company): boolean {
  return company.status === CompanyStatus.PENDING;
}

/** Check if company can be suspended */
export function canSuspendCompany(company: Company): boolean {
  return company.status === CompanyStatus.ACTIVE;
}

/** Check if status is terminal */
export function isCompanyActive(company: Company): boolean {
  return company.status === CompanyStatus.ACTIVE;
}

/** Format company type label */
export function getCompanyTypeLabel(type: CompanyType): string {
  return COMPANY_TYPE_CONFIG[type]?.label ?? type;
}

/** Format company status label */
export function getCompanyStatusLabel(status: CompanyStatus): string {
  return COMPANY_STATUS_CONFIG[status]?.label ?? status;
}

// ---------------------------------------------------------------------------
// Company Profile Types
// ---------------------------------------------------------------------------

export interface CompanyProfile {
  id?: string;
  companyId?: string;
  bio: string | null;
  website: string | null;
  established: number | null;
  teamSize: number | null;
  specialties: string[];
  serviceAreas: string[];
  facebookUrl: string | null;
  instagramUrl: string | null;
  linkedinUrl: string | null;
  youtubeUrl: string | null;
  tiktokUrl: string | null;
}

export interface UpdateCompanyProfileDto {
  bio?: string;
  website?: string;
  established?: number;
  teamSize?: number;
  specialties?: string[];
  serviceAreas?: string[];
  facebookUrl?: string;
  instagramUrl?: string;
  linkedinUrl?: string;
  youtubeUrl?: string;
  tiktokUrl?: string;
}

// ---------------------------------------------------------------------------
// Company Branding Types
// ---------------------------------------------------------------------------

export interface CompanyBranding {
  id?: string;
  companyId?: string;
  logo: string | null;
  logoIcon: string | null;
  logoDark: string | null;
  favicon: string | null;
  primaryColor: string | null;
}

export interface UpdateCompanyBrandingDto {
  logo?: string;
  logoIcon?: string;
  logoDark?: string;
  favicon?: string;
  primaryColor?: string;
}

// ---------------------------------------------------------------------------
// Company Settings Types
// ---------------------------------------------------------------------------

export interface CompanySettings {
  id?: string;
  companyId?: string;
  defaultCommissionRate: number | null;
  commissionSplit: number | null;
  notificationEmail: string | null;
  enableEmailAlerts: boolean;
  enableSmsAlerts: boolean;
  bankName: string | null;
  bankAccount: string | null;
  bankAccountName: string | null;
  bankSwiftCode: string | null;
}

export interface UpdateCompanySettingsDto {
  defaultCommissionRate?: number;
  commissionSplit?: number;
  notificationEmail?: string;
  enableEmailAlerts?: boolean;
  enableSmsAlerts?: boolean;
  bankName?: string;
  bankAccount?: string;
  bankAccountName?: string;
  bankSwiftCode?: string;
}

// ---------------------------------------------------------------------------
// Company Document Types
// ---------------------------------------------------------------------------

export const CompanyDocumentType = {
  SSM_CERTIFICATE: "SSM_CERTIFICATE",
  BOVAEA_LICENSE: "BOVAEA_LICENSE",
  INSURANCE_CERTIFICATE: "INSURANCE_CERTIFICATE",
  TAX_CERTIFICATE: "TAX_CERTIFICATE",
  BANK_STATEMENT: "BANK_STATEMENT",
  OTHER: "OTHER",
} as const;
export type CompanyDocumentType = (typeof CompanyDocumentType)[keyof typeof CompanyDocumentType];

export const COMPANY_DOCUMENT_TYPE_CONFIG: Record<CompanyDocumentType, { label: string; description: string }> = {
  [CompanyDocumentType.SSM_CERTIFICATE]: {
    label: "SSM Certificate",
    description: "Business registration certificate from Suruhanjaya Syarikat Malaysia",
  },
  [CompanyDocumentType.BOVAEA_LICENSE]: {
    label: "BOVAEA License",
    description: "Board of Valuers, Appraisers, Estate Agents license",
  },
  [CompanyDocumentType.INSURANCE_CERTIFICATE]: {
    label: "Insurance Certificate",
    description: "Professional indemnity insurance",
  },
  [CompanyDocumentType.TAX_CERTIFICATE]: {
    label: "Tax Certificate",
    description: "Tax compliance certificate",
  },
  [CompanyDocumentType.BANK_STATEMENT]: {
    label: "Bank Statement",
    description: "Recent bank statement for financial proof",
  },
  [CompanyDocumentType.OTHER]: {
    label: "Other Document",
    description: "Other supporting documents",
  },
};

export interface CompanyDocument {
  id: string;
  companyId: string;
  type: CompanyDocumentType;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  verified: boolean;
  verifiedAt: string | null;
  verifiedBy: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCompanyDocumentDto {
  type: CompanyDocumentType;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  expiresAt?: string;
}

// ---------------------------------------------------------------------------
// Company Custom Role Types
// ---------------------------------------------------------------------------

export interface CompanyCustomRole {
  id: string;
  companyId: string;
  name: string;
  description: string | null;
  permissions: string[];
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCompanyCustomRoleDto {
  name: string;
  description?: string;
  permissions: string[];
}

export interface UpdateCompanyCustomRoleDto {
  name?: string;
  description?: string;
  permissions?: string[];
}

/** Available permissions for company custom roles */
export const COMPANY_PERMISSIONS = {
  // Agent management
  "agents.view": "View agents",
  "agents.create": "Create agents",
  "agents.update": "Update agents",
  "agents.delete": "Delete agents",
  "agents.assign": "Assign listings to agents",
  
  // Listing management
  "listings.view": "View assigned listings",
  "listings.create": "Create listings",
  "listings.update": "Update listings",
  "listings.delete": "Delete listings",
  
  // Commission management
  "commissions.view": "View commissions",
  "commissions.approve": "Approve commissions",
  
  // Team management
  "team.view": "View team members",
  "team.manage": "Manage team members",
  
  // Reports
  "reports.view": "View reports",
  "reports.export": "Export reports",
  
  // Settings
  "settings.view": "View company settings",
  "settings.update": "Update company settings",
  
  // Documents
  "documents.view": "View documents",
  "documents.upload": "Upload documents",
  "documents.delete": "Delete documents",
} as const;

export type CompanyPermission = keyof typeof COMPANY_PERMISSIONS;

