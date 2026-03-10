// =============================================================================
// Tenant Bills List Content — Client Component
// =============================================================================

"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Receipt } from "lucide-react";

import { PageHeader } from "@/components/common/page-header";
import {
  BillList,
  useBillings,
  getStatusesForBillingFilter,
} from "@/modules/billing";
import type { BillingFilters } from "@/modules/billing";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BillsListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read filter & page from URL
  const [activeFilter, setActiveFilter] = useState(
    searchParams.get("filter") || "all"
  );
  const [page, setPage] = useState(
    parseInt(searchParams.get("page") || "1", 10)
  );

  // Build API filters based on active tab
  const buildFilters = (): BillingFilters => {
    const filters: BillingFilters = { page, pageSize: 10 };
    const statuses = getStatusesForBillingFilter(activeFilter);
    if (statuses) {
      filters.status = statuses;
    }
    return filters;
  };

  // Fetch bills
  const { data, isLoading, error } = useBillings(buildFilters());

  // Update URL when filter changes
  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
    setPage(1);
    const params = new URLSearchParams();
    if (filter !== "all") params.set("filter", filter);
    const query = params.toString();
    router.replace(query ? `?${query}` : ".", { scroll: false });
  };

  // Update page
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="My Bills"
        description="View and pay your rental bills"
        icon={Receipt}
      />

      {/* Error State */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          <p className="font-medium">Failed to load bills</p>
          <p className="text-sm">{error.message}</p>
        </div>
      )}

      {/* Bill List */}
      <BillList
        bills={data?.items || []}
        isLoading={isLoading}
        activeFilter={activeFilter}
        onFilterChange={handleFilterChange}
        pagination={data?.pagination}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
