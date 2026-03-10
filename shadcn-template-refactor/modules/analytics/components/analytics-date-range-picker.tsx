// =============================================================================
// AnalyticsDateRangePicker — Preset-driven date range picker for dashboards
// =============================================================================
// Provides quick presets (7d, 30d, 90d, 1y) plus a custom range picker.
// Uses the existing CalendarDateRangePicker under the hood for custom ranges.
// =============================================================================

"use client";

import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { format } from "date-fns";
import { useState } from "react";
import type { DateRange } from "react-day-picker";
import type { DateRangePreset } from "../types";
import { DATE_RANGE_PRESET_LABELS } from "../types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AnalyticsDateRangePickerProps {
  /** Current active preset */
  preset: DateRangePreset;
  /** Start date */
  startDate: Date;
  /** End date */
  endDate: Date;
  /** Called when a preset is selected */
  onPresetChange: (preset: DateRangePreset) => void;
  /** Called when a custom range is selected */
  onCustomRangeChange: (from: Date, to: Date) => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// Presets (excluding "custom" — handled via calendar)
// ---------------------------------------------------------------------------

const QUICK_PRESETS: DateRangePreset[] = ["7d", "30d", "90d", "1y"];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AnalyticsDateRangePicker({
  preset,
  startDate,
  endDate,
  onPresetChange,
  onCustomRangeChange,
  className,
}: AnalyticsDateRangePickerProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [tempRange, setTempRange] = useState<DateRange | undefined>({
    from: startDate,
    to: endDate,
  });

  const handlePresetChange = (value: string) => {
    if (value && value !== "custom") {
      onPresetChange(value as DateRangePreset);
    }
  };

  const handleCalendarSelect = (range: DateRange | undefined) => {
    setTempRange(range);
    if (range?.from && range?.to) {
      onCustomRangeChange(range.from, range.to);
      setCalendarOpen(false);
    }
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className ?? ""}`}>
      {/* Quick presets */}
      <ToggleGroup
        type="single"
        value={preset === "custom" ? "" : preset}
        onValueChange={handlePresetChange}
        size="sm"
      >
        {QUICK_PRESETS.map((p) => (
          <ToggleGroupItem key={p} value={p} aria-label={DATE_RANGE_PRESET_LABELS[p]}>
            {DATE_RANGE_PRESET_LABELS[p]}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      {/* Custom range picker */}
      <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={preset === "custom" ? "default" : "outline"}
            size="sm"
            className="gap-2"
          >
            <CalendarDays className="h-4 w-4" />
            {preset === "custom"
              ? `${format(startDate, "MMM d, yyyy")} – ${format(endDate, "MMM d, yyyy")}`
              : "Custom"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="range"
            selected={tempRange}
            onSelect={handleCalendarSelect}
            numberOfMonths={2}
            disabled={{ after: new Date() }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
