// =============================================================================
// Admin PM Types — Property Management stats & cross-partner filter types
// =============================================================================
// Matches backend PropertyManagementStatsDto from
// GET /api/v1/admin/dashboard/pm-stats
// =============================================================================

// ---------------------------------------------------------------------------
// Status Count (shared shape used across all stat sections)
// ---------------------------------------------------------------------------

export interface StatusCountDto {
  status: string;
  count: number;
}

// ---------------------------------------------------------------------------
// Individual Stat Section DTOs
// ---------------------------------------------------------------------------

export interface TenancyStatsDto {
  byStatus: StatusCountDto[];
  activeCount: number;
  expiringSoonCount: number;
  totalCount: number;
}

export interface BillingStatsDto {
  byStatus: StatusCountDto[];
  overdueCount: number;
  /** RM amount string, e.g. "15600.00" */
  overdueAmount: string;
  /** RM amount string */
  collectedThisMonth: string;
  /** RM amount string */
  billedThisMonth: string;
}

export interface MaintenanceStatsDto {
  byStatus: StatusCountDto[];
  byPriority: StatusCountDto[];
  openCount: number;
  unassignedCount: number;
}

export interface PayoutStatsDto {
  byStatus: StatusCountDto[];
  /** RM amount string */
  pendingApprovalAmount: string;
  /** RM amount string */
  processedThisMonth: string;
}

export interface DepositStatsDto {
  byStatus: StatusCountDto[];
  /** RM amount string */
  totalHeldAmount: string;
  pendingRefundCount: number;
}

export interface InspectionStatsDto {
  byStatus: StatusCountDto[];
  upcomingCount: number;
  completedThisMonth: number;
}

export interface ClaimStatsDto {
  byStatus: StatusCountDto[];
  pendingReviewCount: number;
  disputedCount: number;
}

export interface LegalStatsDto {
  byStatus: StatusCountDto[];
  openCount: number;
}

export interface TenantStatsDto {
  totalCount: number;
  activeCount: number;
}

export interface CompanyAgentStatsDto {
  totalCompanies: number;
  activeCompanies: number;
  totalAgents: number;
  activeAgents: number;
}

// ---------------------------------------------------------------------------
// Root PM Stats Response (matches PropertyManagementStatsDto)
// ---------------------------------------------------------------------------

export interface AdminPMStats {
  tenancy: TenancyStatsDto;
  billing: BillingStatsDto;
  maintenance: MaintenanceStatsDto;
  payout: PayoutStatsDto;
  deposit: DepositStatsDto;
  inspection: InspectionStatsDto;
  claim: ClaimStatsDto;
  legal: LegalStatsDto;
  tenant: TenantStatsDto;
  companyAgent: CompanyAgentStatsDto;
  /** ISO timestamp of when stats were generated */
  generatedAt: string;
}

// ---------------------------------------------------------------------------
// Cross-partner Admin Filter types (platform-wide views)
// ---------------------------------------------------------------------------

export interface AdminTenancyFilters {
  page?: number;
  pageSize?: number;
  status?: string;
  partnerId?: string;
  search?: string;
  type?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export const DEFAULT_ADMIN_TENANCY_FILTERS: AdminTenancyFilters = {
  page: 1,
  pageSize: 20,
  status: "",
  search: "",
  partnerId: "",
  sortBy: "updatedAt",
  sortOrder: "desc",
};

export interface AdminBillingFilters {
  page?: number;
  pageSize?: number;
  status?: string;
  partnerId?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export const DEFAULT_ADMIN_BILLING_FILTERS: AdminBillingFilters = {
  page: 1,
  pageSize: 20,
  status: "",
  search: "",
  partnerId: "",
  sortBy: "updatedAt",
  sortOrder: "desc",
};

export interface AdminPayoutFilters {
  page?: number;
  pageSize?: number;
  status?: string;
  partnerId?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export const DEFAULT_ADMIN_PAYOUT_FILTERS: AdminPayoutFilters = {
  page: 1,
  pageSize: 20,
  status: "",
  search: "",
  partnerId: "",
  sortBy: "updatedAt",
  sortOrder: "desc",
};

// ---------------------------------------------------------------------------
// Helper: clean admin PM filters for API params
// ---------------------------------------------------------------------------

export function cleanAdminPMFilters(
  filters: Record<string, unknown>
): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== "" && value !== null) {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

// ---------------------------------------------------------------------------
// Bulk Action Types
// ---------------------------------------------------------------------------

export interface AdminTransactionFilters {
  page?: number;
  pageSize?: number;
  status?: string;
  method?: string;
  search?: string;
  billingId?: string;
  partnerId?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export const DEFAULT_ADMIN_TRANSACTION_FILTERS: AdminTransactionFilters = {
  page: 1,
  pageSize: 20,
  status: "",
  method: "",
  search: "",
  sortBy: "createdAt",
  sortOrder: "desc",
};

export interface BulkApprovePayoutVariables {
  payoutIds: string[];
}

export interface BulkProcessBillsVariables {
  billingIds: string[];
  action: "send" | "write-off";
}
