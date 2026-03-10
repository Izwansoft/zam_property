// =============================================================================
// Listing Form Types — Shared form state and step definitions
// =============================================================================

import type { ListingLocation, PriceType, VerticalType } from "../../types";

// ---------------------------------------------------------------------------
// Step definitions
// ---------------------------------------------------------------------------

export const LISTING_FORM_STEPS = [
  { id: 1, label: "Vertical", description: "Select property type" },
  { id: 2, label: "Details", description: "Core listing information" },
  { id: 3, label: "Attributes", description: "Vertical-specific fields" },
  { id: 4, label: "Media", description: "Photos and documents" },
  { id: 5, label: "Review", description: "Review and save" },
] as const;

export type StepId = (typeof LISTING_FORM_STEPS)[number]["id"];

// ---------------------------------------------------------------------------
// Form data shape (accumulated across all steps)
// ---------------------------------------------------------------------------

export interface ListingFormData {
  // Step 1: Vertical
  verticalType: string;
  schemaVersion: string;

  // Step 2: Core fields
  title: string;
  description: string;
  price: number | undefined;
  currency: string;
  priceType: PriceType;
  location: {
    address: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };

  // Step 3: Attributes (placeholder — dynamic per vertical)
  attributes: Record<string, unknown>;

  // Step 4: Media (placeholder — handled in Session 2.9)
  mediaIds: string[];
}

// ---------------------------------------------------------------------------
// Default form values
// ---------------------------------------------------------------------------

export const DEFAULT_LISTING_FORM_DATA: ListingFormData = {
  verticalType: "",
  schemaVersion: "1.0",
  title: "",
  description: "",
  price: undefined,
  currency: "MYR",
  priceType: "FIXED",
  location: {
    address: "",
    city: "",
    state: "",
    country: "MY",
    postalCode: "",
  },
  attributes: {},
  mediaIds: [],
};

// ---------------------------------------------------------------------------
// Vertical type options (will come from registry in Session 3.4)
// ---------------------------------------------------------------------------

export interface VerticalOption {
  value: string;
  label: string;
  description: string;
  icon: string;
}

export const VERTICAL_OPTIONS: VerticalOption[] = [
  {
    value: "REAL_ESTATE",
    label: "Real Estate",
    description:
      "Residential and commercial properties — condos, houses, land, offices",
    icon: "🏠",
  },
  {
    value: "AUTOMOTIVE",
    label: "Automotive",
    description:
      "Cars, motorcycles, and commercial vehicles for sale",
    icon: "🚗",
  },
  // Future verticals will be added here or fetched from registry
];

// ---------------------------------------------------------------------------
// Price type options
// ---------------------------------------------------------------------------

export const PRICE_TYPE_OPTIONS = [
  { value: "FIXED", label: "Fixed Price" },
  { value: "NEGOTIABLE", label: "Negotiable" },
  { value: "STARTING_FROM", label: "Starting From" },
  { value: "UPON_REQUEST", label: "Price Upon Request" },
];

// ---------------------------------------------------------------------------
// Malaysian states
// ---------------------------------------------------------------------------

export const MALAYSIAN_STATES = [
  { value: "Johor", label: "Johor" },
  { value: "Kedah", label: "Kedah" },
  { value: "Kelantan", label: "Kelantan" },
  { value: "Kuala Lumpur", label: "Kuala Lumpur" },
  { value: "Labuan", label: "Labuan" },
  { value: "Melaka", label: "Melaka" },
  { value: "Negeri Sembilan", label: "Negeri Sembilan" },
  { value: "Pahang", label: "Pahang" },
  { value: "Penang", label: "Penang" },
  { value: "Perak", label: "Perak" },
  { value: "Perlis", label: "Perlis" },
  { value: "Putrajaya", label: "Putrajaya" },
  { value: "Sabah", label: "Sabah" },
  { value: "Sarawak", label: "Sarawak" },
  { value: "Selangor", label: "Selangor" },
  { value: "Terengganu", label: "Terengganu" },
];
