// verticals/real-estate/components/PropertyTypeFacet.tsx
// Property type facet filter with icons and optional counts

"use client";

import { useMemo, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Building2,
  Building,
  Home,
  Hotel,
  Castle,
  Store,
  Briefcase,
  Warehouse,
  Factory,
  Mountain,
  LayoutGrid,
  Landmark,
  Columns3,
  ArrowUpDown,
  Star,
  HelpCircle,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PropertyType } from "../types";
import { PROPERTY_TYPE_LABELS } from "../constants";

/**
 * Icon mapping for each property type.
 * Re-uses the same mapping from PropertyTypeSelector for consistency.
 */
const PROPERTY_TYPE_ICONS: Record<PropertyType, React.ElementType> = {
  apartment: Building2,
  condominium: Building,
  terrace: Home,
  semi_detached: Columns3,
  bungalow: Hotel,
  townhouse: Landmark,
  studio: LayoutGrid,
  penthouse: Star,
  duplex: ArrowUpDown,
  villa: Castle,
  shop_lot: Store,
  office: Briefcase,
  warehouse: Warehouse,
  factory: Factory,
  land: Mountain,
  other: HelpCircle,
};

/** Facet count for a given property type */
export interface PropertyTypeFacetCount {
  value: PropertyType;
  count: number;
}

interface PropertyTypeFacetProps {
  /** Currently selected property types */
  value: PropertyType[];
  /** Callback when selection changes */
  onChange: (value: PropertyType[]) => void;
  /** Facet counts from the search API (optional) */
  facetCounts?: PropertyTypeFacetCount[];
  /** Whether the filter is disabled */
  disabled?: boolean;
  /** Maximum items to show before "Show more" */
  maxVisible?: number;
  /** Compact mode (smaller items, no icons) */
  compact?: boolean;
}

/**
 * Property type facet with icons and optional counts.
 * Renders as a checkbox list with expand/collapse for large lists.
 */
export function PropertyTypeFacet({
  value,
  onChange,
  facetCounts,
  disabled,
  maxVisible = 8,
  compact,
}: PropertyTypeFacetProps) {
  const [expanded, setExpanded] = useState(false);

  // Order by facet count (descending) if available, otherwise by label order
  const orderedTypes = useMemo(() => {
    const allTypes = Object.keys(PROPERTY_TYPE_LABELS) as PropertyType[];

    if (facetCounts && facetCounts.length > 0) {
      const countMap = new Map(facetCounts.map((f) => [f.value, f.count]));
      return [...allTypes].sort((a, b) => {
        const countA = countMap.get(a) ?? 0;
        const countB = countMap.get(b) ?? 0;
        // Selected items first, then by count descending
        const selectedA = value.includes(a) ? 1 : 0;
        const selectedB = value.includes(b) ? 1 : 0;
        if (selectedA !== selectedB) return selectedB - selectedA;
        return countB - countA;
      });
    }

    return allTypes;
  }, [facetCounts, value]);

  const visibleTypes = expanded
    ? orderedTypes
    : orderedTypes.slice(0, maxVisible);

  const hasMore = orderedTypes.length > maxVisible;

  const getCount = (type: PropertyType): number | undefined => {
    if (!facetCounts) return undefined;
    return facetCounts.find((f) => f.value === type)?.count;
  };

  const toggleType = (type: PropertyType) => {
    const next = value.includes(type)
      ? value.filter((v) => v !== type)
      : [...value, type];
    onChange(next);
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Property Type</span>
        {value.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-5 text-xs"
            onClick={() => onChange([])}
            disabled={disabled}
          >
            Clear
          </Button>
        )}
      </div>

      <div className="space-y-0.5">
        {visibleTypes.map((type) => {
          const Icon = PROPERTY_TYPE_ICONS[type];
          const count = getCount(type);
          const isZero = count === 0;
          const isSelected = value.includes(type);

          return (
            <label
              key={type}
              className={cn(
                "hover:bg-accent flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm",
                isZero && !isSelected && "text-muted-foreground opacity-50",
                disabled && "pointer-events-none opacity-50"
              )}
            >
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => toggleType(type)}
                disabled={disabled || (isZero && !isSelected)}
              />
              {!compact && (
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0",
                    isSelected
                      ? "text-primary"
                      : "text-muted-foreground"
                  )}
                />
              )}
              <span className="flex-1 truncate">
                {PROPERTY_TYPE_LABELS[type]}
              </span>
              {count !== undefined && (
                <Badge
                  variant="secondary"
                  className={cn(
                    "h-5 min-w-6 justify-center text-[10px]",
                    isZero && "opacity-50"
                  )}
                >
                  {count}
                </Badge>
              )}
            </label>
          );
        })}
      </div>

      {/* Show more / less toggle */}
      {hasMore && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-full text-xs"
          onClick={() => setExpanded(!expanded)}
        >
          <ChevronDown
            className={cn(
              "mr-1 h-3 w-3 transition-transform",
              expanded && "rotate-180"
            )}
          />
          {expanded
            ? "Show less"
            : `Show ${orderedTypes.length - maxVisible} more`}
        </Button>
      )}
    </div>
  );
}

