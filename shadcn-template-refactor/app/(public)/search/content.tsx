/**
 * Search Page — Client Content
 *
 * Client component that orchestrates:
 *  - SearchInput with autocomplete
 *  - SearchFilters (Sheet mobile / sidebar desktop)
 *  - SearchResults with grid/list toggle
 *  - SearchSortSelect
 *  - GeoSearchControls
 *  - URL-synced search params
 *
 * @see docs/ai-prompt/part-25.md - Global Search & Discovery
 * @see docs/ai-prompt/part-16.md - Search UI Deep Dive
 */

"use client";

import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";

import { Badge } from "@/components/ui/badge";

import {
  useSearch,
  useSearchFacets,
  SearchInput,
  SearchResults,
  SearchFilters,
  SearchFiltersSidebar,
  SearchSortSelect,
  GeoSearchControls,
  countActiveFilters,
} from "@/modules/search";
import type { SearchSort, SearchParams } from "@/modules/search";
import { SaveSearchButton } from "@/modules/search/components/save-search-button";
import { useMaintenanceStatus, MaintenancePage } from "@/modules/vertical";

// =============================================================================
// Component
// =============================================================================

export default function SearchContent() {
  const [view, setView] = useState<"grid" | "list" | "map">("grid");

  // Core search hook — URL is the single source of truth
  const {
    data,
    isLoading,
    isFetching,
    params,
    setParams,
    setQuery,
    setPage,
    setSort,
    clearFilters,
  } = useSearch({ isPublic: true });

  // Check maintenance status if a specific vertical is selected
  const { data: maintenanceStatus, refetch: refetchMaintenance } = useMaintenanceStatus(
    params.verticalType || null
  );

  // Format facets from response
  const facets = useSearchFacets(data?.meta?.facets);

  // Active filter count (for badge)
  const activeFilterCount = countActiveFilters(params);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleParamsChange = (newParams: Partial<SearchParams>) => {
    setParams({ ...newParams, page: 1 });
  };

  // ---------------------------------------------------------------------------
  // Maintenance Check
  // ---------------------------------------------------------------------------

  if (params.verticalType && maintenanceStatus?.isUnderMaintenance) {
    return <MaintenancePage status={maintenanceStatus} onRetry={() => refetchMaintenance()} />;
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6 md:px-6 lg:px-8">
      {/* ----------------------------------------------------------------- */}
      {/* Search bar */}
      {/* ----------------------------------------------------------------- */}
      <div className="mb-6">
        <SearchInput
          value={params.q || ""}
          onChange={setQuery}
          onSearch={setQuery}
          placeholder="Search properties, locations, vendors..."
          size="lg"
        />
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Toolbar: mobile filter trigger, sort, result count */}
      {/* ----------------------------------------------------------------- */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Mobile filter sheet trigger */}
          <div className="lg:hidden">
            <SearchFilters
              params={params}
              facets={facets}
              onParamsChange={handleParamsChange}
              onClear={clearFilters}
            />
          </div>

          {/* Active filter count */}
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="gap-1">
              <SlidersHorizontal className="h-3 w-3" />
              {activeFilterCount} filter{activeFilterCount !== 1 ? "s" : ""}
            </Badge>
          )}

          {/* Result count */}
          {data?.meta?.pagination && (
            <span className="text-muted-foreground text-sm">
              {data.meta.pagination.totalItems.toLocaleString()} result
              {data.meta.pagination.totalItems !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Sort + Save Search */}
        <div className="flex items-center gap-2">
          <SaveSearchButton params={params} />
          <SearchSortSelect
            value={(params.sort as SearchSort) || "relevance"}
            onChange={setSort}
          />
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Main content: sidebar + results */}
      {/* ----------------------------------------------------------------- */}
      <div className="flex gap-6">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block">
          <SearchFiltersSidebar
            params={params}
            facets={facets}
            onParamsChange={handleParamsChange}
            onClear={clearFilters}
          />

          {/* Geo search below filters */}
          <div className="mt-4">
            <GeoSearchControls
              params={params}
              onParamsChange={handleParamsChange}
            />
          </div>
        </aside>

        {/* Results area */}
        <main className="min-w-0 flex-1">
          <SearchResults
            data={data}
            isLoading={isLoading}
            isFetching={isFetching}
            params={params}
            view={view}
            onViewChange={setView}
            onPageChange={setPage}
          />
        </main>
      </div>
    </div>
  );
}
