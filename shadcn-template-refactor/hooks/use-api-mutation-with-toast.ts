// =============================================================================
// useApiMutationWithToast — Mutation hook with automatic toast notifications
// =============================================================================
// Wraps useApiMutation to automatically show success and error toasts.
// Eliminates boilerplate onSuccess/onError toast handling in every hook.
//
// Usage:
//   const create = useApiMutationWithToast<Listing, CreateDto>({
//     path: "/listings",
//     entity: "Listing",
//     action: "created",
//     invalidateKeys: [...],
//   });
// =============================================================================

"use client";

import {
  useApiMutation,
  type UseApiMutationOptions,
} from "@/hooks/use-api-mutation";
import type { AppError } from "@/lib/errors";
import {
  showMutationSuccess,
  showMutationError,
} from "@/lib/errors/toast-helpers";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MutationToastOptions {
  /** Entity name for toast messages (e.g., "Listing", "Vendor") */
  entity: string;
  /** Action label for success toast (e.g., "created", "approved", "deleted") */
  action: string;
  /** Custom success message (overrides default "{entity} {action} successfully") */
  successMessage?: string;
  /** Custom error message prefix (overrides default "Failed to {action} {entity}") */
  errorMessage?: string;
  /** Suppress success toast (default: false) */
  silentSuccess?: boolean;
  /** Suppress error toast (default: false) */
  silentError?: boolean;
}

export type UseApiMutationWithToastOptions<TData, TVariables> =
  UseApiMutationOptions<TData, TVariables> & MutationToastOptions;

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Mutation hook with built-in toast notifications.
 *
 * Automatically shows:
 * - ✅ Success toast: "{entity} {action} successfully"
 * - ❌ Error toast: "Failed to {action} {entity}: {message}"
 *
 * @example
 * ```ts
 * const approve = useApiMutationWithToast<Vendor, string>({
 *   path: (id) => `/vendors/${id}/actions/approve`,
 *   method: "POST",
 *   entity: "Vendor",
 *   action: "approved",
 *   invalidateKeys: [queryKeys.vendors.all(partnerKey)],
 * });
 * ```
 */
export function useApiMutationWithToast<
  TData = unknown,
  TVariables = unknown,
>({
  entity,
  action,
  successMessage,
  errorMessage,
  silentSuccess = false,
  silentError = false,
  onSuccess,
  onError,
  ...mutationOptions
}: UseApiMutationWithToastOptions<TData, TVariables>) {
  return useApiMutation<TData, TVariables>({
    ...mutationOptions,
    onSuccess: (...args) => {
      if (!silentSuccess) {
        if (successMessage) {
          showMutationSuccess(successMessage, "");
        } else {
          showMutationSuccess(entity, action);
        }
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (onSuccess as (...a: unknown[]) => void)?.(...args);
    },
    onError: (error: AppError, ...rest) => {
      if (!silentError) {
        showMutationError(error, errorMessage ? undefined : entity, action);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (onError as (...a: unknown[]) => void)?.(error, ...rest);
    },
  });
}

// ---------------------------------------------------------------------------
// Convenience: Delete with toast
// ---------------------------------------------------------------------------

export interface UseApiDeleteWithToastOptions<TData> {
  /** Base path — the ID is appended */
  basePath: string;
  /** Query keys to invalidate on success */
  invalidateKeys?: import("@tanstack/react-query").QueryKey[];
  /** Entity name for toast */
  entity: string;
  /** Custom action label (default: "deleted") */
  action?: string;
}

/**
 * Delete mutation with built-in toast.
 *
 * @example
 * ```ts
 * const remove = useApiDeleteWithToast({
 *   basePath: "/listings",
 *   entity: "Listing",
 *   invalidateKeys: [queryKeys.listings.all(partnerKey)],
 * });
 * remove.mutate(listingId);
 * ```
 */
export function useApiDeleteWithToast<TData = unknown>({
  basePath,
  invalidateKeys,
  entity,
  action = "deleted",
}: UseApiDeleteWithToastOptions<TData>) {
  return useApiMutationWithToast<TData, string>({
    path: (id) => `${basePath}/${id}`,
    method: "DELETE",
    invalidateKeys,
    unwrap: false,
    entity,
    action,
  });
}
