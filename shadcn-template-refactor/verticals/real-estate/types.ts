// verticals/real-estate/types.ts — Real Estate vertical type definitions

/**
 * Property types available in the Malaysian real estate market.
 * Must match backend Part 29 exactly.
 */
export const PROPERTY_TYPES = [
  "apartment",
  "condominium",
  "terrace",
  "semi_detached",
  "bungalow",
  "townhouse",
  "studio",
  "penthouse",
  "duplex",
  "villa",
  "shop_lot",
  "office",
  "warehouse",
  "factory",
  "land",
  "other",
] as const;

export type PropertyType = (typeof PROPERTY_TYPES)[number];

/**
 * Listing types (sale or rent).
 */
export const LISTING_TYPES = ["sale", "rent"] as const;
export type ListingType = (typeof LISTING_TYPES)[number];

/**
 * Tenure types specific to Malaysian property law.
 */
export const TENURE_TYPES = [
  "freehold",
  "leasehold",
  "malay_reserve",
  "bumi_lot",
] as const;

export type TenureType = (typeof TENURE_TYPES)[number];

/**
 * Furnishing levels.
 */
export const FURNISHING_TYPES = [
  "unfurnished",
  "partially_furnished",
  "fully_furnished",
] as const;

export type FurnishingType = (typeof FURNISHING_TYPES)[number];

/**
 * Property facing directions.
 */
export const FACING_TYPES = [
  "north",
  "south",
  "east",
  "west",
  "north_east",
  "north_west",
  "south_east",
  "south_west",
] as const;

export type FacingType = (typeof FACING_TYPES)[number];

/**
 * Property condition.
 */
export const CONDITION_TYPES = [
  "new",
  "good",
  "renovated",
  "needs_renovation",
] as const;

export type ConditionType = (typeof CONDITION_TYPES)[number];

/**
 * Minimum rental period options.
 */
export const RENTAL_PERIOD_TYPES = [
  "6_months",
  "12_months",
  "24_months",
  "flexible",
] as const;

export type RentalPeriodType = (typeof RENTAL_PERIOD_TYPES)[number];

/**
 * Title type (strata / individual / master).
 */
export const TITLE_TYPES = [
  "strata",
  "individual",
  "master",
] as const;

export type TitleType = (typeof TITLE_TYPES)[number];

/**
 * Occupancy status.
 */
export const OCCUPANCY_TYPES = [
  "owner_occupied",
  "tenanted",
  "vacant",
] as const;

export type OccupancyType = (typeof OCCUPANCY_TYPES)[number];

/**
 * Available facility options.
 */
export const FACILITY_OPTIONS = [
  "swimming_pool",
  "gym",
  "playground",
  "tennis_court",
  "security",
  "parking",
  "bbq",
  "clubhouse",
  "sauna",
  "jogging_track",
  "mini_mart",
  "cafe",
] as const;

export type FacilityOption = (typeof FACILITY_OPTIONS)[number];

/**
 * Nearby amenity options.
 */
export const AMENITY_OPTIONS = [
  "mrt",
  "bus",
  "school",
  "hospital",
  "shopping_mall",
  "supermarket",
  "park",
  "highway",
] as const;

export type AmenityOption = (typeof AMENITY_OPTIONS)[number];

/**
 * Residential property types that require bedrooms.
 */
export const RESIDENTIAL_PROPERTY_TYPES: PropertyType[] = [
  "apartment",
  "condominium",
  "terrace",
  "semi_detached",
  "bungalow",
  "townhouse",
  "studio",
  "penthouse",
  "duplex",
  "villa",
];

/**
 * High-rise property types (require floor level).
 */
export const HIGHRISE_PROPERTY_TYPES: PropertyType[] = [
  "apartment",
  "condominium",
  "studio",
  "penthouse",
  "duplex",
];

/**
 * Property types that require / show land size.
 */
export const LAND_SIZE_PROPERTY_TYPES: PropertyType[] = [
  "terrace",
  "semi_detached",
  "bungalow",
  "land",
];

/**
 * Property types that show built-up size.
 */
export const BUILT_UP_SIZE_PROPERTY_TYPES: PropertyType[] = [
  "apartment",
  "condominium",
  "terrace",
  "semi_detached",
  "bungalow",
  "townhouse",
  "studio",
  "penthouse",
  "duplex",
  "villa",
  "shop_lot",
  "office",
  "warehouse",
  "factory",
];

/**
 * Complete real estate attributes shape.
 */
export interface RealEstateAttributes {
  propertyType: PropertyType;
  listingType: ListingType;
  tenure?: TenureType;
  builtUpSize?: number;
  landSize?: number;
  bedrooms?: number;
  bathrooms?: number;
  carParks?: number;
  furnishing?: FurnishingType;
  facing?: FacingType;
  floorLevel?: string;
  totalFloors?: number;
  facilities?: string[];
  nearbyAmenities?: string[];
  yearBuilt?: number;
  condition?: ConditionType;
  titleType?: TitleType;
  occupancy?: OccupancyType;
  maintenanceFee?: number;
  projectName?: string;
  developerName?: string;
  minimumRentalPeriod?: RentalPeriodType;
  rentalDeposit?: string;
  referenceId?: string;
}
