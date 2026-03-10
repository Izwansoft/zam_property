// =============================================================================
// PartnerFiltersBar — Filter controls for partner list
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

import { PartnerStatus } from "../types";
import type { PartnerFilters, PartnerPlan } from "../types";
import { PARTNER_STATUS_CONFIG, PARTNER_PLAN_CONFIG } from "../utils";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface PartnerFiltersBarProps {
  filters: PartnerFilters;
  onFiltersChange: (filters: PartnerFilters) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PartnerFiltersBar({
  filters,
  onFiltersChange,
}: PartnerFiltersBarProps) {
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
        status: value === "all" ? "" : (value as PartnerStatus),
        page: 1,
      });
    },
    [filters, onFiltersChange]
  );

  const handlePlanChange = useCallback(
    (value: string) => {
      onFiltersChange({
        ...filters,
        plan: value === "all" ? "" : (value as PartnerPlan),
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
        sortBy: sortBy as PartnerFilters["sortBy"],
        sortOrder: sortOrder as PartnerFilters["sortOrder"],
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
      plan: "",
      search: "",
      sortBy: "createdAt",
      sortOrder: "desc",
    });
  }, [filters.pageSize, onFiltersChange]);

  const hasActiveFilters =
    !!filters.status || !!filters.plan || !!filters.search;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Left: Search + Filters */}
      <div className="flex flex-1 flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative w-full sm:max-w-70">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search partners..."
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
            {(
              Object.entries(PARTNER_STATUS_CONFIG) as [
                PartnerStatus,
                { label: string },
              ][]
            ).map(([value, config]) => (
              <SelectItem key={value} value={value}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Plan */}
        <Select
          value={filters.plan || "all"}
          onValueChange={handlePlanChange}
        >
          <SelectTrigger className="w-35 h-9">
            <SelectValue placeholder="Plan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Plans</SelectItem>
            {(
              Object.entries(PARTNER_PLAN_CONFIG) as [
                PartnerPlan,
                { label: string },
              ][]
            ).map(([value, config]) => (
              <SelectItem key={value} value={value}>
                {config.label}
              </SelectItem>
            ))}
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
          <SelectItem value="vendorCount:desc">Most vendors</SelectItem>
          <SelectItem value="updatedAt:desc">Recently updated</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}


