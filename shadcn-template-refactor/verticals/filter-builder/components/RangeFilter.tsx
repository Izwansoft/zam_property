// verticals/filter-builder/components/RangeFilter.tsx — Range (min-max) filter

"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { RangeField, RangePreset } from "../../types";

interface RangeFilterProps {
  field: RangeField;
  value: { min?: number; max?: number } | undefined;
  onChange: (value: { min?: number; max?: number } | undefined) => void;
  disabled?: boolean;
}

export function RangeFilter({
  field,
  value,
  onChange,
  disabled,
}: RangeFilterProps) {
  const current = value ?? {};

  const handlePreset = (preset: RangePreset) => {
    onChange({
      min: preset.min,
      max: preset.max ?? undefined,
    });
  };

  const handleClear = () => onChange(undefined);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{field.label}</label>

      {/* Presets */}
      {field.presets && field.presets.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {field.presets.map((preset) => {
            const isActive =
              current.min === preset.min &&
              (current.max === preset.max ||
                (preset.max === null && current.max === undefined));

            return (
              <Button
                key={`${preset.min}-${preset.max}`}
                variant={isActive ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs"
                onClick={() => handlePreset(preset)}
                disabled={disabled}
              >
                {preset.label}
              </Button>
            );
          })}
        </div>
      )}

      {/* Min/Max inputs */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          {field.unit && field.unitPosition === "prefix" && (
            <span className="text-muted-foreground absolute left-2 top-1/2 -translate-y-1/2 text-xs">
              {field.unit}
            </span>
          )}
          <Input
            type="number"
            placeholder="Min"
            value={current.min ?? ""}
            onChange={(e) =>
              onChange({
                ...current,
                min:
                  e.target.value === "" ? undefined : Number(e.target.value),
              })
            }
            disabled={disabled}
            min={field.min}
            max={field.max}
            step={field.step}
            className={`h-8 text-sm ${field.unit && field.unitPosition === "prefix" ? "pl-8" : ""}`}
          />
        </div>
        <span className="text-muted-foreground text-xs">–</span>
        <div className="relative flex-1">
          <Input
            type="number"
            placeholder="Max"
            value={current.max ?? ""}
            onChange={(e) =>
              onChange({
                ...current,
                max:
                  e.target.value === "" ? undefined : Number(e.target.value),
              })
            }
            disabled={disabled}
            min={field.min}
            max={field.max}
            step={field.step}
            className="h-8 text-sm"
          />
          {field.unit && field.unitPosition !== "prefix" && (
            <span className="text-muted-foreground absolute right-2 top-1/2 -translate-y-1/2 text-xs">
              {field.unit}
            </span>
          )}
        </div>
      </div>

      {/* Clear */}
      {(current.min !== undefined || current.max !== undefined) && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-xs"
          onClick={handleClear}
          disabled={disabled}
        >
          Clear range
        </Button>
      )}
    </div>
  );
}
