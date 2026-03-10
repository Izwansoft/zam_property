// =============================================================================
// useAnalyticsDateRange — Stateful hook for analytics date range selection
// =============================================================================
// Manages date range state with preset support (7d, 30d, 90d, 1y, custom).
// Default: last 30 days.
// =============================================================================

"use client";

import { useState, useMemo, useCallback } from "react";
import { subDays, subMonths, subYears, startOfDay, format } from "date-fns";
import type { AnalyticsDateRange, DateRangePreset } from "../types";

/**
 * Get start date for a given preset relative to today.
 */
function getPresetStartDate(preset: DateRangePreset): Date {
  const now = startOfDay(new Date());
  switch (preset) {
    case "7d":
      return subDays(now, 7);
    case "30d":
      return subDays(now, 30);
    case "90d":
      return subDays(now, 90);
    case "1y":
      return subYears(now, 1);
    case "custom":
      return subMonths(now, 1); // Default fallback for custom
  }
}

export interface UseAnalyticsDateRangeReturn {
  /** Current preset */
  preset: DateRangePreset;
  /** Current date range as ISO strings */
  dateRange: AnalyticsDateRange;
  /** Start date as Date object */
  startDate: Date;
  /** End date as Date object */
  endDate: Date;
  /** Set a preset and compute dates automatically */
  setPreset: (preset: DateRangePreset) => void;
  /** Set a custom date range */
  setCustomRange: (from: Date, to: Date) => void;
}

/**
 * Stateful hook for managing analytics date range selection.
 * Default: last 30 days.
 *
 * @example
 * ```tsx
 * const { dateRange, preset, setPreset, setCustomRange } = useAnalyticsDateRange();
 * const { data } = usePartnerAnalytics(dateRange);
 * ```
 */
export function useAnalyticsDateRange(
  defaultPreset: DateRangePreset = "30d"
): UseAnalyticsDateRangeReturn {
  const [preset, setPresetState] = useState<DateRangePreset>(defaultPreset);
  const [customFrom, setCustomFrom] = useState<Date | null>(null);
  const [customTo, setCustomTo] = useState<Date | null>(null);

  const startDate = useMemo(() => {
    if (preset === "custom" && customFrom) return customFrom;
    return getPresetStartDate(preset);
  }, [preset, customFrom]);

  const endDate = useMemo(() => {
    if (preset === "custom" && customTo) return customTo;
    return startOfDay(new Date());
  }, [preset, customTo]);

  const dateRange = useMemo<AnalyticsDateRange>(
    () => ({
      startDate: format(startDate, "yyyy-MM-dd"),
      endDate: format(endDate, "yyyy-MM-dd"),
    }),
    [startDate, endDate]
  );

  const setPreset = useCallback((newPreset: DateRangePreset) => {
    setPresetState(newPreset);
    if (newPreset !== "custom") {
      setCustomFrom(null);
      setCustomTo(null);
    }
  }, []);

  const setCustomRange = useCallback((from: Date, to: Date) => {
    setPresetState("custom");
    setCustomFrom(startOfDay(from));
    setCustomTo(startOfDay(to));
  }, []);

  return {
    preset,
    dateRange,
    startDate,
    endDate,
    setPreset,
    setCustomRange,
  };
}
