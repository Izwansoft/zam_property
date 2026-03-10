// =============================================================================
// useCompanySettings — TanStack Query hooks for Company settings
// =============================================================================
// Provides hooks for profile, branding, settings, documents, and roles.
// API: /api/v1/companies/:id/profile, /branding, /settings, /documents, /roles
// =============================================================================

"use client";

import { useApiQuery } from "@/hooks/use-api-query";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { usePartnerId } from "@/modules/partner";
import type {
  CompanyProfile,
  CompanyBranding,
  CompanySettings,
  CompanyDocument,
  CompanyCustomRole,
  UpdateCompanyProfileDto,
  UpdateCompanyBrandingDto,
  UpdateCompanySettingsDto,
  CreateCompanyDocumentDto,
  CreateCompanyCustomRoleDto,
  UpdateCompanyCustomRoleDto,
} from "../types";

// ---------------------------------------------------------------------------
// Company Profile
// ---------------------------------------------------------------------------

/**
 * Fetch company profile.
 */
export function useCompanyProfile(companyId: string | undefined) {
  const partnerId = usePartnerId();

  return useApiQuery<CompanyProfile>({
    queryKey: ["company", companyId, "profile"],
    path: `/companies/${companyId}/profile`,
    enabled: !!partnerId && !!companyId,
  });
}

/**
 * Update company profile.
 */
export function useUpdateCompanyProfile(companyId: string) {
  return useApiMutation<CompanyProfile, UpdateCompanyProfileDto>({
    path: `/companies/${companyId}/profile`,
    method: "PATCH",
    invalidateKeys: [["company", companyId, "profile"]],
  });
}

// ---------------------------------------------------------------------------
// Company Branding
// ---------------------------------------------------------------------------

/**
 * Fetch company branding.
 */
export function useCompanyBranding(companyId: string | undefined) {
  const partnerId = usePartnerId();

  return useApiQuery<CompanyBranding>({
    queryKey: ["company", companyId, "branding"],
    path: `/companies/${companyId}/branding`,
    enabled: !!partnerId && !!companyId,
  });
}

/**
 * Update company branding.
 */
export function useUpdateCompanyBranding(companyId: string) {
  return useApiMutation<CompanyBranding, UpdateCompanyBrandingDto>({
    path: `/companies/${companyId}/branding`,
    method: "PATCH",
    invalidateKeys: [["company", companyId, "branding"]],
  });
}

// ---------------------------------------------------------------------------
// Company Settings
// ---------------------------------------------------------------------------

/**
 * Fetch company settings.
 */
export function useCompanySettings(companyId: string | undefined) {
  const partnerId = usePartnerId();

  return useApiQuery<CompanySettings>({
    queryKey: ["company", companyId, "settings"],
    path: `/companies/${companyId}/settings`,
    enabled: !!partnerId && !!companyId,
  });
}

/**
 * Update company settings.
 */
export function useUpdateCompanySettings(companyId: string) {
  return useApiMutation<CompanySettings, UpdateCompanySettingsDto>({
    path: `/companies/${companyId}/settings`,
    method: "PATCH",
    invalidateKeys: [["company", companyId, "settings"]],
  });
}

// ---------------------------------------------------------------------------
// Company Documents
// ---------------------------------------------------------------------------

/**
 * Fetch company documents.
 */
export function useCompanyDocuments(companyId: string | undefined) {
  const partnerId = usePartnerId();

  return useApiQuery<CompanyDocument[]>({
    queryKey: ["company", companyId, "documents"],
    path: `/companies/${companyId}/documents`,
    enabled: !!partnerId && !!companyId,
  });
}

/**
 * Add company document.
 */
export function useAddCompanyDocument(companyId: string) {
  return useApiMutation<CompanyDocument, CreateCompanyDocumentDto>({
    path: `/companies/${companyId}/documents`,
    method: "POST",
    invalidateKeys: [["company", companyId, "documents"]],
  });
}

/**
 * Delete company document.
 */
export function useDeleteCompanyDocument(companyId: string) {
  return useApiMutation<void, { documentId: string }>({
    path: (vars) => `/companies/${companyId}/documents/${vars.documentId}`,
    method: "DELETE",
    invalidateKeys: [["company", companyId, "documents"]],
    excludeFromBody: ["documentId"],
  });
}

/**
 * Verify company document (platform admin only).
 */
export function useVerifyCompanyDocument(companyId: string) {
  return useApiMutation<CompanyDocument, { documentId: string; verified: boolean }>({
    path: (vars) => `/companies/${companyId}/documents/${vars.documentId}/verify`,
    method: "POST",
    invalidateKeys: [["company", companyId, "documents"]],
    excludeFromBody: ["documentId"],
  });
}

// ---------------------------------------------------------------------------
// Company Custom Roles
// ---------------------------------------------------------------------------

/**
 * Fetch company custom roles.
 */
export function useCompanyCustomRoles(companyId: string | undefined) {
  const partnerId = usePartnerId();

  return useApiQuery<CompanyCustomRole[]>({
    queryKey: ["company", companyId, "roles"],
    path: `/companies/${companyId}/roles`,
    enabled: !!partnerId && !!companyId,
  });
}

/**
 * Create custom role.
 */
export function useCreateCompanyCustomRole(companyId: string) {
  return useApiMutation<CompanyCustomRole, CreateCompanyCustomRoleDto>({
    path: `/companies/${companyId}/roles`,
    method: "POST",
    invalidateKeys: [["company", companyId, "roles"]],
  });
}

/**
 * Update custom role.
 */
export function useUpdateCompanyCustomRole(companyId: string) {
  return useApiMutation<CompanyCustomRole, UpdateCompanyCustomRoleDto & { roleId: string }>({
    path: (vars) => `/companies/${companyId}/roles/${vars.roleId}`,
    method: "PATCH",
    invalidateKeys: [["company", companyId, "roles"]],
    excludeFromBody: ["roleId"],
  });
}

/**
 * Delete custom role.
 */
export function useDeleteCompanyCustomRole(companyId: string) {
  return useApiMutation<void, { roleId: string }>({
    path: (vars) => `/companies/${companyId}/roles/${vars.roleId}`,
    method: "DELETE",
    invalidateKeys: [["company", companyId, "roles"]],
    excludeFromBody: ["roleId"],
  });
}
