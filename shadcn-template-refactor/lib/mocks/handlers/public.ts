/**
 * MSW Handlers — Public Endpoints
 *
 * Mock handlers for public listing detail, vendor profile, and public search.
 * These endpoints require no authentication.
 *
 * @see docs/ai-prompt/part-26.md §26.6
 */

import { http, HttpResponse, delay } from "msw";
import {
  mockSuccessResponse,
  mockMetaPaginatedResponse,
  mockErrorResponse,
  mockTimestamp,
} from "../utils";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000/api/v1";

// =============================================================================
// MOCK DATA
// =============================================================================

const MOCK_PUBLIC_LISTINGS = [
  {
    id: "pub-listing-1",
    partnerId: "partner-1",
    vendorId: "vendor-1",
    verticalType: "REAL_ESTATE",
    schemaVersion: "1.0",
    title: "Modern Condo in Bukit Bintang",
    description:
      "Beautiful modern condominium located in the heart of Bukit Bintang, Kuala Lumpur. This fully furnished unit features a spacious living area, modern kitchen, and stunning city views. Walking distance to Pavilion KL, public transport, and dining options.",
    slug: "modern-condo-bukit-bintang",
    price: 780000,
    currency: "MYR",
    priceType: "NEGOTIABLE" as const,
    location: {
      address: "Jalan Bukit Bintang, 55100 Kuala Lumpur",
      city: "Kuala Lumpur",
      state: "WP Kuala Lumpur",
      country: "Malaysia",
      postalCode: "55100",
      latitude: 3.1466,
      longitude: 101.7113,
    },
    attributes: {
      bedrooms: 3,
      bathrooms: 2,
      builtUpArea: 1200,
      furnishing: "FULLY_FURNISHED",
      parking: 2,
      propertyType: "CONDOMINIUM",
      tenure: "LEASEHOLD",
      buildYear: 2020,
    },
    status: "PUBLISHED",
    publishedAt: mockTimestamp(10),
    expiresAt: null,
    isFeatured: true,
    primaryImage:
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=600&fit=crop",
    viewCount: 1247,
    inquiryCount: 23,
    createdAt: mockTimestamp(30),
    updatedAt: mockTimestamp(5),
    vendor: {
      id: "vendor-1",
      name: "Sunrise Properties",
      slug: "sunrise-properties",
      logo: "https://i.pravatar.cc/80?img=1",
      rating: 4.8,
      reviewCount: 42,
      type: "AGENCY",
      phone: "+60 12-345 6789",
    },
    media: [
      {
        id: "media-1",
        filename: "main.jpg",
        mimeType: "image/jpeg",
        size: 245000,
        mediaType: "IMAGE" as const,
        cdnUrl:
          "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=600&fit=crop",
        thumbnailUrl:
          "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=200&h=150&fit=crop",
        sortOrder: 0,
        isPrimary: true,
        altText: "Modern condo living room",
      },
      {
        id: "media-2",
        filename: "bedroom.jpg",
        mimeType: "image/jpeg",
        size: 198000,
        mediaType: "IMAGE" as const,
        cdnUrl:
          "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop",
        thumbnailUrl:
          "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=200&h=150&fit=crop",
        sortOrder: 1,
        isPrimary: false,
        altText: "Master bedroom",
      },
      {
        id: "media-3",
        filename: "kitchen.jpg",
        mimeType: "image/jpeg",
        size: 187000,
        mediaType: "IMAGE" as const,
        cdnUrl:
          "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop",
        thumbnailUrl:
          "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=200&h=150&fit=crop",
        sortOrder: 2,
        isPrimary: false,
        altText: "Modern kitchen",
      },
      {
        id: "media-4",
        filename: "exterior.jpg",
        mimeType: "image/jpeg",
        size: 220000,
        mediaType: "IMAGE" as const,
        cdnUrl:
          "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&h=600&fit=crop",
        thumbnailUrl:
          "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=200&h=150&fit=crop",
        sortOrder: 3,
        isPrimary: false,
        altText: "Building exterior",
      },
      {
        id: "media-5",
        filename: "pool.jpg",
        mimeType: "image/jpeg",
        size: 210000,
        mediaType: "IMAGE" as const,
        cdnUrl:
          "https://images.unsplash.com/photo-1575517111478-7f6afd0973db?w=800&h=600&fit=crop",
        thumbnailUrl:
          "https://images.unsplash.com/photo-1575517111478-7f6afd0973db?w=200&h=150&fit=crop",
        sortOrder: 4,
        isPrimary: false,
        altText: "Swimming pool",
      },
    ],
  },
  {
    id: "pub-listing-2",
    partnerId: "partner-1",
    vendorId: "vendor-2",
    verticalType: "REAL_ESTATE",
    schemaVersion: "1.0",
    title: "Spacious Semi-D in Bangsar",
    description:
      "Spacious semi-detached house in Bangsar with large garden and private pool. Perfect for families looking for a premium address in KL.",
    slug: "spacious-semi-d-bangsar",
    price: 2500000,
    currency: "MYR",
    priceType: "FIXED" as const,
    location: {
      address: "Jalan Bangsar, 59000 Kuala Lumpur",
      city: "Kuala Lumpur",
      state: "WP Kuala Lumpur",
      country: "Malaysia",
      postalCode: "59000",
      latitude: 3.1295,
      longitude: 101.6739,
    },
    attributes: {
      bedrooms: 5,
      bathrooms: 4,
      builtUpArea: 3500,
      landArea: 5000,
      furnishing: "PARTLY_FURNISHED",
      parking: 4,
      propertyType: "SEMI_DETACHED",
      tenure: "FREEHOLD",
      buildYear: 2015,
    },
    status: "PUBLISHED",
    publishedAt: mockTimestamp(5),
    expiresAt: null,
    isFeatured: false,
    primaryImage:
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop",
    viewCount: 856,
    inquiryCount: 15,
    createdAt: mockTimestamp(20),
    updatedAt: mockTimestamp(3),
    vendor: {
      id: "vendor-2",
      name: "Elite Realty Group",
      slug: "elite-realty-group",
      logo: "https://i.pravatar.cc/80?img=5",
      rating: 4.5,
      reviewCount: 28,
      type: "AGENCY",
      phone: "+60 12-987 6543",
    },
    media: [
      {
        id: "media-10",
        filename: "front.jpg",
        mimeType: "image/jpeg",
        size: 260000,
        mediaType: "IMAGE" as const,
        cdnUrl:
          "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop",
        thumbnailUrl:
          "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=200&h=150&fit=crop",
        sortOrder: 0,
        isPrimary: true,
        altText: "House front view",
      },
    ],
  },
  {
    id: "pub-listing-3",
    partnerId: "partner-1",
    vendorId: "vendor-1",
    verticalType: "REAL_ESTATE",
    schemaVersion: "1.0",
    title: "Studio Apartment in Mont Kiara",
    description:
      "Cozy studio apartment in Mont Kiara with full facilities. Great investment opportunity.",
    slug: "studio-apartment-mont-kiara",
    price: 350000,
    currency: "MYR",
    priceType: "NEGOTIABLE" as const,
    location: {
      address: "Mont Kiara, 50480 Kuala Lumpur",
      city: "Kuala Lumpur",
      state: "WP Kuala Lumpur",
      country: "Malaysia",
      postalCode: "50480",
    },
    attributes: {
      bedrooms: 1,
      bathrooms: 1,
      builtUpArea: 550,
      furnishing: "FULLY_FURNISHED",
      parking: 1,
      propertyType: "APARTMENT",
      tenure: "LEASEHOLD",
    },
    status: "PUBLISHED",
    publishedAt: mockTimestamp(2),
    expiresAt: null,
    isFeatured: true,
    primaryImage:
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop",
    viewCount: 432,
    inquiryCount: 8,
    createdAt: mockTimestamp(15),
    updatedAt: mockTimestamp(1),
    vendor: {
      id: "vendor-1",
      name: "Sunrise Properties",
      slug: "sunrise-properties",
      logo: "https://i.pravatar.cc/80?img=1",
      rating: 4.8,
      reviewCount: 42,
      type: "AGENCY",
      phone: "+60 12-345 6789",
    },
    media: [],
  },
  {
    id: "pub-listing-4",
    partnerId: "partner-1",
    vendorId: "vendor-3",
    verticalType: "REAL_ESTATE",
    schemaVersion: "1.0",
    title: "Penthouse in KLCC",
    description:
      "Luxury penthouse with panoramic KLCC views. Premium finishes throughout.",
    slug: "penthouse-klcc",
    price: 5800000,
    currency: "MYR",
    priceType: "UPON_REQUEST" as const,
    location: {
      address: "KLCC, 50088 Kuala Lumpur",
      city: "Kuala Lumpur",
      state: "WP Kuala Lumpur",
      country: "Malaysia",
      postalCode: "50088",
    },
    attributes: {
      bedrooms: 4,
      bathrooms: 5,
      builtUpArea: 4500,
      furnishing: "FULLY_FURNISHED",
      parking: 3,
      propertyType: "PENTHOUSE",
      tenure: "FREEHOLD",
      buildYear: 2022,
    },
    status: "PUBLISHED",
    publishedAt: mockTimestamp(1),
    expiresAt: null,
    isFeatured: true,
    primaryImage:
      "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&h=600&fit=crop",
    viewCount: 2100,
    inquiryCount: 45,
    createdAt: mockTimestamp(10),
    updatedAt: mockTimestamp(0),
    vendor: {
      id: "vendor-3",
      name: "Premium Living Sdn Bhd",
      slug: "premium-living",
      logo: "https://i.pravatar.cc/80?img=9",
      rating: 4.9,
      reviewCount: 67,
      type: "DEVELOPER",
      phone: "+60 3-2345 6789",
    },
    media: [],
  },
];

const MOCK_PUBLIC_VENDORS = [
  {
    id: "vendor-1",
    partnerId: "partner-1",
    name: "Sunrise Properties",
    slug: "sunrise-properties",
    type: "AGENCY",
    email: "info@sunriseproperties.com.my",
    phone: "+60 12-345 6789",
    description:
      "Sunrise Properties is a leading real estate agency in Kuala Lumpur, specializing in premium condominiums and residential properties. With over 10 years of experience, we help clients find their dream homes.",
    logo: "https://i.pravatar.cc/80?img=1",
    address: {
      line1: "Level 12, Tower A, The Vertical",
      line2: "Bangsar South",
      city: "Kuala Lumpur",
      state: "WP Kuala Lumpur",
      postalCode: "59200",
      country: "Malaysia",
    },
    listingCount: 45,
    activeListingCount: 28,
    rating: 4.8,
    reviewCount: 42,
    createdAt: mockTimestamp(365),
    updatedAt: mockTimestamp(1),
  },
  {
    id: "vendor-2",
    partnerId: "partner-1",
    name: "Elite Realty Group",
    slug: "elite-realty-group",
    type: "AGENCY",
    email: "contact@eliterealty.com.my",
    phone: "+60 12-987 6543",
    description:
      "Elite Realty Group provides premium real estate services across Malaysia. We specialize in luxury landed properties and high-end condominiums.",
    logo: "https://i.pravatar.cc/80?img=5",
    address: {
      line1: "Suite 8-01, Wisma UOA Damansara",
      city: "Petaling Jaya",
      state: "Selangor",
      postalCode: "47400",
      country: "Malaysia",
    },
    listingCount: 32,
    activeListingCount: 18,
    rating: 4.5,
    reviewCount: 28,
    createdAt: mockTimestamp(500),
    updatedAt: mockTimestamp(2),
  },
  {
    id: "vendor-3",
    partnerId: "partner-1",
    name: "Premium Living Sdn Bhd",
    slug: "premium-living",
    type: "DEVELOPER",
    email: "sales@premiumliving.com.my",
    phone: "+60 3-2345 6789",
    description:
      "Premium Living is a property developer focused on luxury high-rise developments in prime KL locations.",
    logo: "https://i.pravatar.cc/80?img=9",
    address: {
      line1: "Level 30, Menara KL",
      city: "Kuala Lumpur",
      state: "WP Kuala Lumpur",
      postalCode: "50450",
      country: "Malaysia",
    },
    listingCount: 12,
    activeListingCount: 8,
    rating: 4.9,
    reviewCount: 67,
    createdAt: mockTimestamp(200),
    updatedAt: mockTimestamp(0),
  },
];

// =============================================================================
// HANDLERS
// =============================================================================

export const publicHandlers = [
  // ---------------------------------------------------------------------------
  // GET /public/listings/:idOrSlug — Public listing detail
  // ---------------------------------------------------------------------------
  http.get(`${API_BASE}/public/listings/:idOrSlug`, async ({ params }) => {
    await delay(200);

    const { idOrSlug } = params;
    const listing = MOCK_PUBLIC_LISTINGS.find(
      (l) => l.id === idOrSlug || l.slug === idOrSlug,
    );

    if (!listing) {
      return HttpResponse.json(
        mockErrorResponse("NOT_FOUND", "Listing not found"),
        { status: 404 },
      );
    }

    return HttpResponse.json(mockSuccessResponse(listing));
  }),

  // ---------------------------------------------------------------------------
  // GET /public/vendors/:idOrSlug — Public vendor profile
  // ---------------------------------------------------------------------------
  http.get(`${API_BASE}/public/vendors/:idOrSlug`, async ({ params }) => {
    await delay(200);

    const { idOrSlug } = params;
    const vendor = MOCK_PUBLIC_VENDORS.find(
      (v) => v.id === idOrSlug || v.slug === idOrSlug,
    );

    if (!vendor) {
      return HttpResponse.json(
        mockErrorResponse("NOT_FOUND", "Vendor not found"),
        { status: 404 },
      );
    }

    return HttpResponse.json(mockSuccessResponse(vendor));
  }),

  // ---------------------------------------------------------------------------
  // GET /public/search/listings — Public listing search
  // ---------------------------------------------------------------------------
  http.get(`${API_BASE}/public/search/listings`, async ({ request }) => {
    await delay(300);

    const url = new URL(request.url);
    const q = url.searchParams.get("q")?.toLowerCase() ?? "";
    const verticalType = url.searchParams.get("verticalType") ?? "";
    const city = url.searchParams.get("city") ?? "";
    const vendorId = url.searchParams.get("vendorId") ?? "";
    const priceMin = url.searchParams.get("priceMin");
    const priceMax = url.searchParams.get("priceMax");
    const sort = url.searchParams.get("sort") ?? "relevance";
    const page = parseInt(url.searchParams.get("page") ?? "1", 10);
    const pageSize = parseInt(url.searchParams.get("pageSize") ?? "20", 10);

    // Filter
    let results = [...MOCK_PUBLIC_LISTINGS];

    if (q) {
      results = results.filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          l.description.toLowerCase().includes(q),
      );
    }

    if (verticalType) {
      results = results.filter((l) => l.verticalType === verticalType);
    }

    if (city) {
      results = results.filter(
        (l) => l.location.city?.toLowerCase() === city.toLowerCase(),
      );
    }

    if (vendorId) {
      results = results.filter(
        (l) =>
          l.vendorId === vendorId ||
          l.vendor?.id === vendorId ||
          l.vendor?.slug === vendorId,
      );
    }

    if (priceMin) {
      results = results.filter((l) => l.price >= Number(priceMin));
    }
    if (priceMax) {
      results = results.filter((l) => l.price <= Number(priceMax));
    }

    // Sort
    if (sort === "price:asc") {
      results.sort((a, b) => a.price - b.price);
    } else if (sort === "price:desc") {
      results.sort((a, b) => b.price - a.price);
    } else if (sort === "newest") {
      results.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    }

    // Transform to SearchHit format
    const total = results.length;
    const paged = results.slice((page - 1) * pageSize, page * pageSize);

    const hits = paged.map((l) => ({
      id: l.id,
      title: l.title,
      slug: l.slug,
      price: l.price,
      currency: l.currency,
      location: {
        city: l.location.city ?? "",
        state: l.location.state ?? "",
        country: l.location.country ?? "",
      },
      primaryImageUrl: l.primaryImage,
      verticalType: l.verticalType,
      attributes: l.attributes,
      vendor: {
        id: l.vendor?.id ?? l.vendorId,
        name: l.vendor?.name ?? "Unknown",
        slug: l.vendor?.slug ?? "",
      },
      isFeatured: l.isFeatured,
    }));

    return HttpResponse.json(
      mockMetaPaginatedResponse(hits, page, pageSize, total, {
        verticalTypes: [
          { value: "REAL_ESTATE", label: "Real Estate", count: total },
        ],
        cities: [
          { value: "Kuala Lumpur", label: "Kuala Lumpur", count: total },
        ],
      }),
    );
  }),
];
