// =============================================================================
// Admin User Types — Platform-level user management types
// =============================================================================

// ---------------------------------------------------------------------------
// User Detail (matches GET /users/:id response)
// ---------------------------------------------------------------------------

export interface AdminUserDetail {
  id: string;
  partnerId: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminCreateUserInput {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  role: string;
  status?: string;
}

// ---------------------------------------------------------------------------
// User Role Labels (display-friendly)
// ---------------------------------------------------------------------------

export const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  PARTNER_ADMIN: "Partner Admin",
  VENDOR_ADMIN: "Vendor Admin",
  VENDOR_STAFF: "Vendor Staff",
  CUSTOMER: "Customer",
  TENANT: "Tenant",
  COMPANY_ADMIN: "Company Admin",
  AGENT: "Agent",
  GUEST: "Guest",
};

// ---------------------------------------------------------------------------
// Admin User Filters
// ---------------------------------------------------------------------------

export interface AdminUserFilters {
  page?: number;
  pageSize?: number;
  role?: string;
  search?: string;
  status?: string;
  partnerId?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export const DEFAULT_ADMIN_USER_FILTERS: AdminUserFilters = {
  page: 1,
  pageSize: 20,
  role: "",
  search: "",
  status: "",
  sortBy: "createdAt",
  sortOrder: "desc",
};

// ---------------------------------------------------------------------------
// Helper: clean filters for API params
// ---------------------------------------------------------------------------

export function cleanUserFilters(
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
