// verticals/filter-builder/querystring.ts — URL state sync for filters

import type { VerticalSearchMapping } from "../types";

/**
 * Active filter values map.
 * Keys are filter field keys, values are the applied filter value.
 */
export type FilterValues = Record<string, unknown>;

/**
 * Serialize filter values into URL search params.
 */
export function serializeFilters(
  filters: FilterValues,
  mapping: VerticalSearchMapping
): URLSearchParams {
  const params = new URLSearchParams();

  for (const field of mapping.filterableFields) {
    const paramName = field.paramName || field.key;
    const value = filters[field.key];

    if (value === undefined || value === null || value === "") continue;

    if (Array.isArray(value)) {
      // Multi-select: comma-separated
      if (value.length > 0) {
        params.set(paramName, value.join(","));
      }
    } else {
      params.set(paramName, String(value));
    }
  }

  // Serialize range fields
  for (const range of mapping.rangeFields) {
    const value = filters[range.key] as
      | { min?: number; max?: number }
      | undefined;
    if (!value) continue;

    const minParam = range.minParamName || `${range.key}_min`;
    const maxParam = range.maxParamName || `${range.key}_max`;

    if (value.min !== undefined) params.set(minParam, String(value.min));
    if (value.max !== undefined) params.set(maxParam, String(value.max));
  }

  return params;
}

/**
 * Deserialize URL search params into filter values.
 */
export function deserializeFilters(
  searchParams: URLSearchParams,
  mapping: VerticalSearchMapping
): FilterValues {
  const filters: FilterValues = {};

  for (const field of mapping.filterableFields) {
    const paramName = field.paramName || field.key;
    const raw = searchParams.get(paramName);

    if (!raw) continue;

    if (field.multiSelect || field.type === "array") {
      // Multi-select: split comma-separated
      filters[field.key] = raw.split(",").filter(Boolean);
    } else if (field.type === "number") {
      filters[field.key] = Number(raw);
    } else if (field.type === "boolean") {
      filters[field.key] = raw === "true";
    } else {
      filters[field.key] = raw;
    }
  }

  // Deserialize range fields
  for (const range of mapping.rangeFields) {
    const minParam = range.minParamName || `${range.key}_min`;
    const maxParam = range.maxParamName || `${range.key}_max`;
    const minRaw = searchParams.get(minParam);
    const maxRaw = searchParams.get(maxParam);

    if (minRaw || maxRaw) {
      filters[range.key] = {
        min: minRaw ? Number(minRaw) : undefined,
        max: maxRaw ? Number(maxRaw) : undefined,
      };
    }
  }

  return filters;
}

/**
 * Build API query params from filter values.
 * Used to pass to listing/search API hooks.
 */
export function buildApiParams(
  filters: FilterValues,
  mapping: VerticalSearchMapping
): Record<string, string | number | boolean | string[]> {
  const params: Record<string, string | number | boolean | string[]> = {};

  for (const field of mapping.filterableFields) {
    const paramName = field.paramName || field.key;
    const value = filters[field.key];

    if (value === undefined || value === null || value === "") continue;

    if (Array.isArray(value) && value.length > 0) {
      params[paramName] = value;
    } else if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      params[paramName] = value;
    }
  }

  // Range fields → separate min/max params
  for (const range of mapping.rangeFields) {
    const value = filters[range.key] as
      | { min?: number; max?: number }
      | undefined;
    if (!value) continue;

    const minParam = range.minParamName || `${range.key}_min`;
    const maxParam = range.maxParamName || `${range.key}_max`;

    if (value.min !== undefined) params[minParam] = value.min;
    if (value.max !== undefined) params[maxParam] = value.max;
  }

  return params;
}

/**
 * Count active filters.
 */
export function countActiveFilters(filters: FilterValues): number {
  let count = 0;
  for (const value of Object.values(filters)) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value) && value.length === 0) continue;
    if (
      typeof value === "object" &&
      !Array.isArray(value) &&
      value !== null
    ) {
      const range = value as { min?: number; max?: number };
      if (range.min === undefined && range.max === undefined) continue;
    }
    count++;
  }
  return count;
}
