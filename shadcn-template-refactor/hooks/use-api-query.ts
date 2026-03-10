// =============================================================================
// useApiQuery — Base query hook wrapper
// =============================================================================
// Wraps TanStack Query's useQuery with consistent error normalization
// and typing for the Zam-Property API.
// =============================================================================

"use client";

import {
  useQuery,
  type UseQueryOptions,
  type UseQueryResult,
  type QueryKey,
} from "@tanstack/react-query";
import { type AxiosRequestConfig } from "axios";
import { api, type ApiResponse } from "@/lib/api/client";
import { normalizeError, type AppError } from "@/lib/errors";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type QueryFnData<T> = T;

/**
 * Options for useApiQuery.
 * Extends TanStack Query options but provides sane defaults.
 */
export interface UseApiQueryOptions<T>
  extends Omit<
    UseQueryOptions<QueryFnData<T>, AppError, QueryFnData<T>, QueryKey>,
    "queryFn"
  > {
  /** API endpoint path (relative to base URL), e.g. "/listings" */
  path: string;
  /** Axios request config overrides (params, headers, etc.) */
  axiosConfig?: AxiosRequestConfig;
  /**
   * Custom select to extract data from ApiResponse wrapper.
   * Defaults to extracting response.data.data (unwraps ApiResponse).
   */
  unwrap?: boolean;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Base query hook for single-entity GET requests.
 *
 * Automatically:
 * - Uses the shared API client (with auth/partner/portal headers)
 * - Normalizes errors into AppError
 * - Unwraps ApiResponse<T> to T by default
 *
 * @example
 * ```ts
 * const { data, error, isLoading } = useApiQuery<Listing>({
 *   queryKey: queryKeys.listings.detail(partnerId, listingId),
 *   path: `/listings/${listingId}`,
 * });
 * ```
 */
export function useApiQuery<T>({
  path,
  axiosConfig,
  unwrap = true,
  ...queryOptions
}: UseApiQueryOptions<T>): UseQueryResult<QueryFnData<T>, AppError> {
  return useQuery<QueryFnData<T>, AppError, QueryFnData<T>, QueryKey>({
    ...queryOptions,
    queryFn: async () => {
      try {
        const response = await api.get<ApiResponse<T>>(path, axiosConfig);

        // Unwrap ApiResponse wrapper: { data: T, meta: {...} } → T
        if (unwrap) {
          const envelope = response.data as unknown as {
            data?: QueryFnData<T>;
          };

          // Some backend endpoints return raw payloads instead of { data, meta }.
          // Fallback to full response body so query functions never resolve undefined.
          return (envelope.data !== undefined
            ? envelope.data
            : (response.data as unknown as QueryFnData<T>));
        }
        return response.data as unknown as QueryFnData<T>;
      } catch (error) {
        throw normalizeError(error);
      }
    },
  });
}

// ---------------------------------------------------------------------------
// Paginated Query Hook
// ---------------------------------------------------------------------------

import type { NormalizedPaginatedResult, PaginationParams } from "@/lib/api/client";
import { normalizePaginated } from "@/lib/api/client";

export interface UseApiPaginatedQueryOptions<T>
  extends Omit<
    UseQueryOptions<
      NormalizedPaginatedResult<T>,
      AppError,
      NormalizedPaginatedResult<T>,
      QueryKey
    >,
    "queryFn"
  > {
  /** API endpoint path */
  path: string;
  /** Pagination/filter params */
  params?: PaginationParams & Record<string, unknown>;
  /** Backend response format (A=standard, B=meta-pagination, C=public-search, D=jobs, E=legacy) */
  format?: "A" | "B" | "C" | "D" | "E";
  /** Axios config overrides */
  axiosConfig?: AxiosRequestConfig;
  /**
   * Scopes this request to a specific partner via X-Partner-ID header.
   * Use this for admin partner drill-down pages where data must be
   * filtered to a specific partner. Also adds the value to the query
   * key for proper cache separation.
   */
  partnerScope?: string;
}

/**
 * Base query hook for paginated list requests.
 *
 * Automatically normalizes all 4 backend pagination formats into a
 * unified NormalizedPaginatedResult<T>.
 *
 * @example
 * ```ts
 * const { data, error } = useApiPaginatedQuery<Listing>({
 *   queryKey: queryKeys.listings.list(partnerId, params),
 *   path: '/listings',
 *   params: { page: 1, pageSize: 20, status: 'PUBLISHED' },
 *   format: 'A',
 * });
 * // data.items, data.pagination.total, data.pagination.totalPages
 * ```
 */
export function useApiPaginatedQuery<T>({
  path,
  params,
  format = "A",
  axiosConfig,
  partnerScope,
  ...queryOptions
}: UseApiPaginatedQueryOptions<T>): UseQueryResult<
  NormalizedPaginatedResult<T>,
  AppError
> {
  // Build final Axios config — inject X-Partner-ID header if partnerScope is set
  const finalAxiosConfig = partnerScope
    ? {
        ...axiosConfig,
        headers: {
          ...axiosConfig?.headers,
          "X-Partner-ID": partnerScope,
        },
      }
    : axiosConfig;

  // Add partnerScope to query key for per-partner cache separation
  const queryKey = partnerScope
    ? [...(queryOptions.queryKey as unknown[]), { partnerScope }]
    : queryOptions.queryKey;

  return useQuery<
    NormalizedPaginatedResult<T>,
    AppError,
    NormalizedPaginatedResult<T>,
    QueryKey
  >({
    ...queryOptions,
    queryKey,
    // Keep previous data for smooth pagination transitions
    placeholderData: (prev) => prev,
    queryFn: async () => {
      try {
        const response = await api.get(path, {
          ...finalAxiosConfig,
          params: {
            ...finalAxiosConfig?.params,
            ...params,
          },
        });

        return normalizePaginated<T>(response.data, format);
      } catch (error) {
        throw normalizeError(error);
      }
    },
  });
}
