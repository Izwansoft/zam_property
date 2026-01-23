// Search Document Types
export interface ListingSearchDocument extends Record<string, unknown> {
  id: string;
  tenantId: string;
  vendorId: string;
  verticalType: string;
  status: string;
  title: string;
  description: string;
  slug: string;
  price: number;
  currency: string;
  location?: {
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    coordinates?: {
      lat: number;
      lon: number;
    };
  };
  attributes?: Record<string, unknown>;
  isFeatured: boolean;
  featuredUntil?: string;
  primaryImageUrl?: string;
  mediaCount: number;
  vendor?: {
    id: string;
    name: string;
    slug: string;
  };
  publishedAt?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Search Filters
export interface SearchFilters {
  verticalType?: string;
  priceMin?: number;
  priceMax?: number;
  city?: string;
  state?: string;
  country?: string;
  location?: {
    lat: number;
    lng: number;
    radius: number;
  };
  attributes?: Record<
    string,
    {
      eq?: unknown;
      in?: unknown[];
      gte?: number;
      lte?: number;
    }
  >;
  featuredOnly?: boolean;
  vendorId?: string;
}

// Search Query
export interface SearchListingsQuery {
  q?: string;
  filters?: SearchFilters;
  sort?: string;
  page?: number;
  pageSize?: number;
  highlight?: boolean;
  verticalType?: string;
}

// Search Result
export interface SearchResult<T> {
  hits: T[];
  total: number;
  aggregations?: Record<string, unknown>;
}

// Suggestion
export interface Suggestion {
  id: string;
  title: string;
  slug: string;
  price?: number;
  city?: string;
}

// Bulk Index Result
export interface BulkIndexResult {
  total: number;
  successful: number;
  failed: number;
}

// Reindex Result
export interface ReindexResult {
  indexed: number;
}
