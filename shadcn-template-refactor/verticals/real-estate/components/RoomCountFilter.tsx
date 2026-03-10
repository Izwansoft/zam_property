// verticals/real-estate/components/RoomCountFilter.tsx
// Bedroom and bathroom count filters with toggle-group style buttons

"use client";

import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Bed, Bath } from "lucide-react";
import { cn } from "@/lib/utils";

export interface RoomCountValues {
  bedrooms?: string;
  bathrooms?: string;
}

interface RoomCountFilterProps {
  /** Current room count selections */
  value: RoomCountValues;
  /** Callback when selections change */
  onChange: (value: RoomCountValues) => void;
  /** Whether the filter is disabled */
  disabled?: boolean;
  /** Compact layout (stacks vertically, omits icons) */
  compact?: boolean;
  /** Show only bedrooms */
  bedroomsOnly?: boolean;
}

const BEDROOM_CHOICES = ["1", "2", "3", "4", "5+"] as const;
const BATHROOM_CHOICES = ["1", "2", "3+"] as const;

/**
 * Room count filter with toggle-group buttons for bedrooms and bathrooms.
 * Selecting a value again deselects it (returns to "Any").
 */
export function RoomCountFilter({
  value,
  onChange,
  disabled,
  compact,
  bedroomsOnly,
}: RoomCountFilterProps) {
  const handleBedroomsChange = (selected: string) => {
    onChange({
      ...value,
      bedrooms: selected === value.bedrooms ? undefined : selected || undefined,
    });
  };

  const handleBathroomsChange = (selected: string) => {
    onChange({
      ...value,
      bathrooms:
        selected === value.bathrooms ? undefined : selected || undefined,
    });
  };

  return (
    <div className={cn("space-y-3", compact && "space-y-2")}>
      {/* Bedrooms */}
      <div className="space-y-1.5">
        <Label className="flex items-center gap-1.5 text-sm font-medium">
          {!compact && <Bed className="h-3.5 w-3.5" />}
          Bedrooms
        </Label>
        <ToggleGroup
          type="single"
          value={value.bedrooms ?? ""}
          onValueChange={handleBedroomsChange}
          disabled={disabled}
          className="justify-start"
        >
          {BEDROOM_CHOICES.map((choice) => (
            <ToggleGroupItem
              key={choice}
              value={choice}
              size="sm"
              className={cn(
                "h-8 min-w-9 px-3 text-xs",
                compact && "h-7 min-w-8 px-2"
              )}
            >
              {choice}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {/* Bathrooms */}
      {!bedroomsOnly && (
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5 text-sm font-medium">
            {!compact && <Bath className="h-3.5 w-3.5" />}
            Bathrooms
          </Label>
          <ToggleGroup
            type="single"
            value={value.bathrooms ?? ""}
            onValueChange={handleBathroomsChange}
            disabled={disabled}
            className="justify-start"
          >
            {BATHROOM_CHOICES.map((choice) => (
              <ToggleGroupItem
                key={choice}
                value={choice}
                size="sm"
                className={cn(
                  "h-8 min-w-9 px-3 text-xs",
                  compact && "h-7 min-w-8 px-2"
                )}
              >
                {choice}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      )}
    </div>
  );
}

