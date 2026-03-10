// verticals/real-estate/filters.ts — Real Estate filter configuration
// Defines filterable fields, sortable fields, range fields, and facet fields
// aligned with the VerticalSearchMapping type from verticals/types/search.ts

import type { VerticalSearchMapping } from "../types";
import { PROPERTY_TYPE_LABELS, LISTING_TYPE_LABELS, TENURE_LABELS, FURNISHING_LABELS, CONDITION_LABELS, FACILITY_LABELS } from "./constants";

// ---------------------------------------------------------------------------
// Price presets — MYR (Malaysian Ringgit)
// ---------------------------------------------------------------------------

export const SALE_PRICE_PRESETS = [
  { label: "Under RM300K", min: 0, max: 300_000 },
  { label: "RM300K – RM500K", min: 300_000, max: 500_000 },
  { label: "RM500K – RM1M", min: 500_000, max: 1_000_000 },
  { label: "RM1M – RM2M", min: 1_000_000, max: 2_000_000 },
  { label: "Above RM2M", min: 2_000_000, max: null },
] as const;

export const RENT_PRICE_PRESETS = [
  { label: "Under RM1,500", min: 0, max: 1_500 },
  { label: "RM1,500 – RM3,000", min: 1_500, max: 3_000 },
  { label: "RM3,000 – RM5,000", min: 3_000, max: 5_000 },
  { label: "Above RM5,000", min: 5_000, max: null },
] as const;

// ---------------------------------------------------------------------------
// Bedroom / Bathroom options
// ---------------------------------------------------------------------------

export const BEDROOM_OPTIONS = [
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4", label: "4" },
  { value: "5+", label: "5+" },
] as const;

export const BATHROOM_OPTIONS = [
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3+", label: "3+" },
] as const;

// ---------------------------------------------------------------------------
// Full search mapping configuration
// ---------------------------------------------------------------------------

export const realEstateSearchMapping: VerticalSearchMapping = {
  filterableFields: [
    {
      key: "propertyType",
      label: "Property Type",
      type: "enum",
      multiSelect: true,
      options: Object.entries(PROPERTY_TYPE_LABELS).map(([value, label]) => ({
        value,
        label,
      })),
      order: 1,
      group: "basic",
    },
    {
      key: "listingType",
      label: "For",
      type: "enum",
      options: Object.entries(LISTING_TYPE_LABELS).map(([value, label]) => ({
        value,
        label,
      })),
      order: 2,
      group: "basic",
    },
    {
      key: "bedrooms",
      label: "Bedrooms",
      type: "number",
      options: [...BEDROOM_OPTIONS],
      order: 4,
      group: "rooms",
    },
    {
      key: "bathrooms",
      label: "Bathrooms",
      type: "number",
      options: [...BATHROOM_OPTIONS],
      order: 5,
      group: "rooms",
    },
    {
      key: "furnishing",
      label: "Furnishing",
      type: "enum",
      options: Object.entries(FURNISHING_LABELS).map(([value, label]) => ({
        value,
        label,
      })),
      order: 6,
      group: "details",
    },
    {
      key: "tenure",
      label: "Tenure",
      type: "enum",
      options: Object.entries(TENURE_LABELS).map(([value, label]) => ({
        value,
        label,
      })),
      order: 7,
      group: "details",
    },
    {
      key: "condition",
      label: "Condition",
      type: "enum",
      options: Object.entries(CONDITION_LABELS).map(([value, label]) => ({
        value,
        label,
      })),
      order: 8,
      group: "details",
    },
    {
      key: "facilities",
      label: "Facilities",
      type: "array",
      multiSelect: true,
      options: Object.entries(FACILITY_LABELS).map(([value, label]) => ({
        value,
        label,
      })),
      order: 9,
      group: "facilities",
    },
  ],

  sortableFields: [
    { key: "price", label: "Price", defaultDirection: "asc" },
    { key: "createdAt", label: "Newest", defaultDirection: "desc" },
    { key: "updatedAt", label: "Recently Updated", defaultDirection: "desc" },
    { key: "builtUpSize", label: "Size", defaultDirection: "desc" },
    { key: "bedrooms", label: "Bedrooms", defaultDirection: "desc" },
  ],

  rangeFields: [
    {
      key: "price",
      label: "Price Range",
      min: 0,
      max: 10_000_000,
      step: 10_000,
      unit: "RM",
      unitPosition: "prefix",
      presets: [...SALE_PRICE_PRESETS],
      minParamName: "price_min",
      maxParamName: "price_max",
      order: 1,
    },
    {
      key: "builtUpSize",
      label: "Built-up Size",
      min: 0,
      max: 10_000,
      step: 100,
      unit: "sq ft",
      unitPosition: "suffix",
      presets: [
        { label: "Under 500", min: 0, max: 500 },
        { label: "500 – 1,000", min: 500, max: 1_000 },
        { label: "1,000 – 2,000", min: 1_000, max: 2_000 },
        { label: "2,000 – 5,000", min: 2_000, max: 5_000 },
        { label: "Above 5,000", min: 5_000, max: null },
      ],
      minParamName: "builtUpSize_min",
      maxParamName: "builtUpSize_max",
      order: 2,
    },
    {
      key: "landSize",
      label: "Land Size",
      min: 0,
      max: 100_000,
      step: 500,
      unit: "sq ft",
      unitPosition: "suffix",
      presets: [
        { label: "Under 3,000", min: 0, max: 3_000 },
        { label: "3,000 – 5,000", min: 3_000, max: 5_000 },
        { label: "5,000 – 10,000", min: 5_000, max: 10_000 },
        { label: "Above 10,000", min: 10_000, max: null },
      ],
      minParamName: "landSize_min",
      maxParamName: "landSize_max",
      order: 3,
    },
  ],

  facetFields: [
    {
      key: "propertyType",
      label: "Property Type",
      order: 1,
      maxValues: 16,
      showCounts: true,
    },
    {
      key: "listingType",
      label: "Listing Type",
      order: 2,
      maxValues: 2,
      showCounts: true,
    },
    {
      key: "furnishing",
      label: "Furnishing",
      order: 3,
      maxValues: 3,
      showCounts: true,
    },
    {
      key: "tenure",
      label: "Tenure",
      order: 4,
      maxValues: 4,
      showCounts: true,
    },
  ],
};

/**
 * Get price presets based on listing type.
 */
export function getPricePresets(listingType?: string) {
  if (listingType === "rent") {
    return [...RENT_PRICE_PRESETS];
  }
  return [...SALE_PRICE_PRESETS];
}

/**
 * Re-export the filter config array format for backward compatibility.
 */
export const realEstateFilters = realEstateSearchMapping;
