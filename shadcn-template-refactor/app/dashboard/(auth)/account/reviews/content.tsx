// =============================================================================
// My Reviews — Client content component
// =============================================================================

"use client";

import { useState, useCallback } from "react";

import { PageHeader } from "@/components/common/page-header";
import { useCustomerReviews } from "@/modules/account/hooks/use-customer-reviews";
import { CustomerReviewList } from "@/modules/account/components/customer-review-list";
import type { CustomerReviewFilters } from "@/modules/account/types";
import { DEFAULT_CUSTOMER_REVIEW_FILTERS } from "@/modules/account/types";

export function CustomerReviewsContent() {
  const [filters, setFilters] = useState<CustomerReviewFilters>(
    DEFAULT_CUSTOMER_REVIEW_FILTERS
  );

  const { data, isLoading, error } = useCustomerReviews(filters);

  const handleFiltersChange = useCallback(
    (newFilters: CustomerReviewFilters) => {
      setFilters(newFilters);
    },
    []
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Reviews"
        description="Reviews you've written for vendors and listings."
        breadcrumbOverrides={[
          { segment: "account", label: "My Account" },
          { segment: "reviews", label: "My Reviews" },
        ]}
      />

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/5 p-4 text-sm text-destructive">
          Failed to load reviews. Please try again.
        </div>
      )}

      <CustomerReviewList
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
      />
    </div>
  );
}
