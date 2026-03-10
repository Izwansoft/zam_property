// =============================================================================
// ListingFilters â€” URL-driven filters for listing list pages
// =============================================================================

"use client";

import { useCallback } from "react";
import { Search, X, SlidersHorizontal } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { ListingFilters as ListingFiltersType, ListingStatus, SortBy, SortOrder } from "../types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ListingFiltersProps {
  filters: ListingFiltersType;
  onFiltersChange: (filters: ListingFiltersType) => void;
  /** Show vendor filter (for partner/platform portals) */
  showVendorFilter?: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_OPTIONS: { value: ListingStatus | ""; label: string }[] = [
  { value: "", label: "All Statuses" },
  { value: "DRAFT", label: "Draft" },
  { value: "PUBLISHED", label: "Published" },
  { value: "EXPIRED", label: "Expired" },
  { value: "ARCHIVED", label: "Archived" },
];

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "updatedAt:desc", label: "Recently Updated" },
  { value: "createdAt:desc", label: "Newest First" },
  { value: "createdAt:asc", label: "Oldest First" },
  { value: "price:asc", label: "Price: Low to High" },
  { value: "price:desc", label: "Price: High to Low" },
  { value: "title:asc", label: "Title: A-Z" },
  { value: "title:desc", label: "Title: Z-A" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ListingFiltersBar({
  filters,
  onFiltersChange,
}: ListingFiltersProps) {
  const updateFilter = useCallback(
    (key: keyof ListingFiltersType, value: unknown) => {
      onFiltersChange({
        ...filters,
        [key]: value,
        // Reset to page 1 when filter changes
        ...(key !== "page" ? { page: 1 } : {}),
      });
    },
    [filters, onFiltersChange]
  );

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateFilter("search", e.target.value);
    },
    [updateFilter]
  );

  const handleStatusChange = useCallback(
    (value: string) => {
      updateFilter("status", value === "__all__" ? "" : value as ListingStatus);
    },
    [updateFilter]
  );

  const handleSortChange = useCallback(
    (value: string) => {
      const [sortBy, sortOrder] = value.split(":") as [SortBy, SortOrder];
      onFiltersChange({
        ...filters,
        sortBy,
        sortOrder,
        page: 1,
      });
    },
    [filters, onFiltersChange]
  );

  const clearFilters = useCallback(() => {
    onFiltersChange({
      page: 1,
      pageSize: filters.pageSize || 20,
      status: "",
      search: "",
      sortBy: "updatedAt",
      sortOrder: "desc",
    });
  }, [filters.pageSize, onFiltersChange]);

  const hasActiveFilters = !!(filters.search || filters.status);
  const currentSort = `${filters.sortBy || "updatedAt"}:${filters.sortOrder || "desc"}`;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search listings..."
          value={filters.search || ""}
          onChange={handleSearchChange}
          className="pl-9"
        />
      </div>

      {/* Status filter */}
      <Select
        value={filters.status || "__all__"}
        onValueChange={handleStatusChange}
      >
        <SelectTrigger className="w-full sm:w-40">
          <SlidersHorizontal className="mr-2 h-4 w-4" />
          <SelectValue placeholder="All Statuses" />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((opt) => (
            <SelectItem key={opt.value || "__all__"} value={opt.value || "__all__"}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Sort */}
      <Select value={currentSort} onValueChange={handleSortChange}>
        <SelectTrigger className="w-full sm:w-50">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Clear filters */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="shrink-0"
        >
          <X className="mr-1 h-4 w-4" />
          Clear
        </Button>
      )}
    </div>
  );
}

