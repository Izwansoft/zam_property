// verticals/real-estate/index.ts — Real Estate vertical barrel exports

// Types
export type {
  PropertyType,
  ListingType,
  TenureType,
  FurnishingType,
  FacingType,
  ConditionType,
  RentalPeriodType,
  TitleType,
  OccupancyType,
  FacilityOption,
  AmenityOption,
  RealEstateAttributes,
} from "./types";

export {
  PROPERTY_TYPES,
  LISTING_TYPES,
  TENURE_TYPES,
  FURNISHING_TYPES,
  FACING_TYPES,
  CONDITION_TYPES,
  RENTAL_PERIOD_TYPES,
  TITLE_TYPES,
  OCCUPANCY_TYPES,
  FACILITY_OPTIONS,
  AMENITY_OPTIONS,
  RESIDENTIAL_PROPERTY_TYPES,
  HIGHRISE_PROPERTY_TYPES,
  LAND_SIZE_PROPERTY_TYPES,
  BUILT_UP_SIZE_PROPERTY_TYPES,
} from "./types";

// Constants (display labels)
export {
  PROPERTY_TYPE_LABELS,
  LISTING_TYPE_LABELS,
  TENURE_LABELS,
  FURNISHING_LABELS,
  FACING_LABELS,
  CONDITION_LABELS,
  RENTAL_PERIOD_LABELS,
  TITLE_TYPE_LABELS,
  OCCUPANCY_LABELS,
  FACILITY_LABELS,
  AMENITY_LABELS,
} from "./constants";

// Schema
export { realEstateSchema } from "./schema";

// Validation
export {
  realEstateDraftSchema,
  realEstatePublishSchema,
  realEstateAttributesSchema,
} from "./validation";

export type {
  RealEstateDraftValues,
  RealEstatePublishValues,
  RealEstateAttributeValues,
} from "./validation";

// Formatters
export {
  formatPrice,
  formatCompactPrice,
  formatSize,
  formatBedrooms,
  formatBathrooms,
  formatCarParks,
  formatPropertyType,
  formatListingType,
  formatTenure,
  formatFurnishing,
  formatFacing,
  formatCondition,
  formatRentalPeriod,
  formatTitleType,
  formatOccupancy,
  formatMaintenanceFee,
  formatFacilities,
  formatAmenities,
  realEstateFormatters,
} from "./formatters";

// Filters (Session 3.6)
export {
  realEstateSearchMapping,
  realEstateFilters,
  SALE_PRICE_PRESETS,
  RENT_PRICE_PRESETS,
  BEDROOM_OPTIONS,
  BATHROOM_OPTIONS,
  getPricePresets,
} from "./filters";

// Components
export {
  PropertyTypeSelector,
  ListingTypeSelector,
  TenureSelector,
  FurnishingSelector,
  RealEstateAttributeForm,
  // Filter components (Session 3.6)
  PriceRangeFilter,
  type PriceRange,
  RoomCountFilter,
  type RoomCountValues,
  PropertyTypeFacet,
  type PropertyTypeFacetCount,
  RealEstateSearchFilters,
  type RealEstateSearchFiltersProps,
} from "./components";

// Hooks (Session 3.6)
export {
  useRealEstateFilters,
  type RealEstateFilterState,
  type UseRealEstateFiltersReturn,
} from "./hooks";
