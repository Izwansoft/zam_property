// =============================================================================
// useCustomerReviews — Reviews written by the customer
// =============================================================================
// TODO: Backend does NOT have GET /account/reviews.
//       Reviews module has GET /reviews with filters, but no
//       "my reviews" filter by current user. Needs backend support.
//       Closest: GET /reviews?targetType=vendor&targetId=xxx
// =============================================================================

"use client";

import { useApiPaginatedQuery } from "@/hooks/use-api-query";
import type { CustomerReview, CustomerReviewFilters } from "../types";

function cleanReviewFilters(
  filters: CustomerReviewFilters
): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};
  if (filters.page) cleaned.page = filters.page;
  if (filters.pageSize) cleaned.pageSize = filters.pageSize;
  if (filters.rating) cleaned.rating = filters.rating;
  if (filters.search) cleaned.search = filters.search;
  return cleaned;
}

/**
 * Disabled — backend does not have a customer-scoped reviews endpoint.
 * Returns empty result set. Enable when GET /reviews?reviewer=me is implemented.
 */
export function useCustomerReviews(filters: CustomerReviewFilters = {}) {
  const cleanedParams = cleanReviewFilters(filters);

  return useApiPaginatedQuery<CustomerReview>({
    queryKey: ["account", "reviews", cleanedParams],
    path: "/account/reviews",
    params: cleanedParams,
    format: "A",
    staleTime: 60 * 1000,
    enabled: false, // Backend not implemented
  });
}
