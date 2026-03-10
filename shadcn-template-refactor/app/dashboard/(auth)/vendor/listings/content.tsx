// =============================================================================
// Vendor Listings — Client content component
// =============================================================================

"use client";

import { useState, useCallback } from "react";

import { PageHeader } from "@/components/common/page-header";
import { useListings } from "@/modules/listing/hooks/use-listings";
import { ListingList } from "@/modules/listing/components/listing-list";
import type { ListingFilters } from "@/modules/listing/types";
import { DEFAULT_LISTING_FILTERS } from "@/modules/listing/types";

export function VendorListingsContent() {
  const [filters, setFilters] = useState<ListingFilters>(DEFAULT_LISTING_FILTERS);

  const { data, isLoading, error } = useListings(filters);

  const handleFiltersChange = useCallback((newFilters: ListingFilters) => {
    setFilters(newFilters);
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Listings"
        description="Manage your property listings, track views and inquiries."
      />

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/5 p-4 text-sm text-destructive">
          Failed to load listings. Please try again.
        </div>
      )}

      <ListingList
        listings={data?.items ?? []}
        pagination={
          data?.pagination ?? { page: 1, pageSize: 20, total: 0, totalPages: 0 }
        }
        filters={filters}
        onFiltersChange={handleFiltersChange}
        isLoading={isLoading}
        basePath="/dashboard/vendor/listings"
        createPath="/dashboard/vendor/listings/create"
      />
    </div>
  );
}
