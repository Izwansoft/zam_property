// verticals/real-estate/formatters.ts — Display formatters for Real Estate attributes
// All formatting is display-only; no data mutation.

import {
  PROPERTY_TYPE_LABELS,
  LISTING_TYPE_LABELS,
  TENURE_LABELS,
  FURNISHING_LABELS,
  FACING_LABELS,
  CONDITION_LABELS,
  RENTAL_PERIOD_LABELS,
  FACILITY_LABELS,
  AMENITY_LABELS,
  TITLE_TYPE_LABELS,
  OCCUPANCY_LABELS,
} from "./constants";

// ---------------------------------------------------------------------------
// Currency formatter (MYR)
// ---------------------------------------------------------------------------

const myrFormatter = new Intl.NumberFormat("en-MY", {
  style: "currency",
  currency: "MYR",
  maximumFractionDigits: 0,
});

/**
 * Format price in Malaysian Ringgit.
 * Adds "/month" suffix for rental listings.
 */
export function formatPrice(
  value: number,
  attributes?: Record<string, unknown>
): string {
  const formatted = myrFormatter.format(value);
  if (attributes?.listingType === "rent") {
    return `${formatted}/month`;
  }
  return formatted;
}

/**
 * Format compact price (e.g., RM300K, RM1.2M).
 */
export function formatCompactPrice(value: number): string {
  if (value >= 1_000_000) {
    const m = value / 1_000_000;
    return `RM${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`;
  }
  if (value >= 1_000) {
    const k = value / 1_000;
    return `RM${k % 1 === 0 ? k.toFixed(0) : k.toFixed(0)}K`;
  }
  return `RM${value.toLocaleString()}`;
}

// ---------------------------------------------------------------------------
// Size formatters
// ---------------------------------------------------------------------------

export function formatSize(value: number): string {
  return `${value.toLocaleString()} sq ft`;
}

// ---------------------------------------------------------------------------
// Room formatters
// ---------------------------------------------------------------------------

export function formatBedrooms(value: number): string {
  return `${value} bed${value !== 1 ? "s" : ""}`;
}

export function formatBathrooms(value: number): string {
  return `${value} bath${value !== 1 ? "s" : ""}`;
}

export function formatCarParks(value: number): string {
  return `${value} parking`;
}

// ---------------------------------------------------------------------------
// Enum formatters
// ---------------------------------------------------------------------------

export function formatPropertyType(value: string): string {
  return PROPERTY_TYPE_LABELS[value as keyof typeof PROPERTY_TYPE_LABELS] ?? value;
}

export function formatListingType(value: string): string {
  return LISTING_TYPE_LABELS[value as keyof typeof LISTING_TYPE_LABELS] ?? value;
}

export function formatTenure(value: string): string {
  return TENURE_LABELS[value as keyof typeof TENURE_LABELS] ?? value;
}

export function formatFurnishing(value: string): string {
  return FURNISHING_LABELS[value as keyof typeof FURNISHING_LABELS] ?? value;
}

export function formatFacing(value: string): string {
  return FACING_LABELS[value as keyof typeof FACING_LABELS] ?? value;
}

export function formatCondition(value: string): string {
  return CONDITION_LABELS[value as keyof typeof CONDITION_LABELS] ?? value;
}

export function formatRentalPeriod(value: string): string {
  return RENTAL_PERIOD_LABELS[value as keyof typeof RENTAL_PERIOD_LABELS] ?? value;
}

export function formatTitleType(value: string): string {
  return TITLE_TYPE_LABELS[value as keyof typeof TITLE_TYPE_LABELS] ?? value;
}

export function formatOccupancy(value: string): string {
  return OCCUPANCY_LABELS[value as keyof typeof OCCUPANCY_LABELS] ?? value;
}

export function formatMaintenanceFee(value: number): string {
  return `RM${value.toLocaleString()}/month`;
}

// ---------------------------------------------------------------------------
// Multi-select formatters
// ---------------------------------------------------------------------------

export function formatFacilities(values: string[]): string[] {
  return values.map((v) => FACILITY_LABELS[v] ?? v);
}

export function formatAmenities(values: string[]): string[] {
  return values.map((v) => AMENITY_LABELS[v] ?? v);
}

// ---------------------------------------------------------------------------
// Combined formatters object for vertical registration
// ---------------------------------------------------------------------------

export const realEstateFormatters: Record<string, (value: unknown, ctx?: Record<string, unknown>) => unknown> = {
  price: (v, ctx) => formatPrice(v as number, ctx),
  builtUpSize: (v) => formatSize(v as number),
  landSize: (v) => formatSize(v as number),
  bedrooms: (v) => formatBedrooms(v as number),
  bathrooms: (v) => formatBathrooms(v as number),
  carParks: (v) => formatCarParks(v as number),
  propertyType: (v) => formatPropertyType(v as string),
  listingType: (v) => formatListingType(v as string),
  tenure: (v) => formatTenure(v as string),
  furnishing: (v) => formatFurnishing(v as string),
  facing: (v) => formatFacing(v as string),
  condition: (v) => formatCondition(v as string),
  minimumRentalPeriod: (v) => formatRentalPeriod(v as string),
  titleType: (v) => formatTitleType(v as string),
  occupancy: (v) => formatOccupancy(v as string),
  maintenanceFee: (v) => formatMaintenanceFee(v as number),
  facilities: (v) => formatFacilities(v as string[]),
  nearbyAmenities: (v) => formatAmenities(v as string[]),
};
