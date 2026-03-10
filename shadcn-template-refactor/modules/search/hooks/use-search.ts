// =============================================================================
// useSearch — Core search hook with URL sync, debounce, and pagination
// =============================================================================
// GET /api/v1/search/listings (authenticated dashboard)
// GET /api/v1/public/search/listings (public, rate-limited)
//
// URL is the single source of truth for all search parameters.
// Text input debounced at 300ms. keepPreviousData for smooth transitions.
// =============================================================================

"use client";

import { useCallback, useMemo } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

import { apiClient } from "@/lib/api/client";
import { queryKeys } from "@/lib/query";
import { normalizeError } from "@/lib/errors";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

import type {
  SearchParams,
  SearchResponse,
  SearchSort,
} from "../types";
import {
  parseUrlSearchParams,
  buildSearchQueryString,
  serializeSearchParams,
} from "../utils";

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

interface UseSearchOptions {
  /** Default params (applied when URL has no value) */
  defaults?: Partial<SearchParams>;
  /** Use public (unauthenticated) endpoint */
  isPublic?: boolean;
}

export function useSearch(options: UseSearchOptions = {}) {
  const { defaults, isPublic = false } = options;
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Parse current URL params
  const params = useMemo(
    () => parseUrlSearchParams(searchParams, defaults),
    [searchParams, defaults],
  );

  // Debounce the text query for API calls
  const debouncedQuery = useDebouncedValue(params.q || "", 300);

  // Build the actual query params sent to API
  const apiParams = useMemo(
    () => ({ ...params, q: debouncedQuery || undefined }),
    [params, debouncedQuery],
  );

  // Determine endpoint
  const endpoint = isPublic
    ? "/public/search/listings"
    : "/search/listings";

  // TanStack Query
  const query = useQuery<SearchResponse>({
    queryKey: queryKeys.search.listings(apiParams as Record<string, unknown>),
    queryFn: async () => {
      const serialized = serializeSearchParams(apiParams);
      const response = await apiClient.get<SearchResponse>(endpoint, {
        params: serialized,
      });
      return response.data;
    },
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });

  // ---------------------------------------------------------------------------
  // URL mutation helpers
  // ---------------------------------------------------------------------------

  const setParams = useCallback(
    (newParams: Partial<SearchParams>) => {
      const updated = { ...params, ...newParams };
      const qs = buildSearchQueryString(updated);
      router.push(`${pathname}?${qs}`, { scroll: false });
    },
    [params, router, pathname],
  );

  const setQuery = useCallback(
    (q: string) => setParams({ q, page: 1 }),
    [setParams],
  );

  const setPage = useCallback(
    (page: number) => setParams({ page }),
    [setParams],
  );

  const setSort = useCallback(
    (sort: SearchSort) => setParams({ sort, page: 1 }),
    [setParams],
  );

  const clearFilters = useCallback(() => {
    const qs = params.q ? `?q=${encodeURIComponent(params.q)}` : "";
    router.push(`${pathname}${qs}`, { scroll: false });
  }, [params.q, router, pathname]);

  return {
    // Query state
    data: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error ? normalizeError(query.error) : null,

    // Search state
    params,
    debouncedQuery,

    // URL mutation
    setParams,
    setQuery,
    setPage,
    setSort,
    clearFilters,
  };
}
