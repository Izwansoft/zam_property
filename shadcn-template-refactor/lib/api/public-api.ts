/**
 * Public API Utilities
 *
 * Server-side fetch utilities for public endpoints.
 * Used by Server Components to fetch data without authentication.
 * Includes ISR-compatible caching and 429 rate-limit handling.
 *
 * @see docs/ai-prompt/part-26.md §26.6 - Public Pages
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PublicListingDetail {
  id: string;
  partnerId: string;
  vendorId: string;
  verticalType: string;
  title: string;
  description?: string;
  slug: string;
  price: number;
  currency: string;
  priceType?: "FIXED" | "NEGOTIABLE" | "STARTING_FROM" | "UPON_REQUEST" | "monthly";
  location: {
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    latitude?: number;
    longitude?: number;
  };
  attributes: Record<string, unknown>;
  status: string;
  publishedAt?: string | null;
  expiresAt?: string | null;
  isFeatured: boolean;
  primaryImage?: string | null;
  viewCount: number;
  inquiryCount?: number;
  createdAt: string;
  updatedAt: string;
  vendor?: {
    id: string;
    name: string;
    slug: string;
    logo?: string | null;
    rating?: number;
    reviewCount?: number;
    type?: string;
    phone?: string;
    email?: string;
  };
  media?: Array<{
    id: string;
    mediaType: "IMAGE" | "VIDEO" | "DOCUMENT";
    url: string;
    thumbnailUrl?: string;
    sortOrder: number;
    altText?: string;
  }>;
}

export interface PublicVendorProfile {
  id: string;
  partnerId: string;
  name: string;
  slug: string;
  type: string;
  email?: string;
  phone?: string;
  description?: string;
  logo?: string | null;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  listingCount: number;
  activeListingCount: number;
  rating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PublicSearchHit {
  id: string;
  title: string;
  slug: string;
  price: number;
  currency: string;
  location: {
    city: string;
    state: string;
    country: string;
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
}

export interface PublicSearchResponse {
  data: PublicSearchHit[];
  meta: {
    requestId: string;
    pagination: {
      page: number;
      pageSize: number;
      totalItems: number;
      totalPages: number;
    };
  };
}

// ---------------------------------------------------------------------------
// Rate Limit Error
// ---------------------------------------------------------------------------

export class RateLimitError extends Error {
  retryAfter: number;

  constructor(retryAfter: number) {
    super("Rate limit exceeded");
    this.name = "RateLimitError";
    this.retryAfter = retryAfter;
  }
}

// ---------------------------------------------------------------------------
// Base URL
// ---------------------------------------------------------------------------

const API_BASE_URL =
  process.env.API_INTERNAL_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:3000/api/v1";

/** Default partner for server-side public requests */
const DEFAULT_PARTNER_ID =
  process.env.NEXT_PUBLIC_DEFAULT_PARTNER || "lamaniaga";

// ---------------------------------------------------------------------------
// Server-Side Fetch Helper
// ---------------------------------------------------------------------------

interface FetchOptions {
  /** ISR revalidation in seconds (default 60) */
  revalidate?: number;
  /** Additional search params */
  params?: Record<string, string | number | undefined>;
}

async function publicFetch<T>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const { revalidate = 60, params } = options;

  const url = new URL(`${API_BASE_URL}${path}`);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const res = await fetch(url.toString(), {
    next: { revalidate },
    headers: {
      "Content-Type": "application/json",
      "X-Client": "zam-property-web",
      "X-Partner-ID": DEFAULT_PARTNER_ID,
    },
  });

  // Handle 429 rate limit
  if (res.status === 429) {
    const retryAfter = parseInt(res.headers.get("Retry-After") || "60", 10);
    throw new RateLimitError(retryAfter);
  }

  if (res.status === 404) {
    return null as T;
  }

  if (!res.ok) {
    throw new Error(`Public API error: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  return json.data ?? json;
}

// ---------------------------------------------------------------------------
// Public API Functions
// ---------------------------------------------------------------------------

/**
 * Fetch a single listing by ID or slug (public, no auth).
 */
export async function fetchPublicListing(
  idOrSlug: string,
): Promise<PublicListingDetail | null> {
  return publicFetch<PublicListingDetail | null>(
    `/public/listings/${encodeURIComponent(idOrSlug)}`,
    { revalidate: 60 },
  );
}

/**
 * Fetch a vendor profile by ID or slug (public, no auth).
 */
export async function fetchPublicVendor(
  idOrSlug: string,
): Promise<PublicVendorProfile | null> {
  return publicFetch<PublicVendorProfile | null>(
    `/public/vendors/${encodeURIComponent(idOrSlug)}`,
    { revalidate: 120 },
  );
}

/**
 * Fetch public search results (rate-limited, no auth).
 */
export async function fetchPublicSearch(
  params: Record<string, string | number | undefined> = {},
): Promise<PublicSearchResponse> {
  return publicFetch<PublicSearchResponse>("/public/search/listings", {
    revalidate: 30,
    params,
  });
}

/**
 * Fetch related listings for a given listing (same vertical, same city).
 */
export async function fetchRelatedListings(
  listing: PublicListingDetail,
  limit = 4,
): Promise<PublicSearchHit[]> {
  try {
    const response = await fetchPublicSearch({
      verticalType: listing.verticalType,
      city: listing.location?.city,
      pageSize: limit + 1, // fetch extra to exclude self
      sort: "newest",
    });

    return response.data
      .filter((hit) => hit.id !== listing.id)
      .slice(0, limit);
  } catch {
    // Silently fail for related listings — non-critical
    return [];
  }
}

/**
 * Fetch listings for a specific vendor (public search with vendorId).
 */
export async function fetchVendorListings(
  vendorId: string,
  page = 1,
  pageSize = 12,
): Promise<PublicSearchResponse> {
  return fetchPublicSearch({
    vendorId,
    page,
    pageSize,
    sort: "newest",
  });
}
