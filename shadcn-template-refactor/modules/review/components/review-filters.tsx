// =============================================================================
// ReviewFiltersBar â€” Filters for review list views
// =============================================================================

"use client";

import { useCallback, useEffect, useState } from "react";
import { Search, X, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { ReviewFilters, ReviewStatus } from "../types";
import { REVIEW_STATUS_CONFIG } from "../utils";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ReviewFiltersBarProps {
  filters: ReviewFilters;
  onFiltersChange: (filters: ReviewFilters) => void;
  /** Whether to show vendor filter (for partner views) */
  showVendorFilter?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ReviewFiltersBar({
  filters,
  onFiltersChange,
}: ReviewFiltersBarProps) {
  const [searchValue, setSearchValue] = useState(filters.search ?? "");

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue !== (filters.search ?? "")) {
        onFiltersChange({ ...filters, search: searchValue, page: 1 });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchValue]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStatusChange = useCallback(
    (value: string) => {
      onFiltersChange({
        ...filters,
        status: (value === "ALL" ? "" : value) as ReviewStatus | "",
        page: 1,
      });
    },
    [filters, onFiltersChange],
  );

  const handleRatingChange = useCallback(
    (value: string) => {
      onFiltersChange({
        ...filters,
        rating: value === "ALL" ? "" : parseInt(value, 10),
        page: 1,
      });
    },
    [filters, onFiltersChange],
  );

  const handleSortChange = useCallback(
    (value: string) => {
      const [sortBy, sortOrder] = value.split(":") as [string, string];
      onFiltersChange({
        ...filters,
        sortBy: sortBy as ReviewFilters["sortBy"],
        sortOrder: sortOrder as ReviewFilters["sortOrder"],
        page: 1,
      });
    },
    [filters, onFiltersChange],
  );

  const hasActiveFilters =
    !!filters.status || !!filters.rating || !!filters.search;

  const handleClear = useCallback(() => {
    setSearchValue("");
    onFiltersChange({
      page: 1,
      pageSize: filters.pageSize,
      status: "",
      rating: "",
      search: "",
      sortBy: "createdAt",
      sortOrder: "desc",
    });
  }, [filters.pageSize, onFiltersChange]);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search reviews..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Status */}
      <Select
        value={filters.status || "ALL"}
        onValueChange={handleStatusChange}
      >
        <SelectTrigger className="w-35">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Status</SelectItem>
          {(Object.keys(REVIEW_STATUS_CONFIG) as ReviewStatus[]).map(
            (status) => (
              <SelectItem key={status} value={status}>
                {REVIEW_STATUS_CONFIG[status].label}
              </SelectItem>
            ),
          )}
        </SelectContent>
      </Select>

      {/* Rating */}
      <Select
        value={filters.rating ? String(filters.rating) : "ALL"}
        onValueChange={handleRatingChange}
      >
        <SelectTrigger className="w-35">
          <SelectValue placeholder="Rating" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Ratings</SelectItem>
          {[5, 4, 3, 2, 1].map((r) => (
            <SelectItem key={r} value={String(r)}>
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span>{r} Star{r !== 1 ? "s" : ""}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Sort */}
      <Select
        value={`${filters.sortBy ?? "createdAt"}:${filters.sortOrder ?? "desc"}`}
        onValueChange={handleSortChange}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="createdAt:desc">Newest first</SelectItem>
          <SelectItem value="createdAt:asc">Oldest first</SelectItem>
          <SelectItem value="rating:desc">Highest rating</SelectItem>
          <SelectItem value="rating:asc">Lowest rating</SelectItem>
          <SelectItem value="updatedAt:desc">Recently updated</SelectItem>
        </SelectContent>
      </Select>

      {/* Clear */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="h-9 gap-1"
        >
          <X className="h-3.5 w-3.5" />
          Clear
        </Button>
      )}
    </div>
  );
}

