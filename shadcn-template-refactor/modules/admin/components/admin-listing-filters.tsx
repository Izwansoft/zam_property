// =============================================================================
// AdminListingFilters — Filter bar for admin listing moderation
// =============================================================================

"use client";

import { useCallback } from "react";
import { SearchIcon, XIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { AdminListingFilters as Filters } from "../types";
import { DEFAULT_ADMIN_LISTING_FILTERS } from "../types";
import type { ListingStatus } from "@/modules/listing";
import { VERTICAL_DISPLAY_NAMES } from "@/modules/vertical/utils/display-names";

// ---------------------------------------------------------------------------
// Status options
// ---------------------------------------------------------------------------

const STATUS_OPTIONS: { value: ListingStatus; label: string }[] = [
  { value: "DRAFT", label: "Draft" },
  { value: "PUBLISHED", label: "Published" },
  { value: "EXPIRED", label: "Expired" },
  { value: "ARCHIVED", label: "Archived" },
];

const FEATURED_OPTIONS = [
  { value: "true", label: "Featured" },
  { value: "false", label: "Not Featured" },
];

/** Known vertical types for the dropdown */
const VERTICAL_TYPE_OPTIONS = Object.entries(VERTICAL_DISPLAY_NAMES).map(
  ([value, label]) => ({ value, label })
);

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface AdminListingFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  /** Whether to show partner filter (platform only) */
  showPartnerFilter?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AdminListingFilters({
  filters,
  onFiltersChange,
  showPartnerFilter = false,
}: AdminListingFiltersProps) {
  const handleSearch = useCallback(
    (value: string) => {
      onFiltersChange({ ...filters, search: value, page: 1 });
    },
    [filters, onFiltersChange]
  );

  const handleStatus = useCallback(
    (value: string) => {
      onFiltersChange({
        ...filters,
        status: value === "all" ? "" : (value as ListingStatus),
        page: 1,
      });
    },
    [filters, onFiltersChange]
  );

  const handleFeatured = useCallback(
    (value: string) => {
      onFiltersChange({
        ...filters,
        isFeatured: value === "all" ? "" : value === "true",
        page: 1,
      });
    },
    [filters, onFiltersChange]
  );

  const handleVerticalType = useCallback(
    (value: string) => {
      onFiltersChange({
        ...filters,
        verticalType: value === "all" ? undefined : value,
        page: 1,
      });
    },
    [filters, onFiltersChange]
  );

  const handleReset = useCallback(() => {
    onFiltersChange(DEFAULT_ADMIN_LISTING_FILTERS);
  }, [onFiltersChange]);

  const hasActiveFilters =
    filters.search ||
    filters.status ||
    filters.isFeatured !== "" ||
    filters.partnerId ||
    filters.verticalType;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative w-full sm:w-64">
        <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search listings..."
          value={filters.search ?? ""}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-8"
        />
      </div>

      {/* Status filter */}
      <Select value={filters.status || "all"} onValueChange={handleStatus}>
        <SelectTrigger className="w-36">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          {STATUS_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Featured filter */}
      <Select
        value={filters.isFeatured === "" || filters.isFeatured === undefined ? "all" : String(filters.isFeatured)}
        onValueChange={handleFeatured}
      >
        <SelectTrigger className="w-36">
          <SelectValue placeholder="Featured" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          {FEATURED_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Vertical type filter */}
      <Select
        value={filters.verticalType || "all"}
        onValueChange={handleVerticalType}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Vertical" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Verticals</SelectItem>
          {VERTICAL_TYPE_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Partner filter — platform only */}
      {showPartnerFilter && (
        <div className="w-full sm:w-48">
          <Input
            placeholder="Filter by Partner ID"
            value={filters.partnerId ?? ""}
            onChange={(e) =>
              onFiltersChange({ ...filters, partnerId: e.target.value, page: 1 })
            }
          />
        </div>
      )}

      {/* Reset */}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={handleReset}>
          <XIcon className="mr-1 h-4 w-4" />
          Reset
        </Button>
      )}
    </div>
  );
}
