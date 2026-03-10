// =============================================================================
// Search Module — Domain Type Definitions
// =============================================================================
// Maps to backend OpenSearch-powered search API contracts.
// Endpoints:
//   GET /api/v1/search/listings (authenticated)
//   GET /api/v1/public/search/listings (public, rate-limited)
//   GET /api/v1/search/suggestions
// =============================================================================

// ---------------------------------------------------------------------------
// Search Params
// ---------------------------------------------------------------------------

export interface SearchParams {
  /** Free-text search query */
  q?: string;
  /** Filter by vertical type (e.g., "REAL_ESTATE", "AUTOMOTIVE") */
  verticalType?: string;
  /** Listing type: "sale" or "rent" */
  listingType?: string;
  /** Property type filter (e.g., "condominium", "terrace") */
  propertyType?: string;
  /** Minimum bedrooms filter */
  bedroomsMin?: number;
  /** Minimum price filter */
  priceMin?: number;
  /** Maximum price filter */
  priceMax?: number;
  /** City filter */
  city?: string;
  /** State filter */
  state?: string;
  /** Latitude for geo-based search */
  lat?: number;
  /** Longitude for geo-based search */
  lng?: number;
  /** Search radius in km (requires lat/lng) */
  radius?: number;
  /** Vertical-specific attribute filters */
  attributes?: Record<string, AttributeFilter>;
  /** Sort order */
  sort?: SearchSort;
  /** Page number (1-indexed) */
  page?: number;
  /** Items per page */
  pageSize?: number;
  /** Enable search term highlighting */
  highlight?: boolean;
  /** Show featured listings only */
  featuredOnly?: boolean;
}

export interface AttributeFilter {
  eq?: string | number | boolean;
  in?: (string | number)[];
  gte?: number;
  lte?: number;
}

export type SearchSort =
  | "relevance"
  | "newest"
  | "oldest"
  | "price:asc"
  | "price:desc";

// ---------------------------------------------------------------------------
// Search Response
// ---------------------------------------------------------------------------

export interface SearchResponse {
  data: SearchHit[];
  meta: {
    requestId: string;
    pagination: {
      page: number;
      pageSize: number;
      totalItems: number;
      totalPages: number;
    };
    facets?: SearchFacets;
  };
}

// ---------------------------------------------------------------------------
// Facets
// ---------------------------------------------------------------------------

export interface SearchFacets {
  verticalTypes?: FacetBucket[];
  cities?: FacetBucket[];
  priceRanges?: RangeBucket[];
  propertyTypes?: FacetBucket[];
  bedrooms?: FacetBucket[];
  furnishing?: FacetBucket[];
  [key: string]: FacetBucket[] | RangeBucket[] | undefined;
}

export interface FacetBucket {
  value: string;
  count: number;
}

export interface RangeBucket {
  from?: number;
  to?: number;
  count: number;
}

export interface FacetOption {
  value: string;
  label: string;
  count: number;
}

// ---------------------------------------------------------------------------
// Search Hit (listing result)
// ---------------------------------------------------------------------------

export interface SearchHit {
  id: string;
  title: string;
  slug: string;
  price: number;
  currency: string;
  location: {
    city: string;
    state: string;
    country: string;
    /** Available when backend returns geo data (e.g., geo search) */
    latitude?: number;
    /** Available when backend returns geo data (e.g., geo search) */
    longitude?: number;
  };
  primaryImageUrl?: string;
  verticalType: string;
  attributes: Record<string, unknown>;
  vendor: {
    id: string;
    name: string;
    slug: string;
  };
  isFeatured: boolean;
  highlights?: {
    title?: string[];
    description?: string[];
  };
}

// ---------------------------------------------------------------------------
// Autocomplete Suggestion
// ---------------------------------------------------------------------------

export interface Suggestion {
  id: string;
  title: string;
  slug: string;
  price: number;
  city?: string;
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

export const DEFAULT_SEARCH_PARAMS: SearchParams = {
  q: "",
  sort: "relevance",
  page: 1,
  pageSize: 20,
  highlight: true,
};

export const SEARCH_SORT_OPTIONS: { value: SearchSort; label: string }[] = [
  { value: "relevance", label: "Relevance" },
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "price:asc", label: "Price: Low to High" },
  { value: "price:desc", label: "Price: High to Low" },
];
