// =============================================================================
// MSW Handlers — Search domain mock handlers
// =============================================================================
// Mocks:
//   GET /api/v1/search/listings (authenticated)
//   GET /api/v1/public/search/listings (public, rate-limited)
//   GET /api/v1/search/suggestions
// =============================================================================

import { http, HttpResponse, delay } from "msw";
import { mockMetaPaginatedResponse, mockSuccessResponse, mockTimestamp } from "../utils";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000/api/v1";

// ---------------------------------------------------------------------------
// Mock listing data for search results
// ---------------------------------------------------------------------------

const UNSPLASH_IMAGES = [
  "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=400&h=300&fit=crop",
];

interface MockSearchListing {
  id: string;
  title: string;
  slug: string;
  price: number;
  currency: string;
  location: { city: string; state: string; country: string };
  primaryImageUrl: string;
  verticalType: string;
  attributes: Record<string, unknown>;
  vendor: { id: string; name: string; slug: string };
  isFeatured: boolean;
  createdAt: string;
}

const MOCK_SEARCH_LISTINGS: MockSearchListing[] = [
  {
    id: "search-1",
    title: "Spacious Condo with KLCC View",
    slug: "spacious-condo-klcc-view",
    price: 850000,
    currency: "MYR",
    location: { city: "Kuala Lumpur", state: "Kuala Lumpur", country: "MY" },
    primaryImageUrl: UNSPLASH_IMAGES[0],
    verticalType: "REAL_ESTATE",
    attributes: {
      propertyType: "condominium",
      bedrooms: 3,
      bathrooms: 2,
      builtUpSqft: 1200,
      furnishing: "fully_furnished",
    },
    vendor: { id: "v-1", name: "Premium Properties Sdn Bhd", slug: "premium-properties" },
    isFeatured: true,
    createdAt: mockTimestamp(2),
  },
  {
    id: "search-2",
    title: "Modern Apartment in Mont Kiara",
    slug: "modern-apartment-mont-kiara",
    price: 620000,
    currency: "MYR",
    location: { city: "Kuala Lumpur", state: "Kuala Lumpur", country: "MY" },
    primaryImageUrl: UNSPLASH_IMAGES[1],
    verticalType: "REAL_ESTATE",
    attributes: {
      propertyType: "apartment",
      bedrooms: 2,
      bathrooms: 2,
      builtUpSqft: 900,
      furnishing: "partially_furnished",
    },
    vendor: { id: "v-2", name: "City Living Realty", slug: "city-living-realty" },
    isFeatured: false,
    createdAt: mockTimestamp(5),
  },
  {
    id: "search-3",
    title: "Luxury Bungalow with Pool in Damansara Heights",
    slug: "luxury-bungalow-damansara-heights",
    price: 3500000,
    currency: "MYR",
    location: { city: "Petaling Jaya", state: "Selangor", country: "MY" },
    primaryImageUrl: UNSPLASH_IMAGES[2],
    verticalType: "REAL_ESTATE",
    attributes: {
      propertyType: "bungalow",
      bedrooms: 5,
      bathrooms: 4,
      builtUpSqft: 4500,
      furnishing: "fully_furnished",
    },
    vendor: { id: "v-3", name: "Luxury Estates Malaysia", slug: "luxury-estates-my" },
    isFeatured: true,
    createdAt: mockTimestamp(1),
  },
  {
    id: "search-4",
    title: "Cozy Studio near LRT Kelana Jaya",
    slug: "cozy-studio-lrt-kelana-jaya",
    price: 280000,
    currency: "MYR",
    location: { city: "Petaling Jaya", state: "Selangor", country: "MY" },
    primaryImageUrl: UNSPLASH_IMAGES[3],
    verticalType: "REAL_ESTATE",
    attributes: {
      propertyType: "studio",
      bedrooms: 1,
      bathrooms: 1,
      builtUpSqft: 450,
      furnishing: "fully_furnished",
    },
    vendor: { id: "v-4", name: "Budget Homes PJ", slug: "budget-homes-pj" },
    isFeatured: false,
    createdAt: mockTimestamp(10),
  },
  {
    id: "search-5",
    title: "Family Semi-D in Bangsar South",
    slug: "family-semi-d-bangsar-south",
    price: 1800000,
    currency: "MYR",
    location: { city: "Kuala Lumpur", state: "Kuala Lumpur", country: "MY" },
    primaryImageUrl: UNSPLASH_IMAGES[4],
    verticalType: "REAL_ESTATE",
    attributes: {
      propertyType: "semi-detached",
      bedrooms: 4,
      bathrooms: 3,
      builtUpSqft: 2800,
      furnishing: "partially_furnished",
    },
    vendor: { id: "v-1", name: "Premium Properties Sdn Bhd", slug: "premium-properties" },
    isFeatured: false,
    createdAt: mockTimestamp(3),
  },
  {
    id: "search-6",
    title: "Penthouse Suite with Panoramic View",
    slug: "penthouse-panoramic-view",
    price: 2200000,
    currency: "MYR",
    location: { city: "Kuala Lumpur", state: "Kuala Lumpur", country: "MY" },
    primaryImageUrl: UNSPLASH_IMAGES[5],
    verticalType: "REAL_ESTATE",
    attributes: {
      propertyType: "penthouse",
      bedrooms: 4,
      bathrooms: 3,
      builtUpSqft: 3200,
      furnishing: "fully_furnished",
    },
    vendor: { id: "v-3", name: "Luxury Estates Malaysia", slug: "luxury-estates-my" },
    isFeatured: true,
    createdAt: mockTimestamp(7),
  },
  {
    id: "search-7",
    title: "Newly Renovated Terrace in Subang",
    slug: "renovated-terrace-subang",
    price: 680000,
    currency: "MYR",
    location: { city: "Subang Jaya", state: "Selangor", country: "MY" },
    primaryImageUrl: UNSPLASH_IMAGES[6],
    verticalType: "REAL_ESTATE",
    attributes: {
      propertyType: "terrace",
      bedrooms: 3,
      bathrooms: 2,
      builtUpSqft: 1800,
      furnishing: "unfurnished",
    },
    vendor: { id: "v-2", name: "City Living Realty", slug: "city-living-realty" },
    isFeatured: false,
    createdAt: mockTimestamp(15),
  },
  {
    id: "search-8",
    title: "Executive Apartment in Cyberjaya",
    slug: "executive-apartment-cyberjaya",
    price: 420000,
    currency: "MYR",
    location: { city: "Cyberjaya", state: "Selangor", country: "MY" },
    primaryImageUrl: UNSPLASH_IMAGES[7],
    verticalType: "REAL_ESTATE",
    attributes: {
      propertyType: "apartment",
      bedrooms: 2,
      bathrooms: 2,
      builtUpSqft: 1000,
      furnishing: "partially_furnished",
    },
    vendor: { id: "v-4", name: "Budget Homes PJ", slug: "budget-homes-pj" },
    isFeatured: false,
    createdAt: mockTimestamp(20),
  },
  {
    id: "search-9",
    title: "Townhouse with Private Garden in Shah Alam",
    slug: "townhouse-garden-shah-alam",
    price: 750000,
    currency: "MYR",
    location: { city: "Shah Alam", state: "Selangor", country: "MY" },
    primaryImageUrl: UNSPLASH_IMAGES[0],
    verticalType: "REAL_ESTATE",
    attributes: {
      propertyType: "townhouse",
      bedrooms: 3,
      bathrooms: 2,
      builtUpSqft: 1600,
      furnishing: "partially_furnished",
    },
    vendor: { id: "v-1", name: "Premium Properties Sdn Bhd", slug: "premium-properties" },
    isFeatured: false,
    createdAt: mockTimestamp(8),
  },
  {
    id: "search-10",
    title: "Affordable Flat in Puchong",
    slug: "affordable-flat-puchong",
    price: 190000,
    currency: "MYR",
    location: { city: "Puchong", state: "Selangor", country: "MY" },
    primaryImageUrl: UNSPLASH_IMAGES[1],
    verticalType: "REAL_ESTATE",
    attributes: {
      propertyType: "apartment",
      bedrooms: 3,
      bathrooms: 2,
      builtUpSqft: 850,
      furnishing: "unfurnished",
    },
    vendor: { id: "v-4", name: "Budget Homes PJ", slug: "budget-homes-pj" },
    isFeatured: false,
    createdAt: mockTimestamp(30),
  },
  {
    id: "search-11",
    title: "Premium Condo near Pavilion KL",
    slug: "premium-condo-pavilion-kl",
    price: 1100000,
    currency: "MYR",
    location: { city: "Kuala Lumpur", state: "Kuala Lumpur", country: "MY" },
    primaryImageUrl: UNSPLASH_IMAGES[2],
    verticalType: "REAL_ESTATE",
    attributes: {
      propertyType: "condominium",
      bedrooms: 3,
      bathrooms: 2,
      builtUpSqft: 1400,
      furnishing: "fully_furnished",
    },
    vendor: { id: "v-3", name: "Luxury Estates Malaysia", slug: "luxury-estates-my" },
    isFeatured: true,
    createdAt: mockTimestamp(4),
  },
  {
    id: "search-12",
    title: "Corner Lot Terrace in Kepong",
    slug: "corner-lot-terrace-kepong",
    price: 520000,
    currency: "MYR",
    location: { city: "Kepong", state: "Kuala Lumpur", country: "MY" },
    primaryImageUrl: UNSPLASH_IMAGES[3],
    verticalType: "REAL_ESTATE",
    attributes: {
      propertyType: "terrace",
      bedrooms: 4,
      bathrooms: 3,
      builtUpSqft: 2200,
      furnishing: "unfurnished",
    },
    vendor: { id: "v-2", name: "City Living Realty", slug: "city-living-realty" },
    isFeatured: false,
    createdAt: mockTimestamp(12),
  },
];

// ---------------------------------------------------------------------------
// Mock facets
// ---------------------------------------------------------------------------

function buildFacets(listings: MockSearchListing[]) {
  const verticalCounts = new Map<string, number>();
  const cityCounts = new Map<string, number>();
  const propertyTypeCounts = new Map<string, number>();
  const bedroomCounts = new Map<string, number>();
  const furnishingCounts = new Map<string, number>();

  for (const l of listings) {
    verticalCounts.set(l.verticalType, (verticalCounts.get(l.verticalType) || 0) + 1);
    cityCounts.set(l.location.city, (cityCounts.get(l.location.city) || 0) + 1);
    const pt = l.attributes.propertyType as string;
    if (pt) propertyTypeCounts.set(pt, (propertyTypeCounts.get(pt) || 0) + 1);
    const br = String(l.attributes.bedrooms);
    if (br) bedroomCounts.set(br, (bedroomCounts.get(br) || 0) + 1);
    const fn = l.attributes.furnishing as string;
    if (fn) furnishingCounts.set(fn, (furnishingCounts.get(fn) || 0) + 1);
  }

  const toFacet = (m: Map<string, number>) =>
    Array.from(m.entries())
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count);

  return {
    verticalTypes: toFacet(verticalCounts),
    cities: toFacet(cityCounts),
    propertyTypes: toFacet(propertyTypeCounts),
    bedrooms: toFacet(bedroomCounts),
    furnishing: toFacet(furnishingCounts),
    priceRanges: [
      { from: 0, to: 300000, count: listings.filter((l) => l.price < 300000).length },
      { from: 300000, to: 500000, count: listings.filter((l) => l.price >= 300000 && l.price < 500000).length },
      { from: 500000, to: 1000000, count: listings.filter((l) => l.price >= 500000 && l.price < 1000000).length },
      { from: 1000000, to: 2000000, count: listings.filter((l) => l.price >= 1000000 && l.price < 2000000).length },
      { from: 2000000, count: listings.filter((l) => l.price >= 2000000).length },
    ],
  };
}

// ---------------------------------------------------------------------------
// Filter + sort logic
// ---------------------------------------------------------------------------

function filterListings(
  listings: MockSearchListing[],
  params: URLSearchParams
): MockSearchListing[] {
  let filtered = [...listings];

  const q = params.get("q")?.toLowerCase();
  if (q) {
    filtered = filtered.filter(
      (l) =>
        l.title.toLowerCase().includes(q) ||
        l.location.city.toLowerCase().includes(q) ||
        (l.attributes.propertyType as string)?.toLowerCase().includes(q)
    );
  }

  const verticalType = params.get("verticalType");
  if (verticalType) {
    filtered = filtered.filter((l) => l.verticalType === verticalType);
  }

  const city = params.get("city");
  if (city) {
    filtered = filtered.filter((l) => l.location.city === city);
  }

  const priceMin = params.get("priceMin");
  if (priceMin) {
    filtered = filtered.filter((l) => l.price >= Number(priceMin));
  }

  const priceMax = params.get("priceMax");
  if (priceMax) {
    filtered = filtered.filter((l) => l.price <= Number(priceMax));
  }

  const featuredOnly = params.get("featuredOnly");
  if (featuredOnly === "true") {
    filtered = filtered.filter((l) => l.isFeatured);
  }

  // Attribute filters (attributes[propertyType][eq]=condominium)
  const propertyType = params.get("attributes[propertyType][eq]");
  if (propertyType) {
    filtered = filtered.filter((l) => l.attributes.propertyType === propertyType);
  }

  const bedrooms = params.get("attributes[bedrooms][eq]");
  if (bedrooms) {
    filtered = filtered.filter((l) => String(l.attributes.bedrooms) === bedrooms);
  }

  const furnishing = params.get("attributes[furnishing][eq]");
  if (furnishing) {
    filtered = filtered.filter((l) => l.attributes.furnishing === furnishing);
  }

  return filtered;
}

function sortListings(
  listings: MockSearchListing[],
  sort: string | null
): MockSearchListing[] {
  const sorted = [...listings];

  switch (sort) {
    case "newest":
      return sorted.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    case "oldest":
      return sorted.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    case "price:asc":
      return sorted.sort((a, b) => a.price - b.price);
    case "price:desc":
      return sorted.sort((a, b) => b.price - a.price);
    case "relevance":
    default:
      // Featured first, then by date
      return sorted.sort((a, b) => {
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }
}

// ---------------------------------------------------------------------------
// Add highlights to matching results
// ---------------------------------------------------------------------------

function addHighlights(
  listing: MockSearchListing,
  query: string | null
): Record<string, string[]> | undefined {
  if (!query) return undefined;

  const q = query.toLowerCase();
  const highlights: Record<string, string[]> = {};

  if (listing.title.toLowerCase().includes(q)) {
    const regex = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    highlights.title = [listing.title.replace(regex, "<mark>$1</mark>")];
  }

  return Object.keys(highlights).length > 0 ? highlights : undefined;
}

// ---------------------------------------------------------------------------
// Transform to search hit format
// ---------------------------------------------------------------------------

function toSearchHit(
  listing: MockSearchListing,
  query: string | null
): Record<string, unknown> {
  return {
    id: listing.id,
    title: listing.title,
    slug: listing.slug,
    price: listing.price,
    currency: listing.currency,
    location: listing.location,
    primaryImageUrl: listing.primaryImageUrl,
    verticalType: listing.verticalType,
    attributes: listing.attributes,
    vendor: listing.vendor,
    isFeatured: listing.isFeatured,
    highlights: addHighlights(listing, query),
  };
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

function searchHandler(url: URL) {
  const params = url.searchParams;
  const page = Number(params.get("page")) || 1;
  const pageSize = Number(params.get("pageSize")) || 20;
  const sort = params.get("sort");
  const q = params.get("q");

  // Filter then sort
  let results = filterListings(MOCK_SEARCH_LISTINGS, params);
  results = sortListings(results, sort);

  const totalItems = results.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIdx = (page - 1) * pageSize;
  const pageItems = results.slice(startIdx, startIdx + pageSize);

  // Build facets from filtered results
  const facets = buildFacets(results);

  // Transform to search hits
  const searchHits = pageItems.map((l) => toSearchHit(l, q));

  return {
    data: searchHits,
    meta: {
      requestId: `mock-search-${Date.now()}`,
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages,
      },
      facets,
    },
  };
}

export const searchHandlers = [
  // GET /api/v1/search/listings (authenticated)
  http.get(`${API_BASE}/search/listings`, async ({ request }) => {
    await delay(300);
    const url = new URL(request.url);
    const result = searchHandler(url);
    return HttpResponse.json(result);
  }),

  // GET /api/v1/public/search/listings (public)
  http.get(`${API_BASE}/public/search/listings`, async ({ request }) => {
    await delay(400);
    const url = new URL(request.url);
    const result = searchHandler(url);
    return HttpResponse.json(result);
  }),

  // GET /api/v1/search/suggestions
  http.get(`${API_BASE}/search/suggestions`, async ({ request }) => {
    await delay(150);
    const url = new URL(request.url);
    const q = url.searchParams.get("q")?.toLowerCase() || "";

    if (q.length < 2) {
      return HttpResponse.json(
        mockSuccessResponse({ suggestions: [] })
      );
    }

    // Filter listings that match the query
    const matching = MOCK_SEARCH_LISTINGS.filter(
      (l) =>
        l.title.toLowerCase().includes(q) ||
        l.location.city.toLowerCase().includes(q) ||
        (l.attributes.propertyType as string)?.toLowerCase().includes(q)
    ).slice(0, 5);

    const suggestions = matching.map((l) => ({
      id: l.id,
      title: l.title,
      slug: l.slug,
      price: l.price,
      city: l.location.city,
    }));

    return HttpResponse.json(
      mockSuccessResponse({ suggestions })
    );
  }),
];
