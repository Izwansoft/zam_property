// Verticals — schema-driven UI plugins (registry, attribute-renderer, filter-builder)

// Types
export type {
  VerticalType,
  VerticalDefinition,
  PartnerVertical,
  VerticalDisplayMetadata,
  ValidationRules,
  StatusValidation,
  ConditionalRequirement,
  AttributeType,
  AttributeDefinition,
  AttributeConstraints,
  AttributeOption,
  AttributeUIHints,
  AttributeSchema,
  AttributeGroup,
  VerticalSearchMapping,
  FilterableField,
  SortableField,
  RangeField,
  RangePreset,
  FacetField,
} from "./types";

// Registry
export {
  fetchVerticals,
  fetchVertical,
  fetchVerticalSchema,
  verticalKeys,
  useVerticals,
  useVertical,
  useVerticalSchema,
  VerticalRegistry,
  generateZodSchema,
  groupAttributes,
  getRequiredAttributes,
  getCardDisplayAttributes,
  getDetailDisplayAttributes,
  buildDefaultValues,
  getFilterGroups,
} from "./registry";

// Attribute Renderer
export {
  AttributeRenderer,
  DynamicForm,
  formatAttributeValue,
  formatAttributesForDisplay,
  getAttributeOptions,
} from "./attribute-renderer";

// Filter Builder
export {
  FilterBuilder,
  serializeFilters,
  deserializeFilters,
  buildApiParams,
  countActiveFilters,
  type FilterValues,
} from "./filter-builder";

// Real Estate Vertical
export {
  // Types
  type PropertyType,
  type ListingType,
  type TenureType,
  type FurnishingType,
  type FacingType,
  type ConditionType,
  type RentalPeriodType,
  type FacilityOption,
  type AmenityOption,
  type RealEstateAttributes,
  PROPERTY_TYPES,
  LISTING_TYPES,
  TENURE_TYPES,
  FURNISHING_TYPES,
  FACING_TYPES,
  CONDITION_TYPES,
  RENTAL_PERIOD_TYPES,
  FACILITY_OPTIONS,
  AMENITY_OPTIONS,
  RESIDENTIAL_PROPERTY_TYPES,
  HIGHRISE_PROPERTY_TYPES,
  LAND_SIZE_PROPERTY_TYPES,
  BUILT_UP_SIZE_PROPERTY_TYPES,
  // Constants
  PROPERTY_TYPE_LABELS,
  LISTING_TYPE_LABELS,
  TENURE_LABELS,
  FURNISHING_LABELS,
  FACING_LABELS,
  CONDITION_LABELS,
  RENTAL_PERIOD_LABELS,
  FACILITY_LABELS,
  AMENITY_LABELS,
  // Schema
  realEstateSchema,
  // Validation
  realEstateDraftSchema,
  realEstatePublishSchema,
  realEstateAttributesSchema,
  type RealEstateDraftValues,
  type RealEstatePublishValues,
  type RealEstateAttributeValues,
  // Formatters
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
  formatFacilities,
  formatAmenities,
  realEstateFormatters,
  // Filters (Session 3.6)
  realEstateSearchMapping,
  realEstateFilters,
  SALE_PRICE_PRESETS,
  RENT_PRICE_PRESETS,
  BEDROOM_OPTIONS,
  BATHROOM_OPTIONS,
  getPricePresets,
  // Components
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
  // Hooks (Session 3.6)
  useRealEstateFilters,
  type RealEstateFilterState,
  type UseRealEstateFiltersReturn,
} from "./real-estate";