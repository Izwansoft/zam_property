// =============================================================================
// Vendor Settings Hooks
// =============================================================================
// useVendorSettings           — GET   /vendors/:id/settings
// useUpdateVendorSettings     — PATCH /vendors/:id/settings
// useUploadVendorLogo         — POST  /vendors/:id/logo (multipart)
// =============================================================================

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiQuery } from "@/hooks/use-api-query";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { queryKeys } from "@/lib/query";
import { usePartnerId } from "@/modules/partner";
import { api } from "@/lib/api/client";
import { normalizeError } from "@/lib/errors";
import type { VendorSettings, UpdateVendorSettingsDto, VendorLogoResponse } from "../types/vendor-settings";

// ---------------------------------------------------------------------------
// Query key helpers
// ---------------------------------------------------------------------------

function vendorSettingsKey(partnerId: string, vendorId: string) {
  return [...queryKeys.vendors.detail(partnerId, vendorId), "settings"] as const;
}

// ---------------------------------------------------------------------------
// useVendorSettings
// ---------------------------------------------------------------------------

/**
 * Fetch vendor settings for the given vendor.
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useVendorSettings(vendorId);
 * ```
 */
export function useVendorSettings(vendorId: string | undefined) {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiQuery<VendorSettings>({
    path: `/vendors/${vendorId}/settings`,
    queryKey: vendorSettingsKey(partnerKey, vendorId ?? ""),
    staleTime: 60_000,
    enabled: !!vendorId,
  });
}

// ---------------------------------------------------------------------------
// useUpdateVendorSettings
// ---------------------------------------------------------------------------

/**
 * Update vendor settings (business info, visibility).
 *
 * @example
 * ```tsx
 * const update = useUpdateVendorSettings(vendorId);
 * update.mutate({ businessName: "Updated Name" });
 * ```
 */
export function useUpdateVendorSettings(vendorId: string | undefined) {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiMutation<VendorSettings, UpdateVendorSettingsDto>({
    path: `/vendors/${vendorId}/settings`,
    method: "PATCH",
    invalidateKeys: [
      vendorSettingsKey(partnerKey, vendorId ?? ""),
      queryKeys.vendors.detail(partnerKey, vendorId ?? ""),
    ],
  });
}

// ---------------------------------------------------------------------------
// useUploadVendorLogo
// ---------------------------------------------------------------------------

/**
 * Upload a vendor logo (multipart/form-data).
 *
 * @example
 * ```tsx
 * const upload = useUploadVendorLogo(vendorId);
 * upload.mutate(file);
 * ```
 */
export function useUploadVendorLogo(vendorId: string | undefined) {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";
  const queryClient = useQueryClient();

  return useMutation<VendorLogoResponse, ReturnType<typeof normalizeError>, File>({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("logo", file);

      const response = await api.post<{ data: VendorLogoResponse }>(
        `/vendors/${vendorId}/logo`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: vendorSettingsKey(partnerKey, vendorId ?? ""),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.vendors.detail(partnerKey, vendorId ?? ""),
      });
    },
  });
}
