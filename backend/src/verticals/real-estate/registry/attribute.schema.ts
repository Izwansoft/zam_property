/**
 * Real Estate Vertical - Attribute Schema
 * Part 29 - Complete Reference Implementation
 */

import { AttributeSchema, AttributeFieldDefinition } from '@modules/vertical/types';

// ─────────────────────────────────────────────────────────────────────────────
// PROPERTY TYPE OPTIONS
// ─────────────────────────────────────────────────────────────────────────────

export const PROPERTY_TYPE_OPTIONS = [
  { value: 'apartment', label: 'Apartment / Flat' },
  { value: 'condominium', label: 'Condominium' },
  { value: 'terrace', label: 'Terrace House' },
  { value: 'semi_detached', label: 'Semi-Detached' },
  { value: 'bungalow', label: 'Bungalow' },
  { value: 'townhouse', label: 'Townhouse' },
  { value: 'studio', label: 'Studio' },
  { value: 'penthouse', label: 'Penthouse' },
  { value: 'duplex', label: 'Duplex' },
  { value: 'villa', label: 'Villa' },
  { value: 'shop_lot', label: 'Shop Lot' },
  { value: 'office', label: 'Office' },
  { value: 'warehouse', label: 'Warehouse' },
  { value: 'factory', label: 'Factory' },
  { value: 'land', label: 'Land' },
  { value: 'other', label: 'Other' },
] as const;

export const LISTING_TYPE_OPTIONS = [
  { value: 'sale', label: 'For Sale' },
  { value: 'rent', label: 'For Rent' },
] as const;

export const TENURE_OPTIONS = [
  { value: 'freehold', label: 'Freehold' },
  { value: 'leasehold', label: 'Leasehold' },
  { value: 'malay_reserve', label: 'Malay Reserve' },
  { value: 'bumi_lot', label: 'Bumi Lot' },
] as const;

export const FURNISHING_OPTIONS = [
  { value: 'unfurnished', label: 'Unfurnished' },
  { value: 'partially_furnished', label: 'Partially Furnished' },
  { value: 'fully_furnished', label: 'Fully Furnished' },
] as const;

export const CONDITION_OPTIONS = [
  { value: 'new', label: 'Brand New' },
  { value: 'good', label: 'Good Condition' },
  { value: 'renovated', label: 'Renovated' },
  { value: 'needs_renovation', label: 'Needs Renovation' },
] as const;

export const FACING_OPTIONS = [
  { value: 'north', label: 'North' },
  { value: 'south', label: 'South' },
  { value: 'east', label: 'East' },
  { value: 'west', label: 'West' },
  { value: 'north_east', label: 'North East' },
  { value: 'north_west', label: 'North West' },
  { value: 'south_east', label: 'South East' },
  { value: 'south_west', label: 'South West' },
] as const;

export const MINIMUM_RENTAL_PERIOD_OPTIONS = [
  { value: '6_months', label: '6 Months' },
  { value: '12_months', label: '1 Year' },
  { value: '24_months', label: '2 Years' },
  { value: 'flexible', label: 'Flexible' },
] as const;

export const FACILITIES_OPTIONS = [
  { value: 'swimming_pool', label: 'Swimming Pool' },
  { value: 'gym', label: 'Gymnasium' },
  { value: 'playground', label: 'Playground' },
  { value: 'tennis_court', label: 'Tennis Court' },
  { value: 'security', label: '24hr Security' },
  { value: 'parking', label: 'Covered Parking' },
  { value: 'bbq', label: 'BBQ Area' },
  { value: 'clubhouse', label: 'Clubhouse' },
  { value: 'sauna', label: 'Sauna' },
  { value: 'jogging_track', label: 'Jogging Track' },
  { value: 'mini_mart', label: 'Mini Mart' },
  { value: 'cafe', label: 'Cafe' },
] as const;

export const NEARBY_AMENITIES_OPTIONS = [
  { value: 'mrt', label: 'MRT / LRT Station' },
  { value: 'bus', label: 'Bus Stop' },
  { value: 'school', label: 'School' },
  { value: 'hospital', label: 'Hospital' },
  { value: 'shopping_mall', label: 'Shopping Mall' },
  { value: 'supermarket', label: 'Supermarket' },
  { value: 'park', label: 'Park / Garden' },
  { value: 'highway', label: 'Highway Access' },
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// LANDED PROPERTY TYPES (require land size)
// ─────────────────────────────────────────────────────────────────────────────

export const LANDED_PROPERTY_TYPES = [
  'terrace',
  'semi_detached',
  'bungalow',
  'townhouse',
  'villa',
  'land',
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// HIGH-RISE PROPERTY TYPES (show floor level)
// ─────────────────────────────────────────────────────────────────────────────

export const HIGHRISE_PROPERTY_TYPES = [
  'apartment',
  'condominium',
  'studio',
  'penthouse',
  'duplex',
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// ATTRIBUTE FIELD DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────

export const REAL_ESTATE_FIELDS: AttributeFieldDefinition[] = [
  // === PROPERTY TYPE ===
  {
    name: 'propertyType',
    type: 'enum',
    label: 'Property Type',
    description: 'The type of property being listed',
    required: true,
    requiredOnPublish: true,
    options: [...PROPERTY_TYPE_OPTIONS],
    displayOrder: 1,
    group: 'basic',
    searchable: true,
    filterable: true,
    facetable: true,
  },

  // === LISTING TYPE ===
  {
    name: 'listingType',
    type: 'enum',
    label: 'Listing Type',
    description: 'Whether the property is for sale or rent',
    required: true,
    requiredOnPublish: true,
    options: [...LISTING_TYPE_OPTIONS],
    displayOrder: 2,
    group: 'basic',
    searchable: true,
    filterable: true,
    facetable: true,
  },

  // === TENURE ===
  {
    name: 'tenure',
    type: 'enum',
    label: 'Tenure',
    description: 'Property ownership type',
    required: false,
    requiredOnPublish: false,
    options: [...TENURE_OPTIONS],
    displayOrder: 10,
    group: 'details',
    searchable: true,
    filterable: true,
    showIf: {
      field: 'listingType',
      operator: 'eq',
      value: 'sale',
    },
  },

  // === SIZE ===
  {
    name: 'builtUpSize',
    type: 'number',
    label: 'Built-up Size',
    description: 'Total built-up area in square feet',
    required: false,
    requiredOnPublish: true,
    min: 1,
    max: 1000000,
    unit: 'sq ft',
    placeholder: 'e.g., 1200',
    displayOrder: 3,
    group: 'size',
    searchable: true,
    filterable: true,
    sortable: true,
  },

  {
    name: 'landSize',
    type: 'number',
    label: 'Land Size',
    description: 'Total land area in square feet',
    required: false,
    requiredOnPublish: false,
    min: 1,
    max: 10000000,
    unit: 'sq ft',
    placeholder: 'e.g., 2400',
    displayOrder: 4,
    group: 'size',
    searchable: true,
    filterable: true,
    sortable: true,
    showIf: {
      field: 'propertyType',
      operator: 'in',
      value: LANDED_PROPERTY_TYPES,
    },
  },

  // === ROOMS ===
  {
    name: 'bedrooms',
    type: 'number',
    label: 'Bedrooms',
    description: 'Number of bedrooms',
    required: false,
    requiredOnPublish: true,
    min: 0,
    max: 20,
    displayOrder: 5,
    group: 'rooms',
    searchable: true,
    filterable: true,
    sortable: true,
    facetable: true,
  },

  {
    name: 'bathrooms',
    type: 'number',
    label: 'Bathrooms',
    description: 'Number of bathrooms',
    required: false,
    requiredOnPublish: true,
    min: 0,
    max: 20,
    displayOrder: 6,
    group: 'rooms',
    searchable: true,
    filterable: true,
  },

  {
    name: 'carParks',
    type: 'number',
    label: 'Car Parks',
    description: 'Number of car parking spaces',
    required: false,
    requiredOnPublish: false,
    min: 0,
    max: 10,
    displayOrder: 7,
    group: 'rooms',
    searchable: true,
    filterable: true,
  },

  // === FURNISHING ===
  {
    name: 'furnishing',
    type: 'enum',
    label: 'Furnishing',
    description: 'Level of furnishing included',
    required: false,
    requiredOnPublish: false,
    options: [...FURNISHING_OPTIONS],
    displayOrder: 11,
    group: 'details',
    searchable: true,
    filterable: true,
    facetable: true,
  },

  // === FLOOR LEVEL ===
  {
    name: 'floorLevel',
    type: 'string',
    label: 'Floor Level',
    description: 'Floor level for high-rise properties',
    required: false,
    requiredOnPublish: false,
    maxLength: 20,
    placeholder: 'e.g., 15, Ground, Penthouse',
    displayOrder: 12,
    group: 'details',
    searchable: false,
    filterable: false,
    showIf: {
      field: 'propertyType',
      operator: 'in',
      value: HIGHRISE_PROPERTY_TYPES,
    },
  },

  // === PROPERTY CONDITION ===
  {
    name: 'condition',
    type: 'enum',
    label: 'Property Condition',
    description: 'Current condition of the property',
    required: false,
    requiredOnPublish: false,
    options: [...CONDITION_OPTIONS],
    displayOrder: 13,
    group: 'details',
    searchable: true,
    filterable: true,
  },

  // === YEAR BUILT ===
  {
    name: 'yearBuilt',
    type: 'number',
    label: 'Year Built',
    description: 'Year the property was built',
    required: false,
    requiredOnPublish: false,
    min: 1900,
    max: 2030,
    placeholder: 'e.g., 2020',
    displayOrder: 14,
    group: 'details',
    searchable: true,
    filterable: true,
  },

  // === FACING ===
  {
    name: 'facing',
    type: 'enum',
    label: 'Facing',
    description: 'Direction the property faces',
    required: false,
    requiredOnPublish: false,
    options: [...FACING_OPTIONS],
    displayOrder: 15,
    group: 'details',
    searchable: false,
    filterable: true,
  },

  // === FACILITIES ===
  {
    name: 'facilities',
    type: 'multi_enum',
    label: 'Facilities',
    description: 'Available facilities in the property or development',
    required: false,
    requiredOnPublish: false,
    options: [...FACILITIES_OPTIONS],
    displayOrder: 20,
    group: 'facilities',
    searchable: true,
    filterable: true,
    facetable: true,
  },

  // === NEARBY AMENITIES ===
  {
    name: 'nearbyAmenities',
    type: 'multi_enum',
    label: 'Nearby Amenities',
    description: 'Amenities within walking distance',
    required: false,
    requiredOnPublish: false,
    options: [...NEARBY_AMENITIES_OPTIONS],
    displayOrder: 21,
    group: 'amenities',
    searchable: true,
    filterable: true,
    facetable: true,
  },

  // === RENTAL TERMS ===
  {
    name: 'rentalDeposit',
    type: 'string',
    label: 'Rental Deposit',
    description: 'Security deposit requirement (e.g., 2+1)',
    required: false,
    requiredOnPublish: false,
    maxLength: 50,
    placeholder: 'e.g., 2+1',
    displayOrder: 30,
    group: 'rental',
    searchable: false,
    filterable: false,
    showIf: {
      field: 'listingType',
      operator: 'eq',
      value: 'rent',
    },
  },

  {
    name: 'minimumRentalPeriod',
    type: 'enum',
    label: 'Minimum Rental Period',
    description: 'Minimum lease duration',
    required: false,
    requiredOnPublish: false,
    options: [...MINIMUM_RENTAL_PERIOD_OPTIONS],
    displayOrder: 31,
    group: 'rental',
    searchable: false,
    filterable: true,
    showIf: {
      field: 'listingType',
      operator: 'eq',
      value: 'rent',
    },
  },

  // === ADDITIONAL FEATURES ===
  {
    name: 'additionalFeatures',
    type: 'array',
    label: 'Additional Features',
    description: 'Custom features like "Corner Lot", "Renovated Kitchen"',
    required: false,
    requiredOnPublish: false,
    placeholder: 'Add features...',
    displayOrder: 40,
    group: 'features',
    searchable: true,
    filterable: false,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// ATTRIBUTE GROUPS
// ─────────────────────────────────────────────────────────────────────────────

export const REAL_ESTATE_GROUPS = [
  {
    id: 'basic',
    label: 'Basic Information',
    description: 'Core property details',
    displayOrder: 1,
  },
  { id: 'size', label: 'Size', description: 'Property dimensions', displayOrder: 2 },
  { id: 'rooms', label: 'Rooms', description: 'Room configuration', displayOrder: 3 },
  {
    id: 'details',
    label: 'Property Details',
    description: 'Additional property info',
    displayOrder: 4,
  },
  {
    id: 'facilities',
    label: 'Facilities',
    description: 'Available facilities',
    displayOrder: 5,
    collapsible: true,
  },
  {
    id: 'amenities',
    label: 'Nearby Amenities',
    description: 'Nearby conveniences',
    displayOrder: 6,
    collapsible: true,
  },
  {
    id: 'rental',
    label: 'Rental Terms',
    description: 'Rental-specific terms',
    displayOrder: 7,
    collapsible: true,
  },
  {
    id: 'features',
    label: 'Additional Features',
    description: 'Custom features',
    displayOrder: 8,
    collapsible: true,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// COMPLETE ATTRIBUTE SCHEMA
// ─────────────────────────────────────────────────────────────────────────────

export const REAL_ESTATE_ATTRIBUTE_SCHEMA: AttributeSchema = {
  version: '1.0',
  fields: REAL_ESTATE_FIELDS,
  groups: REAL_ESTATE_GROUPS,
};

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get fields required for draft status
 */
export function getRequiredForDraft(): string[] {
  return REAL_ESTATE_FIELDS.filter((f) => f.required === true).map((f) => f.name);
}

/**
 * Get fields required for publish status
 */
export function getRequiredForPublish(): string[] {
  return REAL_ESTATE_FIELDS.filter((f) => f.requiredOnPublish === true).map((f) => f.name);
}

/**
 * Get all filterable fields
 */
export function getFilterableFields(): string[] {
  return REAL_ESTATE_FIELDS.filter((f) => f.filterable === true).map((f) => f.name);
}

/**
 * Get all sortable fields
 */
export function getSortableFields(): string[] {
  return REAL_ESTATE_FIELDS.filter((f) => f.sortable === true).map((f) => f.name);
}

/**
 * Get all facetable fields
 */
export function getFacetableFields(): string[] {
  return REAL_ESTATE_FIELDS.filter((f) => f.facetable === true).map((f) => f.name);
}

/**
 * Check if property type is landed
 */
export function isLandedProperty(propertyType: string): boolean {
  return LANDED_PROPERTY_TYPES.includes(propertyType as (typeof LANDED_PROPERTY_TYPES)[number]);
}

/**
 * Check if property type is high-rise
 */
export function isHighriseProperty(propertyType: string): boolean {
  return HIGHRISE_PROPERTY_TYPES.includes(propertyType as (typeof HIGHRISE_PROPERTY_TYPES)[number]);
}
