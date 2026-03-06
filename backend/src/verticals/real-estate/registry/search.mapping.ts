/**
 * Real Estate Vertical - Search Mapping
 * Part 29 - Complete Reference Implementation
 */

import { SearchMappingConfig, SearchFieldMapping } from '@modules/vertical/types';

// ─────────────────────────────────────────────────────────────────────────────
// OPENSEARCH PROPERTY MAPPINGS
// ─────────────────────────────────────────────────────────────────────────────

export const REAL_ESTATE_SEARCH_PROPERTIES: Record<string, SearchFieldMapping> = {
  // === BASIC FIELDS ===
  propertyType: {
    name: 'propertyType',
    type: 'keyword',
    aggregatable: true,
    aggregationType: 'terms',
    aggregationConfig: { size: 20 },
  },
  listingType: {
    name: 'listingType',
    type: 'keyword',
    aggregatable: true,
    aggregationType: 'terms',
    aggregationConfig: { size: 5 },
  },
  tenure: {
    name: 'tenure',
    type: 'keyword',
    aggregatable: true,
    aggregationType: 'terms',
  },

  // === SIZE FIELDS ===
  builtUpSize: {
    name: 'builtUpSize',
    type: 'integer',
    aggregatable: true,
    aggregationType: 'range',
    aggregationConfig: {
      ranges: [
        { key: 'below_500', to: 500 },
        { key: '500_to_1000', from: 500, to: 1000 },
        { key: '1000_to_1500', from: 1000, to: 1500 },
        { key: '1500_to_2000', from: 1500, to: 2000 },
        { key: '2000_to_3000', from: 2000, to: 3000 },
        { key: '3000_to_5000', from: 3000, to: 5000 },
        { key: 'above_5000', from: 5000 },
      ],
    },
  },
  landSize: {
    name: 'landSize',
    type: 'integer',
    aggregatable: true,
    aggregationType: 'range',
    aggregationConfig: {
      ranges: [
        { key: 'below_1000', to: 1000 },
        { key: '1000_to_2000', from: 1000, to: 2000 },
        { key: '2000_to_3000', from: 2000, to: 3000 },
        { key: '3000_to_5000', from: 3000, to: 5000 },
        { key: '5000_to_10000', from: 5000, to: 10000 },
        { key: 'above_10000', from: 10000 },
      ],
    },
  },

  // === ROOM FIELDS ===
  bedrooms: {
    name: 'bedrooms',
    type: 'integer',
    aggregatable: true,
    aggregationType: 'terms',
    aggregationConfig: { size: 10 },
  },
  bathrooms: {
    name: 'bathrooms',
    type: 'integer',
    aggregatable: true,
    aggregationType: 'terms',
    aggregationConfig: { size: 10 },
  },
  carParks: {
    name: 'carParks',
    type: 'integer',
    aggregatable: true,
    aggregationType: 'terms',
    aggregationConfig: { size: 10 },
  },

  // === DETAIL FIELDS ===
  furnishing: {
    name: 'furnishing',
    type: 'keyword',
    aggregatable: true,
    aggregationType: 'terms',
  },
  condition: {
    name: 'condition',
    type: 'keyword',
    aggregatable: true,
    aggregationType: 'terms',
  },
  yearBuilt: {
    name: 'yearBuilt',
    type: 'integer',
    aggregatable: true,
    aggregationType: 'range',
    aggregationConfig: {
      ranges: [
        { key: 'before_2000', to: 2000 },
        { key: '2000_to_2010', from: 2000, to: 2010 },
        { key: '2010_to_2015', from: 2010, to: 2015 },
        { key: '2015_to_2020', from: 2015, to: 2020 },
        { key: '2020_to_2025', from: 2020, to: 2025 },
        { key: 'after_2025', from: 2025 },
      ],
    },
  },
  facing: {
    name: 'facing',
    type: 'keyword',
    aggregatable: true,
    aggregationType: 'terms',
  },
  floorLevel: {
    name: 'floorLevel',
    type: 'keyword',
    aggregatable: false,
  },

  // === ARRAY FIELDS ===
  facilities: {
    name: 'facilities',
    type: 'keyword',
    aggregatable: true,
    aggregationType: 'terms',
    aggregationConfig: { size: 20 },
  },
  nearbyAmenities: {
    name: 'nearbyAmenities',
    type: 'keyword',
    aggregatable: true,
    aggregationType: 'terms',
    aggregationConfig: { size: 20 },
  },

  // === RENTAL FIELDS ===
  rentalDeposit: {
    name: 'rentalDeposit',
    type: 'keyword',
    aggregatable: false,
  },
  minimumRentalPeriod: {
    name: 'minimumRentalPeriod',
    type: 'keyword',
    aggregatable: true,
    aggregationType: 'terms',
  },

  // === TEXT FIELDS ===
  additionalFeatures: {
    name: 'additionalFeatures',
    type: 'text',
    analyzer: 'standard',
    aggregatable: false,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// FACET DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────

export const REAL_ESTATE_FACETS = [
  {
    name: 'propertyType',
    field: 'attributes.propertyType',
    label: 'Property Type',
    type: 'terms' as const,
    config: { size: 20, order: { _count: 'desc' } },
  },
  {
    name: 'listingType',
    field: 'attributes.listingType',
    label: 'For Sale / Rent',
    type: 'terms' as const,
    config: { size: 5 },
  },
  {
    name: 'bedrooms',
    field: 'attributes.bedrooms',
    label: 'Bedrooms',
    type: 'terms' as const,
    config: { size: 10, order: { _key: 'asc' } },
  },
  {
    name: 'priceRange',
    field: 'price',
    label: 'Price Range',
    type: 'range' as const,
    config: {
      ranges: [
        { key: 'below_100k', to: 100000 },
        { key: '100k_to_300k', from: 100000, to: 300000 },
        { key: '300k_to_500k', from: 300000, to: 500000 },
        { key: '500k_to_750k', from: 500000, to: 750000 },
        { key: '750k_to_1m', from: 750000, to: 1000000 },
        { key: '1m_to_2m', from: 1000000, to: 2000000 },
        { key: '2m_to_5m', from: 2000000, to: 5000000 },
        { key: 'above_5m', from: 5000000 },
      ],
    },
  },
  {
    name: 'furnishing',
    field: 'attributes.furnishing',
    label: 'Furnishing',
    type: 'terms' as const,
    config: { size: 5 },
  },
  {
    name: 'tenure',
    field: 'attributes.tenure',
    label: 'Tenure',
    type: 'terms' as const,
    config: { size: 5 },
  },
  {
    name: 'facilities',
    field: 'attributes.facilities',
    label: 'Facilities',
    type: 'terms' as const,
    config: { size: 20 },
  },
  {
    name: 'builtUpSize',
    field: 'attributes.builtUpSize',
    label: 'Built-up Size',
    type: 'range' as const,
    config: {
      ranges: [
        { key: 'below_500', to: 500 },
        { key: '500_to_1000', from: 500, to: 1000 },
        { key: '1000_to_1500', from: 1000, to: 1500 },
        { key: '1500_to_2000', from: 1500, to: 2000 },
        { key: '2000_to_3000', from: 2000, to: 3000 },
        { key: 'above_3000', from: 3000 },
      ],
    },
  },
  {
    name: 'city',
    field: 'location.city',
    label: 'City',
    type: 'terms' as const,
    config: { size: 50 },
  },
  {
    name: 'state',
    field: 'location.state',
    label: 'State',
    type: 'terms' as const,
    config: { size: 20 },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// COMPLETE SEARCH MAPPING CONFIG
// ─────────────────────────────────────────────────────────────────────────────

export const REAL_ESTATE_SEARCH_MAPPING: SearchMappingConfig = {
  version: '1.0',
  properties: REAL_ESTATE_SEARCH_PROPERTIES,
  settings: {
    analysis: {
      analyzer: {
        autocomplete: {
          type: 'custom',
          tokenizer: 'standard',
          filter: ['lowercase', 'autocomplete_filter'],
        },
        autocomplete_search: {
          type: 'custom',
          tokenizer: 'standard',
          filter: ['lowercase'],
        },
      },
      filter: {
        autocomplete_filter: {
          type: 'edge_ngram',
          min_gram: 2,
          max_gram: 20,
        },
      },
    },
  },
  facets: REAL_ESTATE_FACETS,
};

// ─────────────────────────────────────────────────────────────────────────────
// OPENSEARCH INDEX MAPPING (for direct use)
// ─────────────────────────────────────────────────────────────────────────────

export const REAL_ESTATE_OPENSEARCH_MAPPING = {
  mappings: {
    properties: {
      // Identity fields (from base listing)
      id: { type: 'keyword' },
      partnerId: { type: 'keyword' },
      vendorId: { type: 'keyword' },
      verticalType: { type: 'keyword' },
      status: { type: 'keyword' },

      // Content fields
      title: {
        type: 'text',
        analyzer: 'autocomplete',
        search_analyzer: 'autocomplete_search',
        fields: {
          keyword: { type: 'keyword' },
          raw: { type: 'text', analyzer: 'standard' },
        },
      },
      description: {
        type: 'text',
        analyzer: 'standard',
      },
      slug: { type: 'keyword' },

      // Price fields
      price: { type: 'scaled_float', scaling_factor: 100 },
      currency: { type: 'keyword' },
      priceType: { type: 'keyword' },

      // Location fields
      location: {
        properties: {
          address: { type: 'text' },
          city: { type: 'keyword' },
          state: { type: 'keyword' },
          country: { type: 'keyword' },
          postalCode: { type: 'keyword' },
          coordinates: { type: 'geo_point' },
        },
      },

      // Real Estate specific attributes
      attributes: {
        properties: {
          propertyType: { type: 'keyword' },
          listingType: { type: 'keyword' },
          tenure: { type: 'keyword' },
          builtUpSize: { type: 'integer' },
          landSize: { type: 'integer' },
          bedrooms: { type: 'integer' },
          bathrooms: { type: 'integer' },
          carParks: { type: 'integer' },
          furnishing: { type: 'keyword' },
          condition: { type: 'keyword' },
          yearBuilt: { type: 'integer' },
          facing: { type: 'keyword' },
          floorLevel: { type: 'keyword' },
          facilities: { type: 'keyword' },
          nearbyAmenities: { type: 'keyword' },
          rentalDeposit: { type: 'keyword' },
          minimumRentalPeriod: { type: 'keyword' },
          additionalFeatures: { type: 'text' },
        },
      },

      // Features
      isFeatured: { type: 'boolean' },
      featuredUntil: { type: 'date' },

      // Media (denormalized)
      primaryImageUrl: { type: 'keyword', index: false },
      mediaCount: { type: 'integer' },

      // Vendor info (denormalized)
      vendor: {
        properties: {
          id: { type: 'keyword' },
          name: { type: 'text' },
          slug: { type: 'keyword' },
        },
      },

      // Timestamps
      publishedAt: { type: 'date' },
      expiresAt: { type: 'date' },
      createdAt: { type: 'date' },
      updatedAt: { type: 'date' },
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// FILTER BUILDERS
// ─────────────────────────────────────────────────────────────────────────────

export interface RealEstateFilterParams {
  propertyType?: string | string[];
  listingType?: 'sale' | 'rent';
  tenure?: string | string[];
  bedroomsMin?: number;
  bedroomsMax?: number;
  bathroomsMin?: number;
  bathroomsMax?: number;
  builtUpSizeMin?: number;
  builtUpSizeMax?: number;
  landSizeMin?: number;
  landSizeMax?: number;
  furnishing?: string | string[];
  condition?: string | string[];
  yearBuiltMin?: number;
  yearBuiltMax?: number;
  facing?: string | string[];
  facilities?: string[];
  nearbyAmenities?: string[];
  minimumRentalPeriod?: string | string[];
}

/**
 * Build OpenSearch filter clauses for real estate search
 */
export function buildRealEstateFilters(params: RealEstateFilterParams): Record<string, unknown>[] {
  const filters: Record<string, unknown>[] = [];

  // Term filters
  if (params.propertyType) {
    if (Array.isArray(params.propertyType)) {
      filters.push({ terms: { 'attributes.propertyType': params.propertyType } });
    } else {
      filters.push({ term: { 'attributes.propertyType': params.propertyType } });
    }
  }

  if (params.listingType) {
    filters.push({ term: { 'attributes.listingType': params.listingType } });
  }

  if (params.tenure) {
    if (Array.isArray(params.tenure)) {
      filters.push({ terms: { 'attributes.tenure': params.tenure } });
    } else {
      filters.push({ term: { 'attributes.tenure': params.tenure } });
    }
  }

  if (params.furnishing) {
    if (Array.isArray(params.furnishing)) {
      filters.push({ terms: { 'attributes.furnishing': params.furnishing } });
    } else {
      filters.push({ term: { 'attributes.furnishing': params.furnishing } });
    }
  }

  if (params.condition) {
    if (Array.isArray(params.condition)) {
      filters.push({ terms: { 'attributes.condition': params.condition } });
    } else {
      filters.push({ term: { 'attributes.condition': params.condition } });
    }
  }

  if (params.facing) {
    if (Array.isArray(params.facing)) {
      filters.push({ terms: { 'attributes.facing': params.facing } });
    } else {
      filters.push({ term: { 'attributes.facing': params.facing } });
    }
  }

  if (params.minimumRentalPeriod) {
    if (Array.isArray(params.minimumRentalPeriod)) {
      filters.push({ terms: { 'attributes.minimumRentalPeriod': params.minimumRentalPeriod } });
    } else {
      filters.push({ term: { 'attributes.minimumRentalPeriod': params.minimumRentalPeriod } });
    }
  }

  // Array filters (must match all)
  if (params.facilities?.length) {
    filters.push({ terms: { 'attributes.facilities': params.facilities } });
  }

  if (params.nearbyAmenities?.length) {
    filters.push({ terms: { 'attributes.nearbyAmenities': params.nearbyAmenities } });
  }

  // Range filters
  if (params.bedroomsMin !== undefined || params.bedroomsMax !== undefined) {
    filters.push({
      range: {
        'attributes.bedrooms': {
          ...(params.bedroomsMin !== undefined && { gte: params.bedroomsMin }),
          ...(params.bedroomsMax !== undefined && { lte: params.bedroomsMax }),
        },
      },
    });
  }

  if (params.bathroomsMin !== undefined || params.bathroomsMax !== undefined) {
    filters.push({
      range: {
        'attributes.bathrooms': {
          ...(params.bathroomsMin !== undefined && { gte: params.bathroomsMin }),
          ...(params.bathroomsMax !== undefined && { lte: params.bathroomsMax }),
        },
      },
    });
  }

  if (params.builtUpSizeMin !== undefined || params.builtUpSizeMax !== undefined) {
    filters.push({
      range: {
        'attributes.builtUpSize': {
          ...(params.builtUpSizeMin !== undefined && { gte: params.builtUpSizeMin }),
          ...(params.builtUpSizeMax !== undefined && { lte: params.builtUpSizeMax }),
        },
      },
    });
  }

  if (params.landSizeMin !== undefined || params.landSizeMax !== undefined) {
    filters.push({
      range: {
        'attributes.landSize': {
          ...(params.landSizeMin !== undefined && { gte: params.landSizeMin }),
          ...(params.landSizeMax !== undefined && { lte: params.landSizeMax }),
        },
      },
    });
  }

  if (params.yearBuiltMin !== undefined || params.yearBuiltMax !== undefined) {
    filters.push({
      range: {
        'attributes.yearBuilt': {
          ...(params.yearBuiltMin !== undefined && { gte: params.yearBuiltMin }),
          ...(params.yearBuiltMax !== undefined && { lte: params.yearBuiltMax }),
        },
      },
    });
  }

  return filters;
}

/**
 * Build aggregations for real estate facets
 */
export function buildRealEstateAggregations(): Record<string, unknown> {
  return {
    propertyType: {
      terms: { field: 'attributes.propertyType', size: 20 },
    },
    listingType: {
      terms: { field: 'attributes.listingType', size: 5 },
    },
    bedrooms: {
      terms: { field: 'attributes.bedrooms', size: 10, order: { _key: 'asc' } },
    },
    furnishing: {
      terms: { field: 'attributes.furnishing', size: 5 },
    },
    tenure: {
      terms: { field: 'attributes.tenure', size: 5 },
    },
    facilities: {
      terms: { field: 'attributes.facilities', size: 20 },
    },
    priceRange: {
      range: {
        field: 'price',
        ranges: [
          { key: 'below_100k', to: 100000 },
          { key: '100k_to_300k', from: 100000, to: 300000 },
          { key: '300k_to_500k', from: 300000, to: 500000 },
          { key: '500k_to_750k', from: 500000, to: 750000 },
          { key: '750k_to_1m', from: 750000, to: 1000000 },
          { key: '1m_to_2m', from: 1000000, to: 2000000 },
          { key: '2m_to_5m', from: 2000000, to: 5000000 },
          { key: 'above_5m', from: 5000000 },
        ],
      },
    },
    builtUpSizeRange: {
      range: {
        field: 'attributes.builtUpSize',
        ranges: [
          { key: 'below_500', to: 500 },
          { key: '500_to_1000', from: 500, to: 1000 },
          { key: '1000_to_1500', from: 1000, to: 1500 },
          { key: '1500_to_2000', from: 1500, to: 2000 },
          { key: '2000_to_3000', from: 2000, to: 3000 },
          { key: 'above_3000', from: 3000 },
        ],
      },
    },
    city: {
      terms: { field: 'location.city', size: 50 },
    },
    state: {
      terms: { field: 'location.state', size: 20 },
    },
  };
}
