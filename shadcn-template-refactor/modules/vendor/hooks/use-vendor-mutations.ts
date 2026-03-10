// =============================================================================
// Vendor Mutations — Approve, Reject, Suspend hooks (with optimistic updates)
// =============================================================================
// Wraps useApiMutation for vendor lifecycle operations.
// Uses partner-scoped query key invalidation + optimistic cache updates.
// =============================================================================

"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { queryKeys } from "@/lib/query";
import { usePartnerId } from "@/modules/partner";
import { showMutationSuccess, showMutationError } from "@/lib/errors/toast-helpers";
import type { VendorDetail } from "../types";

// ---------------------------------------------------------------------------
// DTOs
// ---------------------------------------------------------------------------

export interface RejectVendorDto {
  reason: string;
}

export interface SuspendVendorDto {
  reason: string;
}

// ---------------------------------------------------------------------------
// useApproveVendor — optimistic update sets status to APPROVED instantly
// ---------------------------------------------------------------------------

/**
 * Approve a pending vendor.
 * Optimistically updates the vendor's status in the list cache.
 *
 * @example
 * ```tsx
 * const approve = useApproveVendor();
 * approve.mutate("vendor-003");
 * ```
 */
export function useApproveVendor() {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";
  const queryClient = useQueryClient();

  return useApiMutation<VendorDetail, string>({
    path: (vendorId) => `/vendors/${vendorId}/actions/approve`,
    method: "POST",
    invalidateKeys: [queryKeys.vendors.all(partnerKey)],
    onMutate: async (vendorId) => {
      // Optimistically update vendor detail cache
      const detailKey = queryKeys.vendors.detail(partnerKey, vendorId);
      await queryClient.cancelQueries({ queryKey: detailKey });
      const previous = queryClient.getQueryData<VendorDetail>(detailKey);
      if (previous) {
        queryClient.setQueryData<VendorDetail>(detailKey, {
          ...previous,
          status: "APPROVED",
        });
      }
      return { previous, detailKey };
    },
    onError: (error, _vars, context) => {
      // Rollback on failure
      const ctx = context as { previous?: VendorDetail; detailKey?: unknown[] } | undefined;
      if (ctx?.previous && ctx.detailKey) {
        queryClient.setQueryData(ctx.detailKey, ctx.previous);
      }
      showMutationError(error, "Vendor", "approve");
    },
    onSuccess: () => {
      showMutationSuccess("Vendor", "approved");
    },
  });
}

// ---------------------------------------------------------------------------
// useRejectVendor — optimistic update sets status to REJECTED
// ---------------------------------------------------------------------------

/**
 * Reject a pending vendor with a reason.
 *
 * @example
 * ```tsx
 * const reject = useRejectVendor();
 * reject.mutate({ id: "vendor-003", reason: "Incomplete documents" });
 * ```
 */
export function useRejectVendor() {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";
  const queryClient = useQueryClient();

  return useApiMutation<VendorDetail, RejectVendorDto & { id: string }>({
    path: (variables) => `/vendors/${variables.id}/actions/reject`,
    method: "POST",
    invalidateKeys: [queryKeys.vendors.all(partnerKey)],
    onMutate: async (variables) => {
      const detailKey = queryKeys.vendors.detail(partnerKey, variables.id);
      await queryClient.cancelQueries({ queryKey: detailKey });
      const previous = queryClient.getQueryData<VendorDetail>(detailKey);
      if (previous) {
        queryClient.setQueryData<VendorDetail>(detailKey, {
          ...previous,
          status: "REJECTED",
        });
      }
      return { previous, detailKey };
    },
    onError: (error, _vars, context) => {
      const ctx = context as { previous?: VendorDetail; detailKey?: unknown[] } | undefined;
      if (ctx?.previous && ctx.detailKey) {
        queryClient.setQueryData(ctx.detailKey, ctx.previous);
      }
      showMutationError(error, "Vendor", "reject");
    },
    onSuccess: () => {
      showMutationSuccess("Vendor", "rejected");
    },
  });
}

// ---------------------------------------------------------------------------
// useSuspendVendor — optimistic update sets status to SUSPENDED
// ---------------------------------------------------------------------------

/**
 * Suspend an approved vendor with a reason.
 *
 * @example
 * ```tsx
 * const suspend = useSuspendVendor();
 * suspend.mutate({ id: "vendor-001", reason: "Policy violation" });
 * ```
 */
export function useSuspendVendor() {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";
  const queryClient = useQueryClient();

  return useApiMutation<VendorDetail, SuspendVendorDto & { id: string }>({
    path: (variables) => `/vendors/${variables.id}/actions/suspend`,
    method: "POST",
    invalidateKeys: [queryKeys.vendors.all(partnerKey)],
    onMutate: async (variables) => {
      const detailKey = queryKeys.vendors.detail(partnerKey, variables.id);
      await queryClient.cancelQueries({ queryKey: detailKey });
      const previous = queryClient.getQueryData<VendorDetail>(detailKey);
      if (previous) {
        queryClient.setQueryData<VendorDetail>(detailKey, {
          ...previous,
          status: "SUSPENDED",
        });
      }
      return { previous, detailKey };
    },
    onError: (error, _vars, context) => {
      const ctx = context as { previous?: VendorDetail; detailKey?: unknown[] } | undefined;
      if (ctx?.previous && ctx.detailKey) {
        queryClient.setQueryData(ctx.detailKey, ctx.previous);
      }
      showMutationError(error, "Vendor", "suspend");
    },
    onSuccess: () => {
      showMutationSuccess("Vendor", "suspended");
    },
  });
}

// ---------------------------------------------------------------------------
// useReactivateVendor — POST /vendors/:id/actions/reactivate
// ---------------------------------------------------------------------------

export function useReactivateVendor() {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";
  const queryClient = useQueryClient();

  return useApiMutation<VendorDetail, string>({
    path: (vendorId) => `/vendors/${vendorId}/actions/reactivate`,
    method: "POST",
    invalidateKeys: [queryKeys.vendors.all(partnerKey)],
    onMutate: async (vendorId) => {
      const detailKey = queryKeys.vendors.detail(partnerKey, vendorId);
      await queryClient.cancelQueries({ queryKey: detailKey });
      const previous = queryClient.getQueryData<VendorDetail>(detailKey);
      if (previous) {
        queryClient.setQueryData<VendorDetail>(detailKey, {
          ...previous,
          status: "APPROVED",
        });
      }
      return { previous, detailKey };
    },
    onError: (error, _vars, context) => {
      const ctx = context as { previous?: VendorDetail; detailKey?: unknown[] } | undefined;
      if (ctx?.previous && ctx.detailKey) {
        queryClient.setQueryData(ctx.detailKey, ctx.previous);
      }
      showMutationError(error, "Vendor", "reactivate");
    },
    onSuccess: () => {
      showMutationSuccess("Vendor", "reactivated");
    },
  });
}

// ---------------------------------------------------------------------------
// useUpdateVendor — PATCH /vendors/:id
// ---------------------------------------------------------------------------

export interface UpdateVendorDto {
  name?: string;
  email?: string;
  phone?: string;
  description?: string;
  verticalType?: string;
  vendorType?: "INDIVIDUAL" | "COMPANY";
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
}

export function useUpdateVendor() {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiMutation<VendorDetail, UpdateVendorDto & { id: string }>({
    path: (variables) => `/vendors/${variables.id}`,
    method: "PATCH",
    invalidateKeys: [queryKeys.vendors.all(partnerKey)],
    onSuccess: () => {
      showMutationSuccess("Vendor", "updated");
    },
    onError: (error) => {
      showMutationError(error, "Vendor", "update");
    },
  });
}

// ---------------------------------------------------------------------------
// useCreateVendor — POST /vendors
// ---------------------------------------------------------------------------

export interface CreateVendorDto {
  name: string;
  email?: string;
  phone?: string;
  description?: string;
  verticalType?: string;
  vendorType?: "INDIVIDUAL" | "COMPANY";
  website?: string;
}

export function useCreateVendor() {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiMutation<VendorDetail, CreateVendorDto>({
    path: "/vendors",
    method: "POST",
    invalidateKeys: [queryKeys.vendors.all(partnerKey)],
    onSuccess: () => {
      showMutationSuccess("Vendor", "created");
    },
    onError: (error) => {
      showMutationError(error, "Vendor", "create");
    },
  });
}
