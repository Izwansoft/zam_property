// verticals/real-estate/constants.ts — Display labels and mappings for real estate

import type {
  PropertyType,
  ListingType,
  TenureType,
  FurnishingType,
  FacingType,
  ConditionType,
  RentalPeriodType,
  TitleType,
  OccupancyType,
} from "./types";

// ---------------------------------------------------------------------------
// Property Type labels
// ---------------------------------------------------------------------------

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  apartment: "Apartment / Flat",
  condominium: "Condominium",
  terrace: "Terrace House",
  semi_detached: "Semi-Detached",
  bungalow: "Bungalow",
  townhouse: "Townhouse",
  studio: "Studio",
  penthouse: "Penthouse",
  duplex: "Duplex",
  villa: "Villa",
  shop_lot: "Shop Lot",
  office: "Office",
  warehouse: "Warehouse",
  factory: "Factory",
  land: "Land",
  other: "Other",
};

// ---------------------------------------------------------------------------
// Listing Type labels
// ---------------------------------------------------------------------------

export const LISTING_TYPE_LABELS: Record<ListingType, string> = {
  sale: "For Sale",
  rent: "For Rent",
};

// ---------------------------------------------------------------------------
// Tenure labels
// ---------------------------------------------------------------------------

export const TENURE_LABELS: Record<TenureType, string> = {
  freehold: "Freehold",
  leasehold: "Leasehold",
  malay_reserve: "Malay Reserve",
  bumi_lot: "Bumi Lot",
};

// ---------------------------------------------------------------------------
// Furnishing labels
// ---------------------------------------------------------------------------

export const FURNISHING_LABELS: Record<FurnishingType, string> = {
  unfurnished: "Unfurnished",
  partially_furnished: "Partially Furnished",
  fully_furnished: "Fully Furnished",
};

// ---------------------------------------------------------------------------
// Facing labels
// ---------------------------------------------------------------------------

export const FACING_LABELS: Record<FacingType, string> = {
  north: "North",
  south: "South",
  east: "East",
  west: "West",
  north_east: "North East",
  north_west: "North West",
  south_east: "South East",
  south_west: "South West",
};

// ---------------------------------------------------------------------------
// Condition labels
// ---------------------------------------------------------------------------

export const CONDITION_LABELS: Record<ConditionType, string> = {
  new: "Brand New",
  good: "Good Condition",
  renovated: "Renovated",
  needs_renovation: "Needs Renovation",
};

// ---------------------------------------------------------------------------
// Title Type labels
// ---------------------------------------------------------------------------

export const TITLE_TYPE_LABELS: Record<TitleType, string> = {
  strata: "Strata",
  individual: "Individual",
  master: "Master Title",
};

// ---------------------------------------------------------------------------
// Occupancy labels
// ---------------------------------------------------------------------------

export const OCCUPANCY_LABELS: Record<OccupancyType, string> = {
  owner_occupied: "Owner Occupied",
  tenanted: "Tenanted",
  vacant: "Vacant",
};

// ---------------------------------------------------------------------------
// Rental period labels
// ---------------------------------------------------------------------------

export const RENTAL_PERIOD_LABELS: Record<RentalPeriodType, string> = {
  "6_months": "6 Months",
  "12_months": "1 Year",
  "24_months": "2 Years",
  flexible: "Flexible",
};

// ---------------------------------------------------------------------------
// Facility labels
// ---------------------------------------------------------------------------

export const FACILITY_LABELS: Record<string, string> = {
  swimming_pool: "Swimming Pool",
  gym: "Gymnasium",
  playground: "Playground",
  tennis_court: "Tennis Court",
  security: "24hr Security",
  parking: "Covered Parking",
  bbq: "BBQ Area",
  clubhouse: "Clubhouse",
  sauna: "Sauna",
  jogging_track: "Jogging Track",
  mini_mart: "Mini Mart",
  cafe: "Cafe",
};

// ---------------------------------------------------------------------------
// Nearby amenity labels
// ---------------------------------------------------------------------------

export const AMENITY_LABELS: Record<string, string> = {
  mrt: "MRT / LRT Station",
  bus: "Bus Stop",
  school: "School",
  hospital: "Hospital",
  shopping_mall: "Shopping Mall",
  supermarket: "Supermarket",
  park: "Park / Garden",
  highway: "Highway Access",
};
