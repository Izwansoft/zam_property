// =============================================================================
// Partner Mutations — Create, Suspend, Reactivate, Deactivate, Update Settings
// =============================================================================
// Wraps useApiMutation for partner lifecycle operations.
// Uses platform-scoped query key invalidation (no partnerId).
// =============================================================================

"use client";

import { useApiMutation } from "@/hooks/use-api-mutation";
import { queryKeys } from "@/lib/query";
import type { PartnerDetail, PartnerSettingsDto } from "../types";
import type { CreatePartnerDto } from "@/modules/vertical/types";

// ---------------------------------------------------------------------------
// useCreatePartner
// ---------------------------------------------------------------------------

/**
 * Create a new partner with admin user and optional vertical bindings.
 *
 * @example
 * ```tsx
 * const create = useCreatePartner();
 * create.mutate({
 *   name: "Acme Realty",
 *   slug: "acme-realty",
 *   adminEmail: "admin@acme.com",
 *   adminName: "Admin User",
 *   adminPassword: "StrongPass123!",
 *   verticalTypes: ["real_estate"],
 * });
 * ```
 */
export function useCreatePartner() {
  return useApiMutation<PartnerDetail, CreatePartnerDto>({
    path: "/admin/partners",
    method: "POST",
    invalidateKeys: [queryKeys.partners.all],
  });
}

// ---------------------------------------------------------------------------
// DTOs
// ---------------------------------------------------------------------------

export interface SuspendPartnerDto {
  id: string;
  reason: string;
}

export interface DeactivatePartnerDto {
  id: string;
  reason: string;
}

// ---------------------------------------------------------------------------
// useSuspendPartner
// ---------------------------------------------------------------------------

/**
 * Suspend an active partner.
 *
 * @example
 * ```tsx
 * const suspend = useSuspendPartner();
 * suspend.mutate({ id: "partner-001", reason: "Policy violation" });
 * ```
 */
export function useSuspendPartner() {
  return useApiMutation<PartnerDetail, SuspendPartnerDto>({
    path: (variables) => `/admin/partners/${variables.id}/suspend`,
    method: "PATCH",
    invalidateKeys: [queryKeys.partners.all],
  });
}

// ---------------------------------------------------------------------------
// useReactivatePartner
// ---------------------------------------------------------------------------

/**
 * Reactivate a suspended partner.
 *
 * @example
 * ```tsx
 * const reactivate = useReactivatePartner();
 * reactivate.mutate("partner-001");
 * ```
 */
export function useReactivatePartner() {
  return useApiMutation<PartnerDetail, string>({
    path: (partnerId) => `/admin/partners/${partnerId}/reactivate`,
    method: "PATCH",
    invalidateKeys: [queryKeys.partners.all],
  });
}

// ---------------------------------------------------------------------------
// useDeactivatePartner
// ---------------------------------------------------------------------------

/**
 * Deactivate a partner (permanent).
 *
 * @example
 * ```tsx
 * const deactivate = useDeactivatePartner();
 * deactivate.mutate({ id: "partner-001", reason: "Requested by owner" });
 * ```
 */
export function useDeactivatePartner() {
  return useApiMutation<PartnerDetail, DeactivatePartnerDto>({
    path: (variables) => `/admin/partners/${variables.id}/deactivate`,
    method: "PATCH",
    invalidateKeys: [queryKeys.partners.all],
  });
}

// ---------------------------------------------------------------------------
// useUpdatePartnerSettings
// ---------------------------------------------------------------------------

/**
 * Update partner settings (branding, verticals, etc.).
 *
 * @example
 * ```tsx
 * const update = useUpdatePartnerSettings("partner-001");
 * update.mutate({ name: "Updated Name", enabledVerticals: ["PROPERTY_SALE"] });
 * ```
 */
export function useUpdatePartnerSettings(partnerId: string) {
  return useApiMutation<PartnerDetail, PartnerSettingsDto>({
    path: `/admin/partners/${partnerId}/settings`,
    method: "PATCH",
    invalidateKeys: [
      queryKeys.partners.all,
      queryKeys.partners.detail(partnerId),
    ],
  });
}
