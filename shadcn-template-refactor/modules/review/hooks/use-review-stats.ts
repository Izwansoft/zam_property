// =============================================================================
// useReviewStats — TanStack Query hook for review rating aggregation
// =============================================================================
// Backend: GET /reviews/target/:targetType/:targetId/rating
// Returns aggregated rating (average, distribution, count) for a target.
// =============================================================================

"use client";

import { useApiQuery } from "@/hooks/use-api-query";
import { queryKeys } from "@/lib/query";
import { usePartnerId } from "@/modules/partner";
import type { ReviewStats } from "../types";

/**
 * Fetch review rating aggregation for a specific target.
 * Backend: GET /reviews/target/:targetType/:targetId/rating
 *
 * @param targetType - "vendor" | "listing"
 * @param targetId - The ID of the vendor or listing
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useReviewStats("vendor", "vendor-001");
 * // data: ReviewStats { averageRating, totalCount, distribution }
 * ```
 */
export function useReviewStats(
  targetType: "vendor" | "listing",
  targetId: string | undefined
) {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiQuery<ReviewStats>({
    queryKey: queryKeys.reviews.stats(partnerKey, targetType, targetId ?? ""),
    path: `/reviews/target/${targetType}/${targetId}/rating`,
    enabled: !!partnerId && !!targetId,
  });
}
