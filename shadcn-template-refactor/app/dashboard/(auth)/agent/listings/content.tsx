"use client";

import { useCallback, useState } from "react";

import { PageHeader } from "@/components/common/page-header";
import { ListingList } from "@/modules/listing/components/listing-list";
import { ListingQuickSubmit } from "@/modules/listing/components/listing-quick-submit";
import { useListings } from "@/modules/listing/hooks/use-listings";
import type { ListingFilters } from "@/modules/listing/types";
import { DEFAULT_LISTING_FILTERS } from "@/modules/listing/types";
import { useVendors } from "@/modules/vendor/hooks/use-vendors";

export function AgentListingsContent() {
  const [filters, setFilters] = useState<ListingFilters>(DEFAULT_LISTING_FILTERS);

  const { data, isLoading, error } = useListings(filters);
  const { data: vendorsData } = useVendors({ page: 1, pageSize: 100, status: "APPROVED" });
  const vendors = vendorsData?.items ?? [];

  const handleFiltersChange = useCallback((newFilters: ListingFilters) => {
    setFilters(newFilters);
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Listings"
        description="Submit drafts and monitor approval status from partner admins."
      />

      <ListingQuickSubmit
        vendors={vendors}
        title="Submit New Draft"
        description="Submit a draft listing for partner moderation and approval."
      />

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/5 p-4 text-sm text-destructive">
          Failed to load listings. Please try again.
        </div>
      )}

      <ListingList
        listings={data?.items ?? []}
        pagination={data?.pagination ?? { page: 1, pageSize: 20, total: 0, totalPages: 0 }}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        isLoading={isLoading}
        basePath="/dashboard/agent/listings"
      />
    </div>
  );
}
