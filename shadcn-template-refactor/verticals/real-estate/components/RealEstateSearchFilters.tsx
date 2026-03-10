// verticals/real-estate/components/RealEstateSearchFilters.tsx
// Composite filter panel with sidebar, horizontal, and mobile sheet variants

"use client";

import { useMemo, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { X, SlidersHorizontal, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

import { PriceRangeFilter } from "./PriceRangeFilter";
import type { PriceRange } from "./PriceRangeFilter";
import { RoomCountFilter } from "./RoomCountFilter";
import type { RoomCountValues } from "./RoomCountFilter";
import { PropertyTypeFacet } from "./PropertyTypeFacet";
import type { PropertyTypeFacetCount } from "./PropertyTypeFacet";
import type { PropertyType } from "../types";
import {
  LISTING_TYPE_LABELS,
  FURNISHING_LABELS,
  TENURE_LABELS,
  CONDITION_LABELS,
} from "../constants";
import { realEstateSearchMapping } from "../filters";
import { RangeFilter } from "../../filter-builder/components";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RealEstateSearchFiltersProps {
  /** Current filter values (typed) */
  propertyType: PropertyType[];
  listingType?: string;
  price: PriceRange | undefined;
  bedrooms?: string;
  bathrooms?: string;
  builtUpSize?: PriceRange;
  landSize?: PriceRange;
  furnishing?: string;
  tenure?: string;
  condition?: string;
  facilities: string[];

  /** Callbacks */
  onPropertyTypeChange: (types: PropertyType[]) => void;
  onListingTypeChange: (type: string | undefined) => void;
  onPriceChange: (range: PriceRange | undefined) => void;
  onRoomCountChange: (rooms: RoomCountValues) => void;
  onBuiltUpSizeChange: (range: PriceRange | undefined) => void;
  onLandSizeChange: (range: PriceRange | undefined) => void;
  onFurnishingChange: (value: string | undefined) => void;
  onTenureChange: (value: string | undefined) => void;
  onConditionChange: (value: string | undefined) => void;
  onFacilitiesChange: (values: string[]) => void;
  onClearAll: () => void;

  /** Number of active filters */
  activeCount: number;

  /** Facet counts from search API (optional) */
  propertyTypeFacets?: PropertyTypeFacetCount[];

  /** Layout variant */
  variant?: "sidebar" | "horizontal" | "sheet";

  /** Whether filters are disabled */
  disabled?: boolean;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

/**
 * RealEstateSearchFilters â€” Composite filter panel for real estate listings.
 *
 * Three layout variants:
 * - **sidebar**: Full filter panel for desktop sidebars
 * - **horizontal**: Compact inline filters for above listing grids
 * - **sheet**: Mobile-friendly Sheet overlay
 */
export function RealEstateSearchFilters(props: RealEstateSearchFiltersProps) {
  const { variant = "sidebar" } = props;

  if (variant === "sheet") {
    return <SheetVariant {...props} />;
  }

  if (variant === "horizontal") {
    return <HorizontalVariant {...props} />;
  }

  return <SidebarVariant {...props} />;
}

// ---------------------------------------------------------------------------
// Sidebar variant (full filter panel)
// ---------------------------------------------------------------------------

function SidebarVariant(props: RealEstateSearchFiltersProps) {
  const {
    propertyType,
    listingType,
    price,
    bedrooms,
    bathrooms,
    builtUpSize,
    landSize,
    furnishing,
    tenure,
    condition,
    facilities,
    onPropertyTypeChange,
    onListingTypeChange,
    onPriceChange,
    onRoomCountChange,
    onBuiltUpSizeChange,
    onLandSizeChange,
    onFurnishingChange,
    onTenureChange,
    onConditionChange,
    onFacilitiesChange,
    onClearAll,
    activeCount,
    propertyTypeFacets,
    disabled,
  } = props;

  return (
    <div className="space-y-4">
      {/* Header */}
      {activeCount > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-sm">
            {activeCount} active filter{activeCount !== 1 ? "s" : ""}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="h-7 gap-1 text-xs"
          >
            <X className="h-3 w-3" />
            Clear all
          </Button>
        </div>
      )}

      {/* Listing Type */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">For</label>
        <Select
          value={listingType ?? ""}
          onValueChange={(v) =>
            onListingTypeChange(v === "__all__" ? undefined : v)
          }
          disabled={disabled}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Sale or Rent" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All</SelectItem>
            {Object.entries(LISTING_TYPE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Property Type Facet */}
      <PropertyTypeFacet
        value={propertyType}
        onChange={onPropertyTypeChange}
        facetCounts={propertyTypeFacets}
        disabled={disabled}
      />

      <Separator />

      {/* Price Range */}
      <PriceRangeFilter
        value={price}
        onChange={onPriceChange}
        listingType={listingType}
        disabled={disabled}
      />

      <Separator />

      {/* Room Counts */}
      <RoomCountFilter
        value={{ bedrooms, bathrooms }}
        onChange={onRoomCountChange}
        disabled={disabled}
      />

      {/* More filters (collapsible) */}
      <Separator />
      <MoreFilters
        builtUpSize={builtUpSize}
        landSize={landSize}
        furnishing={furnishing}
        tenure={tenure}
        condition={condition}
        facilities={facilities}
        onBuiltUpSizeChange={onBuiltUpSizeChange}
        onLandSizeChange={onLandSizeChange}
        onFurnishingChange={onFurnishingChange}
        onTenureChange={onTenureChange}
        onConditionChange={onConditionChange}
        onFacilitiesChange={onFacilitiesChange}
        disabled={disabled}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Horizontal variant (compact inline)
// ---------------------------------------------------------------------------

function HorizontalVariant(props: RealEstateSearchFiltersProps) {
  const {
    propertyType,
    listingType,
    price,
    bedrooms,
    bathrooms,
    onPropertyTypeChange,
    onListingTypeChange,
    onPriceChange,
    onRoomCountChange,
    onClearAll,
    activeCount,
    disabled,
  } = props;

  return (
    <div className="flex flex-wrap items-end gap-3">
      {/* Listing Type */}
      <div className="min-w-30">
        <label className="mb-1 block text-xs font-medium">For</label>
        <Select
          value={listingType ?? ""}
          onValueChange={(v) =>
            onListingTypeChange(v === "__all__" ? undefined : v)
          }
          disabled={disabled}
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All</SelectItem>
            {Object.entries(LISTING_TYPE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Bedrooms quick */}
      <div className="min-w-35">
        <label className="mb-1 block text-xs font-medium">Beds</label>
        <Select
          value={bedrooms ?? ""}
          onValueChange={(v) =>
            onRoomCountChange({
              bedrooms: v === "__all__" ? undefined : v,
              bathrooms,
            })
          }
          disabled={disabled}
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue placeholder="Any" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Any</SelectItem>
            {["1", "2", "3", "4", "5+"].map((v) => (
              <SelectItem key={v} value={v}>
                {v} bed{v !== "1" ? "s" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Price range quick */}
      <div className="min-w-35">
        <label className="mb-1 block text-xs font-medium">
          Price{listingType === "rent" ? " /mo" : ""}
        </label>
        <PriceQuickSelect
          value={price}
          onChange={onPriceChange}
          listingType={listingType}
          disabled={disabled}
        />
      </div>

      {/* Property type indicator */}
      {propertyType.length > 0 && (
        <Badge variant="secondary" className="h-8 gap-1">
          {propertyType.length} type{propertyType.length !== 1 ? "s" : ""}
          <button
            onClick={() => onPropertyTypeChange([])}
            className="hover:text-destructive ml-1"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}

      {/* More filters trigger â€” opens sheet */}
      <SheetVariantTrigger {...props} />

      {/* Clear */}
      {activeCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="h-8 gap-1 text-xs"
        >
          <X className="h-3 w-3" />
          Clear ({activeCount})
        </Button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sheet variant (mobile / "More Filters")
// ---------------------------------------------------------------------------

function SheetVariant(props: RealEstateSearchFiltersProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {props.activeCount > 0 && (
            <Badge variant="secondary" className="ml-1 text-xs">
              {props.activeCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="flex w-85 flex-col sm:w-100">
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-auto py-4">
          <SidebarVariant {...props} />
        </div>
        <SheetFooter className="border-t pt-4">
          <Button
            variant="outline"
            onClick={props.onClearAll}
            className="flex-1"
          >
            Clear All
          </Button>
          {/* Close Sheet on "Apply" via SheetClose behavior */}
          <Button className="flex-1">
            Apply ({props.activeCount} filter{props.activeCount !== 1 ? "s" : ""})
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

/** Sheet trigger button for horizontal variant "More Filters" */
function SheetVariantTrigger(props: RealEstateSearchFiltersProps) {
  const moreFiltersCount = useMemo(() => {
    let count = 0;
    if (props.builtUpSize) count++;
    if (props.landSize) count++;
    if (props.furnishing) count++;
    if (props.tenure) count++;
    if (props.condition) count++;
    if (props.facilities.length > 0) count++;
    return count;
  }, [
    props.builtUpSize,
    props.landSize,
    props.furnishing,
    props.tenure,
    props.condition,
    props.facilities,
  ]);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          More
          {moreFiltersCount > 0 && (
            <Badge variant="secondary" className="h-4 text-[10px]">
              {moreFiltersCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="flex w-85 flex-col sm:w-100">
        <SheetHeader>
          <SheetTitle>All Filters</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-auto py-4">
          <SidebarVariant {...props} />
        </div>
        <SheetFooter className="border-t pt-4">
          <Button
            variant="outline"
            onClick={props.onClearAll}
            className="flex-1"
          >
            Clear All
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// ---------------------------------------------------------------------------
// More Filters (Collapsible section)
// ---------------------------------------------------------------------------

function MoreFilters({
  builtUpSize,
  landSize,
  furnishing,
  tenure,
  condition,
  facilities,
  onBuiltUpSizeChange,
  onLandSizeChange,
  onFurnishingChange,
  onTenureChange,
  onConditionChange,
  onFacilitiesChange,
  disabled,
}: {
  builtUpSize?: PriceRange;
  landSize?: PriceRange;
  furnishing?: string;
  tenure?: string;
  condition?: string;
  facilities: string[];
  onBuiltUpSizeChange: (range: PriceRange | undefined) => void;
  onLandSizeChange: (range: PriceRange | undefined) => void;
  onFurnishingChange: (value: string | undefined) => void;
  onTenureChange: (value: string | undefined) => void;
  onConditionChange: (value: string | undefined) => void;
  onFacilitiesChange: (values: string[]) => void;
  disabled?: boolean;
}) {
  const builtUpSizeField = realEstateSearchMapping.rangeFields.find(
    (f) => f.key === "builtUpSize"
  );
  const landSizeField = realEstateSearchMapping.rangeFields.find(
    (f) => f.key === "landSize"
  );

  return (
    <Collapsible>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="flex h-auto w-full items-center justify-between p-0 hover:bg-transparent"
        >
          <span className="flex items-center gap-1.5 text-sm font-medium">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            More Filters
          </span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-4 pt-4">
        {/* Built-up Size */}
        {builtUpSizeField && (
          <RangeFilter
            field={builtUpSizeField}
            value={builtUpSize}
            onChange={(v) =>
              onBuiltUpSizeChange(
                v as { min?: number; max?: number } | undefined
              )
            }
            disabled={disabled}
          />
        )}

        {/* Land Size */}
        {landSizeField && (
          <RangeFilter
            field={landSizeField}
            value={landSize}
            onChange={(v) =>
              onLandSizeChange(
                v as { min?: number; max?: number } | undefined
              )
            }
            disabled={disabled}
          />
        )}

        <Separator />

        {/* Furnishing */}
        <EnumSelect
          label="Furnishing"
          value={furnishing}
          options={FURNISHING_LABELS}
          onChange={onFurnishingChange}
          disabled={disabled}
        />

        {/* Tenure */}
        <EnumSelect
          label="Tenure"
          value={tenure}
          options={TENURE_LABELS}
          onChange={onTenureChange}
          disabled={disabled}
        />

        {/* Condition */}
        <EnumSelect
          label="Condition"
          value={condition}
          options={CONDITION_LABELS}
          onChange={onConditionChange}
          disabled={disabled}
        />

        <Separator />

        {/* Facilities */}
        <FacilitiesCheckboxGroup
          value={facilities}
          onChange={onFacilitiesChange}
          disabled={disabled}
        />
      </CollapsibleContent>
    </Collapsible>
  );
}

// ---------------------------------------------------------------------------
// Helper components
// ---------------------------------------------------------------------------

function EnumSelect({
  label,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string;
  value?: string;
  options: Record<string, string>;
  onChange: (value: string | undefined) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      <Select
        value={value ?? ""}
        onValueChange={(v) => onChange(v === "__all__" ? undefined : v)}
        disabled={disabled}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={`All ${label}`} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">All</SelectItem>
          {Object.entries(options).map(([val, lbl]) => (
            <SelectItem key={val} value={val}>
              {lbl}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/** Quick price select dropdown for horizontal variant */
function PriceQuickSelect({
  value,
  onChange,
  listingType,
  disabled,
}: {
  value: PriceRange | undefined;
  onChange: (range: PriceRange | undefined) => void;
  listingType?: string;
  disabled?: boolean;
}) {
  const presets =
    listingType === "rent"
      ? [
          { label: "Under RM1,500", min: 0, max: 1_500 },
          { label: "RM1.5K â€“ RM3K", min: 1_500, max: 3_000 },
          { label: "RM3K â€“ RM5K", min: 3_000, max: 5_000 },
          { label: "Above RM5K", min: 5_000, max: undefined },
        ]
      : [
          { label: "Under RM300K", min: 0, max: 300_000 },
          { label: "RM300K â€“ RM500K", min: 300_000, max: 500_000 },
          { label: "RM500K â€“ RM1M", min: 500_000, max: 1_000_000 },
          { label: "RM1M â€“ RM2M", min: 1_000_000, max: 2_000_000 },
          { label: "Above RM2M", min: 2_000_000, max: undefined },
        ];

  // Determine current selection label
  const currentLabel = useMemo(() => {
    if (!value) return undefined;
    const match = presets.find(
      (p) => p.min === value.min && p.max === value.max
    );
    return match?.label;
  }, [value, presets]);

  const serialised = currentLabel ?? (value ? "Custom" : "");

  return (
    <Select
      value={serialised}
      onValueChange={(v) => {
        if (v === "__all__") {
          onChange(undefined);
          return;
        }
        const preset = presets.find((p) => p.label === v);
        if (preset) {
          onChange({ min: preset.min, max: preset.max });
        }
      }}
      disabled={disabled}
    >
      <SelectTrigger className="h-8 text-sm">
        <SelectValue placeholder="Any price" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__all__">Any price</SelectItem>
        {presets.map((p) => (
          <SelectItem key={p.label} value={p.label}>
            {p.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

import { Checkbox } from "@/components/ui/checkbox";
import { FACILITY_LABELS } from "../constants";

function FacilitiesCheckboxGroup({
  value,
  onChange,
  disabled,
}: {
  value: string[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
}) {
  const toggleFacility = (facility: string) => {
    const next = value.includes(facility)
      ? value.filter((v) => v !== facility)
      : [...value, facility];
    onChange(next);
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Facilities</span>
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
        {Object.entries(FACILITY_LABELS).map(([key, label]) => (
          <label
            key={key}
            className="hover:bg-accent flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm"
          >
            <Checkbox
              checked={value.includes(key)}
              onCheckedChange={() => toggleFacility(key)}
              disabled={disabled}
            />
            <span>{label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

