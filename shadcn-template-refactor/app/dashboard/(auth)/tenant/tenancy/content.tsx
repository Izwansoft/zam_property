// =============================================================================
// Tenant Tenancy List Content — Client Component
// =============================================================================

"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Home, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/page-header";
import {
  TenancyList,
  getStatusesForFilter,
  useTenancies,
} from "@/modules/tenancy";
import type { TenancyFilters } from "@/modules/tenancy";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TenancyListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read filter from URL or default to "all"
  const [activeFilter, setActiveFilter] = useState(
    searchParams.get("filter") || "all"
  );
  const [page, setPage] = useState(
    parseInt(searchParams.get("page") || "1", 10)
  );

  // Build filters based on active tab
  const buildFilters = (): TenancyFilters => {
    const filters: TenancyFilters = { page, pageSize: 10 };
    const statuses = getStatusesForFilter(activeFilter);
    if (statuses) {
      filters.status = statuses;
    }
    return filters;
  };

  // Fetch tenancies
  const {
    data,
    isLoading,
    error,
  } = useTenancies(buildFilters());

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
        title="My Tenancy"
        description="View and manage your rental agreements"
        icon={Home}
        actions={[
          {
            label: "Browse Listings",
            icon: Plus,
            onClick: () => router.push("/search"),
            variant: "default",
          },
        ]}
      />

      {/* Error State */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          <p className="font-medium">Failed to load tenancies</p>
          <p className="text-sm">{error.message}</p>
        </div>
      )}

      {/* Tenancy List */}
      <TenancyList
        tenancies={data?.items || []}
        isLoading={isLoading}
        activeFilter={activeFilter}
        onFilterChange={handleFilterChange}
        pagination={data?.pagination}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
