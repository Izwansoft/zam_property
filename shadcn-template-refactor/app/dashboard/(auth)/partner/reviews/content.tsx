// =============================================================================
// Partner Reviews — Client content component
// =============================================================================

"use client";

import { useState, useCallback } from "react";

import { PageHeader } from "@/components/common/page-header";
import { useReviews } from "@/modules/review/hooks/use-reviews";
import { ReviewList } from "@/modules/review/components/review-list";
import { ReviewStatsDisplay } from "@/modules/review/components/review-stats";
import type { ReviewFilters } from "@/modules/review/types";
import { DEFAULT_REVIEW_FILTERS } from "@/modules/review/types";

export function PartnerReviewsContent() {
  const [filters, setFilters] =
    useState<ReviewFilters>(DEFAULT_REVIEW_FILTERS);

  const { data, isLoading, error } = useReviews(filters);

  const handleFiltersChange = useCallback((newFilters: ReviewFilters) => {
    setFilters(newFilters);
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reviews"
        description="View and moderate all customer reviews across vendors."
      />

      {/* Stats overview */}
      <ReviewStatsDisplay />

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/5 p-4 text-sm text-destructive">
          Failed to load reviews. Please try again.
        </div>
      )}

      <ReviewList
        reviews={data?.items ?? []}
        pagination={
          data?.pagination ?? {
            page: 1,
            pageSize: 20,
            total: 0,
            totalPages: 0,
          }
        }
        filters={filters}
        onFiltersChange={handleFiltersChange}
        isLoading={isLoading}
        basePath="/dashboard/partner/reviews"
        showVendor={true}
      />
    </div>
  );
}
