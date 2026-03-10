// =============================================================================
// SearchFilters — Sheet-based filter panel with facets
// =============================================================================

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Filter, X, Home, Key } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

import type { SearchParams, FacetOption } from "../types";
import type { FormattedFacets } from "../hooks/use-search-facets";
import { countActiveFilters, formatCurrency } from "../utils";

// ---------------------------------------------------------------------------
// Price range config per listing type
// ---------------------------------------------------------------------------

function getPriceConfig(listingType?: string) {
  if (listingType === "rent") {
    return { min: 0, max: 10_000, step: 100, label: "/mo" };
  }
  return { min: 0, max: 10_000_000, step: 50_000, label: "" };
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface SearchFiltersProps {
  params: SearchParams;
  facets: FormattedFacets;
  onParamsChange: (newParams: Partial<SearchParams>) => void;
  onClear: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SearchFilters({
  params,
  facets,
  onParamsChange,
  onClear,
}: SearchFiltersProps) {
  const activeCount = countActiveFilters(params);

  // Price range config based on listing type
  const priceConfig = useMemo(
    () => getPriceConfig(params.listingType),
    [params.listingType],
  );

  // Local slider state for smooth dragging (no API call per pixel)
  const [localPrice, setLocalPrice] = useState<[number, number]>([
    params.priceMin || priceConfig.min,
    params.priceMax || priceConfig.max,
  ]);

  // Sync local state when URL params or listing type change
  useEffect(() => {
    setLocalPrice([
      params.priceMin || priceConfig.min,
      params.priceMax || priceConfig.max,
    ]);
  }, [params.priceMin, params.priceMax, priceConfig.min, priceConfig.max]);

  const handlePriceSlide = useCallback(
    (values: number[]) => {
      setLocalPrice([values[0], values[1]]);
    },
    [],
  );

  const handlePriceCommit = useCallback(
    (values: number[]) => {
      setLocalPrice([values[0], values[1]]);
      onParamsChange({
        priceMin: values[0] || undefined,
        priceMax: values[1] || undefined,
        page: 1,
      });
    },
    [onParamsChange],
  );

  const handleVerticalToggle = useCallback(
    (value: string, checked: boolean) => {
      onParamsChange({
        verticalType: checked ? value : undefined,
        page: 1,
      });
    },
    [onParamsChange],
  );

  const handleCityToggle = useCallback(
    (value: string, checked: boolean) => {
      onParamsChange({
        city: checked ? value : undefined,
        page: 1,
      });
    },
    [onParamsChange],
  );

  const handleAttributeToggle = useCallback(
    (key: string, value: string | number, checked: boolean) => {
      const updated = { ...params.attributes };
      if (checked) {
        updated[key] = { eq: value };
      } else {
        delete updated[key];
      }
      onParamsChange({
        attributes: updated,
        page: 1,
      });
    },
    [onParamsChange, params.attributes],
  );

  const handleListingTypeChange = useCallback(
    (value: string) => {
      // Also update attributes to keep UI in sync
      const updatedAttrs = { ...params.attributes };
      if (value) {
        updatedAttrs.listingType = { eq: value };
      } else {
        delete updatedAttrs.listingType;
      }
      // Reset price range when switching listing type (different ranges)
      onParamsChange({
        listingType: value || undefined,
        attributes: updatedAttrs,
        priceMin: undefined,
        priceMax: undefined,
        page: 1,
      });
      // Reset local price to new range defaults
      const newConfig = getPriceConfig(value || undefined);
      setLocalPrice([newConfig.min, newConfig.max]);
    },
    [onParamsChange, params.attributes],
  );

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          Filters
          {activeCount > 0 && (
            <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
              {activeCount}
            </span>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="w-80 overflow-y-auto">
        <SheetHeader className="flex flex-row items-center justify-between">
          <SheetTitle>Filters</SheetTitle>
          {activeCount > 0 && (
            <Button variant="ghost" size="sm" onClick={onClear}>
              <X className="mr-1 h-4 w-4" />
              Clear all
            </Button>
          )}
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Buy / Rent Toggle */}
          <ListingTypeToggle
            value={params.listingType}
            onChange={handleListingTypeChange}
          />

          <Separator />

          {/* Price Range */}
          <FilterSection title={`Price Range${priceConfig.label ? " " + priceConfig.label : ""}`}>
            <div className="space-y-4">
              <Slider
                min={priceConfig.min}
                max={priceConfig.max}
                step={priceConfig.step}
                value={localPrice}
                onValueChange={handlePriceSlide}
                onValueCommit={handlePriceCommit}
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{formatCurrency(localPrice[0])}{priceConfig.label}</span>
                <span>{formatCurrency(localPrice[1])}{priceConfig.label}</span>
              </div>
            </div>
          </FilterSection>

          <Separator />

          {/* Vertical Type / Category */}
          {facets.verticalTypes.length > 0 && (
            <>
              <FilterSection title="Category">
                <FacetList
                  facets={facets.verticalTypes}
                  selected={params.verticalType}
                  onToggle={handleVerticalToggle}
                />
              </FilterSection>
              <Separator />
            </>
          )}

          {/* Cities */}
          {facets.cities.length > 0 && (
            <>
              <FilterSection title="City">
                <FacetList
                  facets={facets.cities}
                  selected={params.city}
                  onToggle={handleCityToggle}
                />
              </FilterSection>
              <Separator />
            </>
          )}

          {/* Property Type (Real Estate) */}
          {facets.propertyTypes.length > 0 && (
            <>
              <FilterSection title="Property Type">
                <FacetList
                  facets={facets.propertyTypes}
                  selected={
                    params.attributes?.propertyType?.eq as string | undefined
                  }
                  onToggle={(value, checked) =>
                    handleAttributeToggle("propertyType", value, checked)
                  }
                />
              </FilterSection>
              <Separator />
            </>
          )}

          {/* Bedrooms (Real Estate) */}
          {facets.bedrooms.length > 0 && (
            <>
              <FilterSection title="Bedrooms">
                <FacetList
                  facets={facets.bedrooms}
                  selected={params.attributes?.bedrooms?.eq?.toString()}
                  onToggle={(value, checked) =>
                    handleAttributeToggle("bedrooms", parseInt(value), checked)
                  }
                />
              </FilterSection>
              <Separator />
            </>
          )}

          {/* Furnishing (Real Estate) */}
          {facets.furnishing.length > 0 && (
            <FilterSection title="Furnishing">
              <FacetList
                facets={facets.furnishing}
                selected={
                  params.attributes?.furnishing?.eq as string | undefined
                }
                onToggle={(value, checked) =>
                  handleAttributeToggle("furnishing", value, checked)
                }
              />
            </FilterSection>
          )}

          {/* Featured Only */}
          <Separator />
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
            <Checkbox
              checked={!!params.featuredOnly}
              onCheckedChange={(checked) =>
                onParamsChange({ featuredOnly: !!checked || undefined, page: 1 })
              }
            />
            Featured listings only
          </label>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ---------------------------------------------------------------------------
// Sidebar variant (desktop) — inline filter panel
// ---------------------------------------------------------------------------

export function SearchFiltersSidebar({
  params,
  facets,
  onParamsChange,
  onClear,
}: SearchFiltersProps) {
  const activeCount = countActiveFilters(params);

  // Price range config based on listing type
  const priceConfig = useMemo(
    () => getPriceConfig(params.listingType),
    [params.listingType],
  );

  // Local slider state for smooth dragging (no API call per pixel)
  const [localPrice, setLocalPrice] = useState<[number, number]>([
    params.priceMin || priceConfig.min,
    params.priceMax || priceConfig.max,
  ]);

  // Sync local state when URL params or listing type change
  useEffect(() => {
    setLocalPrice([
      params.priceMin || priceConfig.min,
      params.priceMax || priceConfig.max,
    ]);
  }, [params.priceMin, params.priceMax, priceConfig.min, priceConfig.max]);

  const handlePriceSlide = useCallback(
    (values: number[]) => {
      setLocalPrice([values[0], values[1]]);
    },
    [],
  );

  const handlePriceCommit = useCallback(
    (values: number[]) => {
      setLocalPrice([values[0], values[1]]);
      onParamsChange({
        priceMin: values[0] || undefined,
        priceMax: values[1] || undefined,
        page: 1,
      });
    },
    [onParamsChange],
  );

  const handleVerticalToggle = useCallback(
    (value: string, checked: boolean) => {
      onParamsChange({
        verticalType: checked ? value : undefined,
        page: 1,
      });
    },
    [onParamsChange],
  );

  const handleCityToggle = useCallback(
    (value: string, checked: boolean) => {
      onParamsChange({
        city: checked ? value : undefined,
        page: 1,
      });
    },
    [onParamsChange],
  );

  const handleAttributeToggle = useCallback(
    (key: string, value: string | number, checked: boolean) => {
      const updated = { ...params.attributes };
      if (checked) {
        updated[key] = { eq: value };
      } else {
        delete updated[key];
      }
      onParamsChange({
        attributes: updated,
        page: 1,
      });
    },
    [onParamsChange, params.attributes],
  );

  const handleListingTypeChange = useCallback(
    (value: string) => {
      const updatedAttrs = { ...params.attributes };
      if (value) {
        updatedAttrs.listingType = { eq: value };
      } else {
        delete updatedAttrs.listingType;
      }
      // Reset price range when switching listing type
      onParamsChange({
        listingType: value || undefined,
        attributes: updatedAttrs,
        priceMin: undefined,
        priceMax: undefined,
        page: 1,
      });
      const newConfig = getPriceConfig(value || undefined);
      setLocalPrice([newConfig.min, newConfig.max]);
    },
    [onParamsChange, params.attributes],
  );

  return (
    <aside className="hidden w-64 shrink-0 lg:block">
      <div className="sticky top-24 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-semibold">
            <Filter className="h-4 w-4" />
            Filters
            {activeCount > 0 && (
              <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                {activeCount}
              </span>
            )}
          </h2>
          {activeCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="h-auto p-1 text-xs"
            >
              Clear all
            </Button>
          )}
        </div>

        {/* Buy / Rent Toggle */}
        <ListingTypeToggle
          value={params.listingType}
          onChange={handleListingTypeChange}
        />

        {/* Price Range */}
        <FilterSection title={`Price Range${priceConfig.label ? " " + priceConfig.label : ""}`}>
          <div className="space-y-4">
            <Slider
              min={priceConfig.min}
              max={priceConfig.max}
              step={priceConfig.step}
              value={localPrice}
              onValueChange={handlePriceSlide}
              onValueCommit={handlePriceCommit}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatCurrency(localPrice[0])}{priceConfig.label}</span>
              <span>{formatCurrency(localPrice[1])}{priceConfig.label}</span>
            </div>
          </div>
        </FilterSection>

        {/* Vertical Type */}
        {facets.verticalTypes.length > 0 && (
          <FilterSection title="Category">
            <FacetList
              facets={facets.verticalTypes}
              selected={params.verticalType}
              onToggle={handleVerticalToggle}
            />
          </FilterSection>
        )}

        {/* Cities */}
        {facets.cities.length > 0 && (
          <FilterSection title="City">
            <FacetList
              facets={facets.cities}
              selected={params.city}
              onToggle={handleCityToggle}
            />
          </FilterSection>
        )}

        {/* Property Type */}
        {facets.propertyTypes.length > 0 && (
          <FilterSection title="Property Type">
            <FacetList
              facets={facets.propertyTypes}
              selected={
                params.attributes?.propertyType?.eq as string | undefined
              }
              onToggle={(value, checked) =>
                handleAttributeToggle("propertyType", value, checked)
              }
            />
          </FilterSection>
        )}

        {/* Bedrooms */}
        {facets.bedrooms.length > 0 && (
          <FilterSection title="Bedrooms">
            <FacetList
              facets={facets.bedrooms}
              selected={params.attributes?.bedrooms?.eq?.toString()}
              onToggle={(value, checked) =>
                handleAttributeToggle("bedrooms", parseInt(value), checked)
              }
            />
          </FilterSection>
        )}

        {/* Featured */}
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <Checkbox
            checked={!!params.featuredOnly}
            onCheckedChange={(checked) =>
              onParamsChange({ featuredOnly: !!checked || undefined, page: 1 })
            }
          />
          Featured only
        </label>
      </div>
    </aside>
  );
}

// ---------------------------------------------------------------------------
// Shared sub-components
// ---------------------------------------------------------------------------

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium">{title}</h3>
      {children}
    </div>
  );
}

function FacetList({
  facets,
  selected,
  onToggle,
}: {
  facets: FacetOption[];
  selected?: string;
  onToggle: (value: string, checked: boolean) => void;
}) {
  return (
    <div className="space-y-2">
      {facets.map((facet) => (
        <label
          key={facet.value}
          className="flex cursor-pointer items-center gap-2"
        >
          <Checkbox
            checked={selected === facet.value}
            onCheckedChange={(checked) => onToggle(facet.value, !!checked)}
          />
          <span className="flex-1 text-sm">{facet.label}</span>
          <span className="text-xs text-muted-foreground">({facet.count})</span>
        </label>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ListingTypeToggle — Buy / Rent segmented control
// ---------------------------------------------------------------------------

function ListingTypeToggle({
  value,
  onChange,
}: {
  value?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">Listing Type</h3>
      <ToggleGroup
        type="single"
        value={value || ""}
        onValueChange={onChange}
        className="grid w-full grid-cols-3 gap-1 rounded-lg border bg-muted/50 p-1"
      >
        <ToggleGroupItem
          value=""
          className="rounded-md text-xs font-medium data-[state=on]:bg-background data-[state=on]:shadow-sm"
        >
          All
        </ToggleGroupItem>
        <ToggleGroupItem
          value="sale"
          className="gap-1 rounded-md text-xs font-medium data-[state=on]:bg-blue-600 data-[state=on]:text-white"
        >
          <Home className="h-3 w-3" />
          Buy
        </ToggleGroupItem>
        <ToggleGroupItem
          value="rent"
          className="gap-1 rounded-md text-xs font-medium data-[state=on]:bg-emerald-600 data-[state=on]:text-white"
        >
          <Key className="h-3 w-3" />
          Rent
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}
