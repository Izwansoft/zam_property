// verticals/filter-builder/builder.tsx â€” FilterBuilder with URL state sync

"use client";

import { useCallback, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SlidersHorizontal, X } from "lucide-react";
import type { VerticalSearchMapping, RangeField as RangeFieldType } from "../types";
import {
  serializeFilters,
  deserializeFilters,
  countActiveFilters,
  type FilterValues,
} from "./querystring";
import {
  SelectFilter,
  MultiSelectFilter,
  RangeFilter,
  TextFilter,
  BooleanFilter,
} from "./components";

interface FilterBuilderProps {
  /** Search mapping from the vertical registry */
  mapping: VerticalSearchMapping;
  /** Layout variant */
  variant?: "sidebar" | "horizontal" | "sheet";
  /** Called when filters change (passes API-ready params) */
  onFiltersChange?: (filters: FilterValues) => void;
  /** Whether the filter panel is disabled */
  disabled?: boolean;
}

/**
 * FilterBuilder â€” Renders dynamic filter UI based on vertical search mapping.
 * Syncs filter state bidirectionally with URL search params.
 */
export function FilterBuilder({
  mapping,
  variant = "sidebar",
  onFiltersChange,
  disabled,
}: FilterBuilderProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Deserialize current filters from URL
  const filters = useMemo(
    () => deserializeFilters(searchParams, mapping),
    [searchParams, mapping]
  );

  const activeCount = useMemo(() => countActiveFilters(filters), [filters]);

  // Update a single filter value and sync to URL
  const updateFilter = useCallback(
    (key: string, value: unknown) => {
      const next = { ...filters };
      if (value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0)) {
        delete next[key];
      } else {
        next[key] = value;
      }

      // Serialize to URL
      const params = serializeFilters(next, mapping);
      const queryString = params.toString();
      router.push(`${pathname}${queryString ? `?${queryString}` : ""}`, {
        scroll: false,
      });

      onFiltersChange?.(next);
    },
    [filters, mapping, router, pathname, onFiltersChange]
  );

  // Clear all filters
  const clearAll = useCallback(() => {
    router.push(pathname, { scroll: false });
    onFiltersChange?.({});
  }, [router, pathname, onFiltersChange]);

  const filterContent = (
    <FilterContent
      mapping={mapping}
      filters={filters}
      updateFilter={updateFilter}
      clearAll={clearAll}
      activeCount={activeCount}
      disabled={disabled}
    />
  );

  if (variant === "sheet") {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {activeCount > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {activeCount}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[320px] sm:w-95">
          <SheetHeader>
            <SheetTitle>Filters</SheetTitle>
          </SheetHeader>
          <div className="mt-4 overflow-auto">{filterContent}</div>
        </SheetContent>
      </Sheet>
    );
  }

  if (variant === "horizontal") {
    return (
      <div className="flex flex-wrap items-end gap-4">
        <HorizontalFilters
          mapping={mapping}
          filters={filters}
          updateFilter={updateFilter}
          disabled={disabled}
        />
        {activeCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="gap-1 text-xs"
          >
            <X className="h-3 w-3" />
            Clear ({activeCount})
          </Button>
        )}
      </div>
    );
  }

  // Default: sidebar
  return <div className="space-y-4">{filterContent}</div>;
}

// --- Internal components ---

function FilterContent({
  mapping,
  filters,
  updateFilter,
  clearAll,
  activeCount,
  disabled,
}: {
  mapping: VerticalSearchMapping;
  filters: FilterValues;
  updateFilter: (key: string, value: unknown) => void;
  clearAll: () => void;
  activeCount: number;
  disabled?: boolean;
}) {
  const sortedFilterableFields = useMemo(
    () =>
      [...mapping.filterableFields].sort((a, b) => a.order - b.order),
    [mapping.filterableFields]
  );

  const sortedRangeFields = useMemo(
    () => [...mapping.rangeFields].sort((a, b) => a.order - b.order),
    [mapping.rangeFields]
  );

  return (
    <div className="space-y-4">
      {/* Header with clear */}
      {activeCount > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-sm">
            {activeCount} active filter{activeCount !== 1 ? "s" : ""}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="h-7 gap-1 text-xs"
          >
            <X className="h-3 w-3" />
            Clear all
          </Button>
        </div>
      )}

      {/* Filterable fields */}
      {sortedFilterableFields.map((field) => (
        <div key={field.key}>
          <FilterField
            field={field}
            value={filters[field.key]}
            onChange={(v) => updateFilter(field.key, v)}
            disabled={disabled}
          />
        </div>
      ))}

      {/* Range fields */}
      {sortedRangeFields.length > 0 && (
        <>
          <Separator />
          {sortedRangeFields.map((range) => (
            <RangeFilter
              key={range.key}
              field={range}
              value={
                filters[range.key] as
                  | { min?: number; max?: number }
                  | undefined
              }
              onChange={(v) => updateFilter(range.key, v)}
              disabled={disabled}
            />
          ))}
        </>
      )}
    </div>
  );
}

function FilterField({
  field,
  value,
  onChange,
  disabled,
}: {
  field: VerticalSearchMapping["filterableFields"][number];
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
}) {
  if (field.multiSelect || field.type === "array") {
    return (
      <MultiSelectFilter
        field={field}
        value={Array.isArray(value) ? value : []}
        onChange={onChange}
        disabled={disabled}
      />
    );
  }

  if (field.type === "boolean") {
    return (
      <BooleanFilter
        field={field}
        value={value as boolean | undefined}
        onChange={onChange}
        disabled={disabled}
      />
    );
  }

  if (field.type === "string" && !field.options?.length) {
    return (
      <TextFilter
        field={field}
        value={value as string | undefined}
        onChange={onChange}
        disabled={disabled}
      />
    );
  }

  // Default: select (enum with options)
  return (
    <SelectFilter
      field={field}
      value={value as string | undefined}
      onChange={onChange}
      disabled={disabled}
    />
  );
}

function HorizontalFilters({
  mapping,
  filters,
  updateFilter,
  disabled,
}: {
  mapping: VerticalSearchMapping;
  filters: FilterValues;
  updateFilter: (key: string, value: unknown) => void;
  disabled?: boolean;
}) {
  const sortedFields = useMemo(
    () =>
      [...mapping.filterableFields]
        .sort((a, b) => a.order - b.order)
        .slice(0, 5), // Only show first 5 in horizontal mode
    [mapping.filterableFields]
  );

  return (
    <>
      {sortedFields.map((field) => (
        <div key={field.key} className="min-w-37.5">
          <FilterField
            field={field}
            value={filters[field.key]}
            onChange={(v) => updateFilter(field.key, v)}
            disabled={disabled}
          />
        </div>
      ))}
    </>
  );
}

