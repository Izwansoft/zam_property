// verticals/types/search.ts — Search mapping type definitions

import type { AttributeOption, AttributeType } from "./attributes";

/**
 * Search mapping metadata for a vertical.
 * Describes which fields can be filtered, sorted, and faceted.
 * This is the `searchMapping` field of VerticalDefinition.
 */
export interface VerticalSearchMapping {
  /** Fields that can be used as filters */
  filterableFields: FilterableField[];
  /** Fields that can be used for sorting */
  sortableFields: SortableField[];
  /** Fields with range filter support */
  rangeFields: RangeField[];
  /** Fields with facet (count) support */
  facetFields: FacetField[];
}

/**
 * A field that can be filtered in search.
 */
export interface FilterableField {
  /** Attribute key */
  key: string;
  /** Display label */
  label: string;
  /** Data type for filter input rendering */
  type: AttributeType;
  /** For enum types: the allowed values */
  options?: AttributeOption[];
  /** Whether this filter supports multiple selections */
  multiSelect?: boolean;
  /** URL search param name (defaults to key) */
  paramName?: string;
  /** Display order in filter panel */
  order: number;
  /** Group in filter panel */
  group?: string;
}

/**
 * A field that can be sorted in search results.
 */
export interface SortableField {
  /** Attribute key */
  key: string;
  /** Display label */
  label: string;
  /** Default sort direction */
  defaultDirection: "asc" | "desc";
}

/**
 * A field that supports range filtering (min/max).
 */
export interface RangeField {
  /** Attribute key */
  key: string;
  /** Display label */
  label: string;
  /** Minimum bound */
  min: number;
  /** Maximum bound */
  max: number;
  /** Step increment for slider */
  step: number;
  /** Unit label (e.g. "RM", "sq ft") */
  unit?: string;
  /** Unit position */
  unitPosition?: "prefix" | "suffix";
  /** Preset ranges for quick selection */
  presets?: RangePreset[];
  /** URL param name for min value */
  minParamName?: string;
  /** URL param name for max value */
  maxParamName?: string;
  /** Display order */
  order: number;
}

/**
 * A preset range value for quick selection.
 */
export interface RangePreset {
  label: string;
  min: number;
  max: number | null; // null = no upper bound
}

/**
 * A field that supports faceted counts in search.
 */
export interface FacetField {
  /** Attribute key */
  key: string;
  /** Display label */
  label: string;
  /** Display order */
  order: number;
  /** Maximum number of facet values to show */
  maxValues?: number;
  /** Whether to show counts */
  showCounts?: boolean;
  /** Icon for each value (optional) */
  valueIcons?: Record<string, string>;
}
