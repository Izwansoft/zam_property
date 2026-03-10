// =============================================================================
// SearchResults — Results grid/list with pagination
// =============================================================================

"use client";

import { useRouter } from "next/navigation";
import { SearchX, Grid3X3, List, MapPinned } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LazySearchMap } from "@/components/common/lazy-map";
import type { MapPin } from "@/components/common/lazy-map";

import type { SearchHit, SearchParams, SearchResponse } from "../types";
import { SearchResultCard } from "./search-result-card";
import { SearchResultsSkeleton } from "./search-results-skeleton";
import { formatCurrency } from "../utils";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface SearchResultsProps {
  data?: SearchResponse;
  isLoading: boolean;
  isFetching: boolean;
  params: SearchParams;
  view: "grid" | "list" | "map";
  onViewChange: (view: "grid" | "list" | "map") => void;
  onPageChange: (page: number) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SearchResults({
  data,
  isLoading,
  isFetching,
  params,
  view,
  onViewChange,
  onPageChange,
}: SearchResultsProps) {
  const router = useRouter();

  // Loading state
  if (isLoading) {
    return <SearchResultsSkeleton view={view === "map" ? "grid" : view} />;
  }

  // Empty state
  if (!data || data.data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <SearchX className="mb-4 h-12 w-12 text-muted-foreground" />
        <h3 className="mb-2 text-lg font-semibold">No listings found</h3>
        <p className="max-w-md text-sm text-muted-foreground">
          {params.q
            ? `No results for "${params.q}". Try adjusting your filters or search terms.`
            : "Try adjusting your search filters to find listings."}
        </p>
      </div>
    );
  }

  const { pagination } = data.meta;
  const start = (pagination.page - 1) * pagination.pageSize + 1;
  const end = Math.min(
    pagination.page * pagination.pageSize,
    pagination.totalItems,
  );

  // Build map pins from search hits that have coordinates
  const mapPins: MapPin[] =
    view === "map"
      ? data.data
          .filter(
            (hit) => hit.location.latitude != null && hit.location.longitude != null,
          )
          .map((hit) => ({
            id: hit.id,
            lat: hit.location.latitude!,
            lng: hit.location.longitude!,
            title: hit.title,
            price: formatCurrency(hit.price, hit.currency),
            href: `/listing/${hit.slug || hit.id}`,
          }))
      : [];

  const handleMapPinClick = (id: string) => {
    const hit = data.data.find((h) => h.id === id);
    if (hit) {
      router.push(`/listing/${hit.slug || hit.id}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Results header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {isFetching ? (
            "Searching..."
          ) : (
            <>
              Showing{" "}
              <span className="font-medium text-foreground">
                {start}–{end}
              </span>{" "}
              of{" "}
              <span className="font-medium text-foreground">
                {pagination.totalItems.toLocaleString()}
              </span>{" "}
              listings
            </>
          )}
        </p>

        {/* View toggle */}
        <div className="hidden gap-1 sm:flex">
          <Button
            variant={view === "grid" ? "outline" : "ghost"}
            size="icon"
            className="h-9 w-9"
            onClick={() => onViewChange("grid")}
            aria-label="Grid view"
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={view === "list" ? "outline" : "ghost"}
            size="icon"
            className="h-9 w-9"
            onClick={() => onViewChange("list")}
            aria-label="List view"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={view === "map" ? "outline" : "ghost"}
            size="icon"
            className="h-9 w-9"
            onClick={() => onViewChange("map")}
            aria-label="Map view"
          >
            <MapPinned className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Map view */}
      {view === "map" ? (
        <div className="space-y-4">
          {mapPins.length > 0 ? (
            <LazySearchMap
              pins={mapPins}
              height="500px"
              onPinClick={handleMapPinClick}
            />
          ) : (
            <div className="flex h-[500px] items-center justify-center rounded-lg border bg-muted/30">
              <div className="text-center">
                <MapPinned className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  No listings with location data to display on map
                </p>
              </div>
            </div>
          )}
          {/* Show compact list below map */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="list" aria-label="Search results">
            {data.data.map((hit) => (
              <div key={hit.id} role="listitem">
                <SearchResultCard hit={hit} view="grid" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Grid / List view */
        <div
          className={
            view === "grid"
              ? "grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              : "space-y-4"
          }
          role="list"
          aria-label="Search results"
        >
          {data.data.map((hit) => (
            <div key={hit.id} role="listitem">
              <SearchResultCard hit={hit} view={view} />
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <SearchPagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pagination sub-component
// ---------------------------------------------------------------------------

function SearchPagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) {
  // Build page number array with ellipsis
  const pages = buildPageNumbers(page, totalPages);

  return (
    <nav
      className="flex items-center justify-center gap-1"
      aria-label="Search pagination"
    >
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
      >
        Previous
      </Button>

      {pages.map((p, i) =>
        p === "..." ? (
          <span
            key={`ellipsis-${i}`}
            className="px-2 text-sm text-muted-foreground"
          >
            ...
          </span>
        ) : (
          <Button
            key={p}
            variant={p === page ? "default" : "outline"}
            size="sm"
            className="h-9 w-9 p-0"
            onClick={() => onPageChange(p as number)}
            aria-current={p === page ? "page" : undefined}
          >
            {p}
          </Button>
        ),
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
      >
        Next
      </Button>
    </nav>
  );
}

function buildPageNumbers(
  current: number,
  total: number,
): (number | "...")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | "...")[] = [1];

  if (current > 3) pages.push("...");

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) pages.push("...");

  pages.push(total);

  return pages;
}
