// =============================================================================
// ListingList — Grid/List toggle view for listings
// =============================================================================

"use client";

import { useState, useCallback } from "react";
import { LayoutGrid, List, Plus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

import type { Listing, ListingFilters } from "../types";
import { ListingCard, ListingCardSkeleton } from "./listing-card";
import { ListingFiltersBar } from "./listing-filters";
import { ListingPagination } from "./listing-pagination";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ListingListProps {
  /** Listing data */
  listings: Listing[];
  /** Total count for pagination */
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  /** Current filters */
  filters: ListingFilters;
  /** Filter change handler */
  onFiltersChange: (filters: ListingFilters) => void;
  /** Loading state */
  isLoading?: boolean;
  /** Base path for listing links */
  basePath: string;
  /** Create listing path (for "New listing" button) */
  createPath?: string;
  /** Show vendor column (for partner/platform portals) */
  showVendor?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type ViewMode = "grid" | "list";

export function ListingList({
  listings,
  pagination,
  filters,
  onFiltersChange,
  isLoading,
  basePath,
  createPath,
  showVendor,
}: ListingListProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const handlePageChange = useCallback(
    (page: number) => {
      onFiltersChange({ ...filters, page });
    },
    [filters, onFiltersChange]
  );

  return (
    <div className="space-y-4">
      {/* Toolbar: filters + controls */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex-1">
          <ListingFiltersBar
            filters={filters}
            onFiltersChange={onFiltersChange}
            showVendorFilter={showVendor}
          />
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(v) => v && setViewMode(v as ViewMode)}
            className="hidden sm:flex"
          >
            <ToggleGroupItem value="grid" aria-label="Grid view" size="sm">
              <LayoutGrid className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="List view" size="sm">
              <List className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>

          {/* Create button */}
          {createPath && (
            <Button asChild size="sm">
              <Link href={createPath}>
                <Plus className="mr-1 h-4 w-4" />
                New Listing
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        {isLoading
          ? "Loading..."
          : `${pagination.total} listing${pagination.total !== 1 ? "s" : ""} found`}
      </p>

      {/* Content */}
      {isLoading ? (
        <div
          className={
            viewMode === "grid"
              ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              : "space-y-3"
          }
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <ListingCardSkeleton key={i} />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <EmptyState createPath={createPath} />
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              : "space-y-3"
          }
        >
          {listings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              basePath={basePath}
              showVendor={showVendor}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <ListingPagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState({ createPath }: { createPath?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
      <div className="text-muted-foreground/40 text-6xl">📋</div>
      <h3 className="mt-4 text-lg font-semibold">No listings found</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Try adjusting your filters or create a new listing.
      </p>
      {createPath && (
        <Button className="mt-4" asChild>
          <Link href={createPath}>
            <Plus className="mr-1 h-4 w-4" />
            Create Your First Listing
          </Link>
        </Button>
      )}
    </div>
  );
}
