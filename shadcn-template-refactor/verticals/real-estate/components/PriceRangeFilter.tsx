// verticals/real-estate/components/PriceRangeFilter.tsx
// Price range filter with sale/rent presets in MYR

"use client";

import { useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { SALE_PRICE_PRESETS, RENT_PRICE_PRESETS } from "../filters";

export interface PriceRange {
  min?: number;
  max?: number;
}

interface PriceRangeFilterProps {
  /** Current price range */
  value: PriceRange | undefined;
  /** Callback when range changes */
  onChange: (value: PriceRange | undefined) => void;
  /** Current listing type to show appropriate presets */
  listingType?: string;
  /** Whether the filter is disabled */
  disabled?: boolean;
  /** Compact layout (omits label) */
  compact?: boolean;
}

/**
 * MYR price range filter with preset ranges that adapt to sale vs rent.
 *
 * Sale presets: Under RM300K, RM300K–RM500K, RM500K–RM1M, RM1M–RM2M, Above RM2M
 * Rent presets: Under RM1,500, RM1,500–RM3,000, RM3,000–RM5,000, Above RM5,000
 */
export function PriceRangeFilter({
  value,
  onChange,
  listingType,
  disabled,
  compact,
}: PriceRangeFilterProps) {
  const current = value ?? {};
  const presets = useMemo(
    () => (listingType === "rent" ? RENT_PRICE_PRESETS : SALE_PRICE_PRESETS),
    [listingType]
  );

  const isPresetActive = useCallback(
    (preset: (typeof presets)[number]) => {
      return (
        current.min === preset.min &&
        (current.max === (preset.max ?? undefined) ||
          (preset.max === null && current.max === undefined))
      );
    },
    [current]
  );

  const handlePreset = (preset: (typeof presets)[number]) => {
    // Toggle off if clicking active preset
    if (isPresetActive(preset)) {
      onChange(undefined);
      return;
    }
    onChange({
      min: preset.min,
      max: preset.max ?? undefined,
    });
  };

  const handleMinChange = (raw: string) => {
    const min = raw === "" ? undefined : Number(raw);
    const next = { ...current, min };
    if (next.min === undefined && next.max === undefined) {
      onChange(undefined);
    } else {
      onChange(next);
    }
  };

  const handleMaxChange = (raw: string) => {
    const max = raw === "" ? undefined : Number(raw);
    const next = { ...current, max };
    if (next.min === undefined && next.max === undefined) {
      onChange(undefined);
    } else {
      onChange(next);
    }
  };

  const handleClear = () => onChange(undefined);

  return (
    <div className="space-y-2">
      {!compact && (
        <Label className="text-sm font-medium">
          Price Range ({listingType === "rent" ? "/month" : "MYR"})
        </Label>
      )}

      {/* Preset buttons */}
      <div className="flex flex-wrap gap-1.5">
        {presets.map((preset) => (
          <Button
            key={`${preset.min}-${preset.max}`}
            variant={isPresetActive(preset) ? "default" : "outline"}
            size="sm"
            className="h-7 text-xs"
            onClick={() => handlePreset(preset)}
            disabled={disabled}
          >
            {preset.label}
          </Button>
        ))}
      </div>

      {/* Custom min/max inputs */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <span className="text-muted-foreground absolute left-2 top-1/2 -translate-y-1/2 text-xs">
            RM
          </span>
          <Input
            type="number"
            placeholder="Min"
            value={current.min ?? ""}
            onChange={(e) => handleMinChange(e.target.value)}
            disabled={disabled}
            min={0}
            step={listingType === "rent" ? 100 : 10_000}
            className="h-8 pl-8 text-sm"
          />
        </div>
        <span className="text-muted-foreground text-xs">–</span>
        <div className="relative flex-1">
          <span className="text-muted-foreground absolute left-2 top-1/2 -translate-y-1/2 text-xs">
            RM
          </span>
          <Input
            type="number"
            placeholder="Max"
            value={current.max ?? ""}
            onChange={(e) => handleMaxChange(e.target.value)}
            disabled={disabled}
            min={0}
            step={listingType === "rent" ? 100 : 10_000}
            className="h-8 pl-8 text-sm"
          />
        </div>
      </div>

      {/* Clear */}
      {(current.min !== undefined || current.max !== undefined) && (
        <Button
          variant="ghost"
          size="sm"
          className={cn("h-6 text-xs", compact && "h-5")}
          onClick={handleClear}
          disabled={disabled}
        >
          Clear price
        </Button>
      )}
    </div>
  );
}
