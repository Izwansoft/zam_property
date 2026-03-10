// =============================================================================
// InteractionFiltersBar â€” Filters for interactions inbox
// =============================================================================
// Search (debounced 300ms), status tabs, type filter, sort.
// =============================================================================

"use client";

import { useCallback, useEffect, useState } from "react";
import { Search, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

import type {
  InteractionFilters,
  InteractionStatus,
  InteractionType,
} from "../types";
import { DEFAULT_INTERACTION_FILTERS } from "../types";
import {
  INTERACTION_STATUS_CONFIG,
  INTERACTION_TYPE_CONFIG,
} from "../utils";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface InteractionFiltersBarProps {
  filters: InteractionFilters;
  onFiltersChange: (filters: InteractionFilters) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function InteractionFiltersBar({
  filters,
  onFiltersChange,
}: InteractionFiltersBarProps) {
  const [searchInput, setSearchInput] = useState(filters.search ?? "");

  // Debounce search (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== (filters.search ?? "")) {
        onFiltersChange({ ...filters, search: searchInput, page: 1 });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStatusChange = useCallback(
    (value: string) => {
      onFiltersChange({
        ...filters,
        status: value === "ALL" ? "" : (value as InteractionStatus),
        page: 1,
      });
    },
    [filters, onFiltersChange],
  );

  const handleTypeChange = useCallback(
    (value: string) => {
      onFiltersChange({
        ...filters,
        type: value === "ALL" ? "" : (value as InteractionType),
        page: 1,
      });
    },
    [filters, onFiltersChange],
  );

  const handleSortChange = useCallback(
    (value: string) => {
      const [sortBy, sortOrder] = value.split(":");
      onFiltersChange({
        ...filters,
        sortBy: sortBy as InteractionFilters["sortBy"],
        sortOrder: sortOrder as InteractionFilters["sortOrder"],
        page: 1,
      });
    },
    [filters, onFiltersChange],
  );

  const handleClearFilters = useCallback(() => {
    setSearchInput("");
    onFiltersChange(DEFAULT_INTERACTION_FILTERS);
  }, [onFiltersChange]);

  const hasActiveFilters =
    !!filters.status ||
    !!filters.type ||
    !!filters.search ||
    filters.sortBy !== "createdAt" ||
    filters.sortOrder !== "desc";

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-2">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search listing, reference, customer..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Status filter */}
      <Select
        value={filters.status || "ALL"}
        onValueChange={handleStatusChange}
      >
        <SelectTrigger className="w-full sm:w-35">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Statuses</SelectItem>
          {(
            Object.entries(INTERACTION_STATUS_CONFIG) as [
              InteractionStatus,
              (typeof INTERACTION_STATUS_CONFIG)[InteractionStatus],
            ][]
          ).map(([key, config]) => (
            <SelectItem key={key} value={key}>
              {config.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Type filter */}
      <Select
        value={filters.type || "ALL"}
        onValueChange={handleTypeChange}
      >
        <SelectTrigger className="w-full sm:w-32.5">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Types</SelectItem>
          {(
            Object.entries(INTERACTION_TYPE_CONFIG) as [
              InteractionType,
              (typeof INTERACTION_TYPE_CONFIG)[InteractionType],
            ][]
          ).map(([key, config]) => (
            <SelectItem key={key} value={key}>
              {config.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Sort */}
      <Select
        value={`${filters.sortBy ?? "createdAt"}:${filters.sortOrder ?? "desc"}`}
        onValueChange={handleSortChange}
      >
        <SelectTrigger className="w-full sm:w-40">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="createdAt:desc">Newest First</SelectItem>
          <SelectItem value="createdAt:asc">Oldest First</SelectItem>
          <SelectItem value="updatedAt:desc">Recently Updated</SelectItem>
          <SelectItem value="status:asc">Status (A-Z)</SelectItem>
        </SelectContent>
      </Select>

      {/* Clear */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearFilters}
          className="shrink-0"
        >
          <X className="mr-1 h-4 w-4" />
          Clear
        </Button>
      )}
    </div>
  );
}

