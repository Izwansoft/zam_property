"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Home } from "lucide-react";

import { PageHeader } from "@/components/common/page-header";
import {
  TenancyList,
  getStatusesForFilter,
  useTenancies,
} from "@/modules/tenancy";
import type { TenancyFilters } from "@/modules/tenancy";

export function AgentTenanciesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeFilter, setActiveFilter] = useState(searchParams.get("filter") || "all");
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1", 10));

  const buildFilters = (): TenancyFilters => {
    const filters: TenancyFilters = { page, pageSize: 10 };
    const statuses = getStatusesForFilter(activeFilter);
    if (statuses) {
      filters.status = statuses;
    }
    return filters;
  };

  const { data, isLoading, error } = useTenancies(buildFilters());

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
    setPage(1);
    const params = new URLSearchParams();
    if (filter !== "all") params.set("filter", filter);
    const query = params.toString();
    router.replace(query ? `?${query}` : ".", { scroll: false });
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Tenancies"
        description="Track active tenancies, renewals, and tenancy milestones."
        icon={Home}
        breadcrumbOverrides={[
          { segment: "agent", label: "Agent Portal" },
          { segment: "tenancies", label: "My Tenancies" },
        ]}
      />

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          <p className="font-medium">Failed to load tenancies</p>
          <p className="text-sm">{error.message}</p>
        </div>
      )}

      <TenancyList
        tenancies={data?.items || []}
        isLoading={isLoading}
        activeFilter={activeFilter}
        onFilterChange={handleFilterChange}
        pagination={data?.pagination}
        onPageChange={handlePageChange}
        basePath="/dashboard/agent/tenancies"
      />
    </div>
  );
}
