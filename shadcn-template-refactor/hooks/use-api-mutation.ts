// =============================================================================
// useApiMutation — Base mutation hook with cache invalidation
// =============================================================================
// Wraps TanStack Query's useMutation with error normalization,
// automatic cache invalidation, and toast feedback.
// =============================================================================

"use client";

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
  type UseMutationResult,
  type QueryKey,
} from "@tanstack/react-query";
import { type AxiosRequestConfig } from "axios";
import { api } from "@/lib/api/client";
import { normalizeError, type AppError } from "@/lib/errors";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type HttpMethod = "POST" | "PUT" | "PATCH" | "DELETE";

export interface UseApiMutationOptions<TData, TVariables>
  extends Omit<
    UseMutationOptions<TData, AppError, TVariables>,
    "mutationFn"
  > {
  /** API endpoint path (can be a function for dynamic paths) */
  path: string | ((variables: TVariables) => string);
  /** HTTP method (default: POST) */
  method?: HttpMethod;
  /** Query keys to invalidate on success */
  invalidateKeys?: QueryKey[];
  /** Axios config overrides */
  axiosConfig?: AxiosRequestConfig;
  /** Whether to unwrap ApiResponse<T> → T (default: true) */
  unwrap?: boolean;
  /** Fields to exclude from request body (useful when path uses variable fields) */
  excludeFromBody?: (keyof TVariables)[];
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Base mutation hook for create/update/delete API requests.
 *
 * Automatically:
 * - Uses the shared API client (with auth/partner/portal headers)
 * - Normalizes errors into AppError
 * - Invalidates specified query keys on success
 * - Unwraps ApiResponse<T> to T by default
 *
 * @example
 * ```ts
 * const createListing = useApiMutation<Listing, CreateListingDto>({
 *   path: '/listings',
 *   method: 'POST',
 *   invalidateKeys: [queryKeys.listings.all(partnerId)],
 *   onSuccess: (data) => router.push(`/dashboard/vendor/listings/${data.id}`),
 * });
 *
 * // Usage
 * createListing.mutate({ title: 'My Listing', ... });
 * ```
 */
export function useApiMutation<TData = unknown, TVariables = unknown>({
  path,
  method = "POST",
  invalidateKeys,
  axiosConfig,
  unwrap = true,
  excludeFromBody,
  onSuccess,
  ...mutationOptions
}: UseApiMutationOptions<TData, TVariables>): UseMutationResult<
  TData,
  AppError,
  TVariables
> {
  const queryClient = useQueryClient();

  return useMutation<TData, AppError, TVariables>({
    ...mutationOptions,
    mutationFn: async (variables: TVariables) => {
      try {
        const resolvedPath =
          typeof path === "function" ? path(variables) : path;

        // Exclude specified fields from the body (used for path params like `id`)
        let body: unknown = variables;
        if (excludeFromBody?.length && typeof variables === "object" && variables !== null) {
          const filtered = { ...variables };
          for (const key of excludeFromBody) {
            delete (filtered as Record<string, unknown>)[key as string];
          }
          body = filtered;
        }

        let response;

        switch (method) {
          case "POST":
            response = await api.post(resolvedPath, body, axiosConfig);
            break;
          case "PUT":
            response = await api.put(resolvedPath, body, axiosConfig);
            break;
          case "PATCH":
            response = await api.patch(resolvedPath, body, axiosConfig);
            break;
          case "DELETE":
            response = await api.delete(resolvedPath, {
              ...axiosConfig,
              data: body,
            });
            break;
        }

        // Unwrap ApiResponse wrapper: { data: T, meta: {...} } → T
        if (unwrap && response.data?.data !== undefined) {
          return response.data.data as TData;
        }
        return response.data as TData;
      } catch (error) {
        throw normalizeError(error);
      }
    },
    onSuccess: async (...args) => {
      // Invalidate cache for specified query keys
      if (invalidateKeys?.length) {
        await Promise.all(
          invalidateKeys.map((key) =>
            queryClient.invalidateQueries({ queryKey: key })
          )
        );
      }

      // Call user-provided onSuccess with all arguments
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (onSuccess as (...a: unknown[]) => void)?.(...args);
    },
  });
}

// ---------------------------------------------------------------------------
// Convenience: Delete mutation (no body)
// ---------------------------------------------------------------------------

export interface UseApiDeleteOptions<TData>
  extends Omit<
    UseMutationOptions<TData, AppError, string>,
    "mutationFn"
  > {
  /** Base path — the ID is appended: `/listings` + `/${id}` */
  basePath: string;
  /** Query keys to invalidate on success */
  invalidateKeys?: QueryKey[];
}

/**
 * Convenience hook for DELETE requests where the variable is just the entity ID.
 *
 * @example
 * ```ts
 * const deleteListing = useApiDelete({
 *   basePath: '/listings',
 *   invalidateKeys: [queryKeys.listings.all(partnerId)],
 * });
 *
 * deleteListing.mutate(listingId);
 * ```
 */
export function useApiDelete<TData = unknown>({
  basePath,
  invalidateKeys,
  ...options
}: UseApiDeleteOptions<TData>): UseMutationResult<TData, AppError, string> {
  return useApiMutation<TData, string>({
    path: (id) => `${basePath}/${id}`,
    method: "DELETE",
    invalidateKeys,
    unwrap: false,
    ...options,
  });
}
