// =============================================================================
// useReviewDetail — TanStack Query hook for single review
// =============================================================================
// Fetches a single review by ID using standard single entity response.
// Uses partner-scoped query keys for proper cache isolation.
// =============================================================================

"use client";

import { useApiQuery } from "@/hooks/use-api-query";
import { queryKeys } from "@/lib/query";
import { usePartnerId } from "@/modules/partner";
import type { ReviewDetail } from "../types";

/**
 * Fetch a single review by ID.
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useReviewDetail("review-001");
 * // data: ReviewDetail
 * ```
 */
export function useReviewDetail(reviewId: string) {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiQuery<ReviewDetail>({
    queryKey: queryKeys.reviews.detail(partnerKey, reviewId),
    path: `/reviews/${reviewId}`,
    enabled: !!partnerId && !!reviewId,
  });
}
