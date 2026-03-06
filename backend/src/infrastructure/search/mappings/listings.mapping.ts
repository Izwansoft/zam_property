export const LISTINGS_INDEX_TEMPLATE = {
  index_patterns: ['listings-*'],
  template: {
    settings: {
      number_of_shards: 1,
      number_of_replicas: 1,
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
    mappings: {
      dynamic: 'strict',
      properties: {
        // Identity
        id: { type: 'keyword' },
        partnerId: { type: 'keyword' },
        vendorId: { type: 'keyword' },
        verticalType: { type: 'keyword' },

        // Status
        status: { type: 'keyword' },

        // Content
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

        // Price
        price: { type: 'scaled_float', scaling_factor: 100 },
        currency: { type: 'keyword' },

        // Location
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

        // Attributes (vertical-specific, dynamic based on vertical)
        attributes: {
          type: 'object',
          dynamic: true,
          properties: {
            // Pre-define fields used in aggregations / sorting
            propertyType: { type: 'keyword' },
            listingType: { type: 'keyword' },
            furnishing: { type: 'keyword' },
            tenure: { type: 'keyword' },
            bedrooms: { type: 'integer' },
            bathrooms: { type: 'integer' },
            builtUpSqft: { type: 'float' },
            landSqft: { type: 'float' },
            parking: { type: 'integer' },
            buildYear: { type: 'integer' },
          },
        },

        // Features
        isFeatured: { type: 'boolean' },
        featuredUntil: { type: 'date' },

        // Media
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
  },
};

export function getListingsIndexName(partnerId: string): string {
  return `listings-${partnerId}`;
}

export function getListingsIndexSettings() {
  return {
    settings: LISTINGS_INDEX_TEMPLATE.template.settings,
    mappings: LISTINGS_INDEX_TEMPLATE.template.mappings,
  };
}
