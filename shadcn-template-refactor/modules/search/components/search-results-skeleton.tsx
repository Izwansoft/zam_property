// =============================================================================
// SearchResultsSkeleton — Loading skeleton for search results grid
// =============================================================================

"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { SearchResultCardSkeleton } from "./search-result-card";

interface SearchResultsSkeletonProps {
  view?: "grid" | "list";
  count?: number;
}

export function SearchResultsSkeleton({
  view = "grid",
  count = 8,
}: SearchResultsSkeletonProps) {
  return (
    <div className="space-y-6">
      {/* Results count skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-40" />
      </div>

      {/* Grid/List skeleton */}
      <div
        className={
          view === "grid"
            ? "grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            : "space-y-4"
        }
      >
        {Array.from({ length: count }).map((_, i) => (
          <SearchResultCardSkeleton key={i} view={view} />
        ))}
      </div>
    </div>
  );
}
