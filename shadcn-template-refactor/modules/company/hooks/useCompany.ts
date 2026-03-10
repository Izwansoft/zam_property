// =============================================================================
// useCompany — TanStack Query hooks for Company module
// =============================================================================
// Provides list, detail, register, update, verify, suspend, and admin hooks.
// API: /api/v1/companies
// =============================================================================

"use client";

import { useApiPaginatedQuery, useApiQuery } from "@/hooks/use-api-query";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { queryKeys } from "@/lib/query";
import { usePartnerId } from "@/modules/partner";
import type {
  Company,
  CompanyAdmin,
  CompanyFilters,
  RegisterCompanyDto,
  UpdateCompanyDto,
  AddCompanyAdminDto,
} from "../types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function cleanFilters(filters: CompanyFilters): Record<string, unknown> {
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

// ---------------------------------------------------------------------------
// List companies
// ---------------------------------------------------------------------------

/**
 * Fetch paginated company list with filters.
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useCompanies({ type: CompanyType.AGENCY, page: 1 });
 * ```
 */
export function useCompanies(filters: CompanyFilters = {}) {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";
  const cleanedParams = cleanFilters(filters);

  return useApiPaginatedQuery<Company>({
    queryKey: queryKeys.companies.list(partnerKey, cleanedParams),
    path: "/companies",
    params: cleanedParams,
    format: "A",
    enabled: !!partnerId,
  });
}

// ---------------------------------------------------------------------------
// Single company detail
// ---------------------------------------------------------------------------

/**
 * Fetch a single company by ID (includes admins).
 */
export function useCompany(companyId: string | undefined) {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiQuery<Company>({
    queryKey: queryKeys.companies.detail(partnerKey, companyId ?? ""),
    path: `/companies/${companyId}`,
    enabled: !!partnerId && !!companyId,
  });
}

// ---------------------------------------------------------------------------
// Register company
// ---------------------------------------------------------------------------

/**
 * Register a new company.
 * POST /api/v1/companies/register
 */
export function useRegisterCompany() {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiMutation<Company, RegisterCompanyDto>({
    path: "/companies/register",
    method: "POST",
    invalidateKeys: [queryKeys.companies.all(partnerKey)],
  });
}

// ---------------------------------------------------------------------------
// Update company
// ---------------------------------------------------------------------------

/**
 * Update a company.
 * PATCH /api/v1/companies/:id
 */
export function useUpdateCompany(companyId: string) {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiMutation<Company, UpdateCompanyDto>({
    path: `/companies/${companyId}`,
    method: "PATCH",
    invalidateKeys: [
      queryKeys.companies.all(partnerKey),
      queryKeys.companies.detail(partnerKey, companyId),
    ],
  });
}

// ---------------------------------------------------------------------------
// Verify company (PENDING → ACTIVE)
// ---------------------------------------------------------------------------

/**
 * Verify a pending company.
 * POST /api/v1/companies/:id/verify
 */
export function useVerifyCompany(companyId: string) {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiMutation<Company, void>({
    path: `/companies/${companyId}/verify`,
    method: "POST",
    invalidateKeys: [
      queryKeys.companies.all(partnerKey),
      queryKeys.companies.detail(partnerKey, companyId),
    ],
  });
}

// ---------------------------------------------------------------------------
// Suspend company
// ---------------------------------------------------------------------------

/**
 * Suspend an active company.
 * POST /api/v1/companies/:id/suspend
 */
export function useSuspendCompany(companyId: string) {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiMutation<Company, void>({
    path: `/companies/${companyId}/suspend`,
    method: "POST",
    invalidateKeys: [
      queryKeys.companies.all(partnerKey),
      queryKeys.companies.detail(partnerKey, companyId),
    ],
  });
}

// ---------------------------------------------------------------------------
// Company Admins
// ---------------------------------------------------------------------------

/**
 * List admins for a company.
 * GET /api/v1/companies/:id/admins
 */
export function useCompanyAdmins(companyId: string | undefined) {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiQuery<CompanyAdmin[]>({
    queryKey: queryKeys.companies.admins(partnerKey, companyId ?? ""),
    path: `/companies/${companyId}/admins`,
    enabled: !!partnerId && !!companyId,
  });
}

/**
 * Add an admin to a company.
 * POST /api/v1/companies/:id/admins
 */
export function useAddCompanyAdmin(companyId: string) {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiMutation<CompanyAdmin, AddCompanyAdminDto>({
    path: `/companies/${companyId}/admins`,
    method: "POST",
    invalidateKeys: [
      queryKeys.companies.admins(partnerKey, companyId),
      queryKeys.companies.detail(partnerKey, companyId),
    ],
  });
}

/**
 * Remove an admin from a company.
 * DELETE /api/v1/companies/:id/admins/:userId
 */
export function useRemoveCompanyAdmin(companyId: string) {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiMutation<void, { userId: string }>({
    path: (data) => `/companies/${companyId}/admins/${data.userId}`,
    method: "DELETE",
    invalidateKeys: [
      queryKeys.companies.admins(partnerKey, companyId),
      queryKeys.companies.detail(partnerKey, companyId),
    ],
  });
}
