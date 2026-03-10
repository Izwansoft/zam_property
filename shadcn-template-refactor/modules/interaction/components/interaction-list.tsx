// =============================================================================
// InteractionList — Inbox view with filters, cards grid, pagination
// =============================================================================

"use client";

import { Inbox } from "lucide-react";

import type { Interaction, InteractionFilters } from "../types";
import { InteractionCard, InteractionCardSkeleton } from "./interaction-card";
import { InteractionFiltersBar } from "./interaction-filters";
import { InteractionPagination } from "./interaction-pagination";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface InteractionListProps {
  interactions: Interaction[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  filters: InteractionFilters;
  onFiltersChange: (filters: InteractionFilters) => void;
  isLoading: boolean;
  /** Base path for detail links */
  basePath: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function InteractionList({
  interactions,
  pagination,
  filters,
  onFiltersChange,
  isLoading,
  basePath,
}: InteractionListProps) {
  const handlePageChange = (newPage: number) => {
    onFiltersChange({ ...filters, page: newPage });
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <InteractionFiltersBar
        filters={filters}
        onFiltersChange={onFiltersChange}
      />

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <InteractionCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Interaction cards */}
      {!isLoading && interactions.length > 0 && (
        <div className="space-y-3">
          {interactions.map((interaction) => (
            <InteractionCard
              key={interaction.id}
              interaction={interaction}
              basePath={basePath}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && interactions.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Inbox className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No interactions found</h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm">
            {filters.search || filters.status || filters.type
              ? "Try adjusting your filters or search terms."
              : "Your inbox is empty. Interactions will appear here when customers reach out."}
          </p>
        </div>
      )}

      {/* Pagination */}
      {!isLoading && pagination.totalPages > 1 && (
        <InteractionPagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          pageSize={pagination.pageSize}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}
