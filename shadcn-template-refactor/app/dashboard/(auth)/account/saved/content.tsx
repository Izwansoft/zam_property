// =============================================================================
// Saved Listings — Client content component
// =============================================================================

"use client";

import { useState, useCallback } from "react";

import { PageHeader } from "@/components/common/page-header";
import {
  useSavedListings,
  useUnsaveListing,
} from "@/modules/account/hooks/use-saved-listings";
import { SavedListingsList } from "@/modules/account/components/saved-listings-list";
import { showSuccess, showError } from "@/lib/errors/toast-helpers";
import type { SavedListingFilters } from "@/modules/account/types";
import { DEFAULT_SAVED_FILTERS } from "@/modules/account/types";

export function SavedListingsContent() {
  const [filters, setFilters] =
    useState<SavedListingFilters>(DEFAULT_SAVED_FILTERS);

  const { data, isLoading, error } = useSavedListings(filters);
  const unsaveMutation = useUnsaveListing();

  const handleFiltersChange = useCallback((newFilters: SavedListingFilters) => {
    setFilters(newFilters);
  }, []);

  const handleUnsave = useCallback(
    (listingId: string) => {
      unsaveMutation.mutate(listingId, {
        onSuccess: () => {
          showSuccess("Listing removed from your saved list.");
        },
        onError: () => {
          showError("Failed to remove listing. Please try again.");
        },
      });
    },
    [unsaveMutation]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Saved Listings"
        description="Your bookmarked and favorited property listings."
        breadcrumbOverrides={[
          { segment: "account", label: "My Account" },
          { segment: "saved", label: "Saved Listings" },
        ]}
      />

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/5 p-4 text-sm text-destructive">
          Failed to load saved listings. Please try again.
        </div>
      )}

      <SavedListingsList
        listings={data?.items ?? []}
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
        onUnsave={handleUnsave}
        isLoading={isLoading}
        isRemoving={unsaveMutation.isPending}
      />
    </div>
  );
}
