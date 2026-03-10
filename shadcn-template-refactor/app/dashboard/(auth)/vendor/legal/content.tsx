// =============================================================================
// Vendor Legal Content — Client Component (Owner legal case list)
// =============================================================================

"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Scale } from "lucide-react";

import { PageHeader } from "@/components/common/page-header";

import {
  useLegalCases,
  LegalCaseList,
  LegalCaseListSkeleton,
  getStatusesForLegalFilter,
} from "@/modules/legal";
import type { LegalCaseFilters } from "@/modules/legal";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function VendorLegalContent() {
  const searchParams = useSearchParams();

  // Read filter & page from URL
  const [activeFilter, setActiveFilter] = useState(
    searchParams.get("filter") || "all"
  );
  const [page, setPage] = useState(
    parseInt(searchParams.get("page") || "1", 10)
  );

  // Build API filters
  const buildFilters = (): LegalCaseFilters => {
    const filters: LegalCaseFilters = { page, pageSize: 10 };
    const statuses = getStatusesForLegalFilter(activeFilter);
    if (statuses && statuses.length === 1) {
      filters.status = statuses[0];
    }
    return filters;
  };

  const { data, isLoading, error } = useLegalCases(buildFilters());

  // Event handlers
  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <PageHeader
        title="Legal Cases"
        description="Cases escalated from overdue payments and tenancy violations"
        icon={Scale}
      />

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          Failed to load legal cases. Please try again later.
        </div>
      )}

      {isLoading && !data ? (
        <LegalCaseListSkeleton />
      ) : (
        <LegalCaseList
          cases={data?.items ?? []}
          isLoading={isLoading}
          activeFilter={activeFilter}
          onFilterChange={handleFilterChange}
          pagination={data?.pagination}
          onPageChange={handlePageChange}
          basePath="/dashboard/vendor/legal"
        />
      )}
    </div>
  );
}
