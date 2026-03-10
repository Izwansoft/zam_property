// =============================================================================
// useAutocomplete — Debounced autocomplete suggestions hook
// =============================================================================
// GET /api/v1/search/suggestions?q=...&limit=10
//
// Debounces at 150ms. Only fires when query length >= 2.
// =============================================================================

"use client";

import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/api/client";
import { queryKeys } from "@/lib/query";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

import type { Suggestion } from "../types";

interface SuggestionsResponse {
  data: Suggestion[];
}

export function useAutocomplete(query: string, enabled: boolean = true) {
  const debouncedQuery = useDebouncedValue(query, 150);

  return useQuery<Suggestion[]>({
    queryKey: queryKeys.search.suggestions(debouncedQuery),
    queryFn: async () => {
      const response = await apiClient.get<SuggestionsResponse>(
        "/search/suggestions",
        { params: { q: debouncedQuery, limit: 10 } },
      );
      return response.data.data;
    },
    enabled: enabled && debouncedQuery.length >= 2,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });
}
