// =============================================================================
// useReviews — TanStack Query hook for review list
// =============================================================================
// Uses paginated query (Format A) with partner-scoped query keys.
// Supports URL-driven filters, pagination, search, and sorting.
// =============================================================================

"use client";

import { useApiPaginatedQuery } from "@/hooks/use-api-query";
import { queryKeys } from "@/lib/query";
import { usePartnerId } from "@/modules/partner";
import type { Review, ReviewFilters } from "../types";
import { cleanReviewFilters } from "../utils";

/**
 * Fetch paginated reviews with filters.
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useReviews({ status: "PENDING", page: 1 });
 * // data.items: Review[], data.pagination: { page, pageSize, total, totalPages }
 * ```
 */
export function useReviews(filters: ReviewFilters = {}) {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";
  const cleanedParams = cleanReviewFilters(
    filters as Record<string, unknown>,
  );

  return useApiPaginatedQuery<Review>({
    queryKey: queryKeys.reviews.list(partnerKey, cleanedParams),
    path: "/reviews",
    params: cleanedParams,
    format: "A",
    enabled: !!partnerId,
  });
}
