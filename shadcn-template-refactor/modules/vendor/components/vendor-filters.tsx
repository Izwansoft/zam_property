// =============================================================================
// VendorFiltersBar â€” Filter controls for vendor list
// =============================================================================

"use client";

import { useCallback, useEffect, useState } from "react";
import { Search, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { VendorFilters, VendorStatus, VendorType } from "../types";
import { VENDOR_STATUS_CONFIG, VENDOR_TYPE_CONFIG } from "../utils";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface VendorFiltersBarProps {
  filters: VendorFilters;
  onFiltersChange: (filters: VendorFilters) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function VendorFiltersBar({
  filters,
  onFiltersChange,
}: VendorFiltersBarProps) {
  const [searchValue, setSearchValue] = useState(filters.search ?? "");

  // Debounced search (300ms)
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
        status: value === "all" ? "" : (value as VendorStatus),
        page: 1,
      });
    },
    [filters, onFiltersChange]
  );

  const handleTypeChange = useCallback(
    (value: string) => {
      onFiltersChange({
        ...filters,
        type: value === "all" ? "" : (value as VendorType),
        page: 1,
      });
    },
    [filters, onFiltersChange]
  );

  const handleSortChange = useCallback(
    (value: string) => {
      const [sortBy, sortOrder] = value.split(":");
      onFiltersChange({
        ...filters,
        sortBy: sortBy as VendorFilters["sortBy"],
        sortOrder: sortOrder as VendorFilters["sortOrder"],
        page: 1,
      });
    },
    [filters, onFiltersChange]
  );

  const handleClearFilters = useCallback(() => {
    setSearchValue("");
    onFiltersChange({
      page: 1,
      pageSize: filters.pageSize,
      status: "",
      type: "",
      search: "",
      sortBy: "createdAt",
      sortOrder: "desc",
    });
  }, [filters.pageSize, onFiltersChange]);

  const hasActiveFilters =
    !!filters.status || !!filters.type || !!filters.search;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Left: Search + Filters */}
      <div className="flex flex-1 flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative w-full sm:max-w-70">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search vendors..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        {/* Status */}
        <Select
          value={filters.status || "all"}
          onValueChange={handleStatusChange}
        >
          <SelectTrigger className="w-35 h-9">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {(Object.entries(VENDOR_STATUS_CONFIG) as [VendorStatus, { label: string }][]).map(
              ([value, config]) => (
                <SelectItem key={value} value={value}>
                  {config.label}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>

        {/* Type */}
        <Select
          value={filters.type || "all"}
          onValueChange={handleTypeChange}
        >
          <SelectTrigger className="w-35 h-9">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {(Object.entries(VENDOR_TYPE_CONFIG) as [VendorType, { label: string }][]).map(
              ([value, config]) => (
                <SelectItem key={value} value={value}>
                  {config.label}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>

        {/* Clear */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="h-9 px-2 text-muted-foreground"
          >
            <X className="mr-1 h-3.5 w-3.5" />
            Clear
          </Button>
        )}
      </div>

      {/* Right: Sort */}
      <Select
        value={`${filters.sortBy ?? "createdAt"}:${filters.sortOrder ?? "desc"}`}
        onValueChange={handleSortChange}
      >
        <SelectTrigger className="w-45 h-9">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="createdAt:desc">Newest first</SelectItem>
          <SelectItem value="createdAt:asc">Oldest first</SelectItem>
          <SelectItem value="name:asc">Name A-Z</SelectItem>
          <SelectItem value="name:desc">Name Z-A</SelectItem>
          <SelectItem value="listingCount:desc">Most listings</SelectItem>
          <SelectItem value="updatedAt:desc">Recently updated</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

