// =============================================================================
// MSW Handlers — Listings domain mock handlers
// =============================================================================

import { http, HttpResponse, delay } from "msw";
import {
  mockSuccessResponse,
  mockPaginatedResponse,
  mockErrorResponse,
  mockTimestamp,
} from "../utils";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000/api/v1";

// ---------------------------------------------------------------------------
// Realistic listing data
// ---------------------------------------------------------------------------

const PROPERTY_TYPES = [
  "condominium", "apartment", "bungalow", "semi-detached",
  "terrace", "studio", "penthouse", "townhouse",
];

const LISTING_TITLES = [
  "Spacious Condo with KLCC View",
  "Modern Apartment in Mont Kiara",
  "Luxury Bungalow with Pool",
  "Cozy Studio near LRT",
  "Family Home in Damansara Heights",
  "Penthouse Suite with Panoramic View",
  "Newly Renovated Terrace House",
  "Semi-D in Bangsar South",
  "Townhouse with Private Garden",
  "Executive Apartment in Cyberjaya",
];

const CITIES = [
  "Kuala Lumpur", "Petaling Jaya", "Shah Alam",
  "Subang Jaya", "Cyberjaya", "Putrajaya",
  "Ampang", "Cheras", "Puchong", "Kepong",
];

const STATES = [
  "Kuala Lumpur", "Selangor", "Selangor",
  "Selangor", "Selangor", "Putrajaya",
  "Selangor", "Kuala Lumpur", "Selangor", "Kuala Lumpur",
];

const FURNISHING = ["fully_furnished", "partially_furnished", "unfurnished"] as const;
const STATUSES = ["DRAFT", "PUBLISHED", "PUBLISHED", "PUBLISHED", "EXPIRED", "ARCHIVED"] as const;
const LISTING_TYPES = ["sale", "rent"] as const;

const UNSPLASH_IMAGES = [
  "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=400&h=300&fit=crop",
];

const MOCK_LISTINGS = Array.from({ length: 48 }, (_, i) => {
  const cityIdx = i % CITIES.length;
  const price = LISTING_TYPES[i % 2] === "rent"
    ? 1500 + (i * 200)
    : 250000 + i * 75000;

  return {
    id: `listing-${String(i + 1).padStart(3, "0")}`,
    title: LISTING_TITLES[i % LISTING_TITLES.length],
    slug: `listing-${i + 1}-${LISTING_TITLES[i % LISTING_TITLES.length].toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}`,
    description: `Beautiful property located in ${CITIES[cityIdx]} with excellent amenities, transport links, and nearby shopping malls. Perfect for families and professionals seeking a comfortable living space.`,
    price,
    currency: "MYR",
    priceType: i % 5 === 0 ? "NEGOTIABLE" : "FIXED",
    status: STATUSES[i % STATUSES.length],
    verticalType: "REAL_ESTATE",
    schemaVersion: "1.0",
    partnerId: "partner-001",
    vendorId: `vendor-${String((i % 3) + 1).padStart(3, "0")}`,
    location: {
      address: `${i + 1} Jalan Bukit Bintang`,
      city: CITIES[cityIdx],
      state: STATES[cityIdx],
      country: "MY",
      postalCode: `${50000 + i * 100}`,
    },
    primaryImage: UNSPLASH_IMAGES[i % UNSPLASH_IMAGES.length],
    images: [],
    attributes: {
      propertyType: PROPERTY_TYPES[i % PROPERTY_TYPES.length],
      listingType: LISTING_TYPES[i % 2],
      bedrooms: (i % 5) + 1,
      bathrooms: (i % 3) + 1,
      builtUpSize: 600 + i * 80,
      landSize: i % 3 === 0 ? 1200 + i * 100 : undefined,
      furnishing: FURNISHING[i % 3],
    },
    isFeatured: i % 7 === 0,
    featuredUntil: i % 7 === 0 ? mockTimestamp(-30) : null,
    publishedAt: STATUSES[i % STATUSES.length] === "PUBLISHED" ? mockTimestamp(30 - i) : null,
    expiresAt: STATUSES[i % STATUSES.length] === "PUBLISHED" ? mockTimestamp(-(60 - i)) : null,
    viewCount: Math.floor(Math.random() * 800) + 10,
    inquiryCount: Math.floor(Math.random() * 30),
    createdAt: mockTimestamp(90 - i),
    updatedAt: mockTimestamp(i % 15),
  };
});

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

export const listingHandlers = [
  // POST /listings (create new listing as DRAFT)
  http.post(`${API_BASE}/listings`, async ({ request }) => {
    await delay(500);

    const body = (await request.json()) as Record<string, unknown>;

    // Validate required fields
    if (!body.verticalType || !body.title) {
      const details: Array<{ field: string; code: string; message: string }> = [];
      if (!body.verticalType) details.push({ field: "verticalType", code: "REQUIRED", message: "Vertical type is required" });
      if (!body.title) details.push({ field: "title", code: "REQUIRED", message: "Title is required" });

      return HttpResponse.json(
        mockErrorResponse("VALIDATION_ERROR", "Vertical type and title are required", details),
        { status: 422 },
      );
    }

    const newId = `listing-${String(MOCK_LISTINGS.length + 1).padStart(3, "0")}`;
    const now = new Date().toISOString();
    const location = (body.location as Record<string, string>) ?? {};

    const newListing = {
      id: newId,
      title: body.title as string,
      slug: `${newId}-${(body.title as string).toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}`,
      description: (body.description as string) ?? "",
      price: (body.price as number) ?? 0,
      currency: (body.currency as string) ?? "MYR",
      priceType: (body.priceType as string) ?? "FIXED",
      status: "DRAFT" as const,
      verticalType: body.verticalType as string,
      schemaVersion: (body.schemaVersion as string) ?? "1.0",
      partnerId: "partner-001",
      vendorId: "vendor-001",
      location: {
        address: location.address ?? "",
        city: location.city ?? "",
        state: location.state ?? "",
        country: location.country ?? "MY",
        postalCode: location.postalCode ?? "",
      },
      primaryImage: UNSPLASH_IMAGES[0],
      images: [],
      attributes: (body.attributes as Record<string, unknown>) ?? {},
      isFeatured: false,
      featuredUntil: null,
      publishedAt: null,
      expiresAt: null,
      viewCount: 0,
      inquiryCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    MOCK_LISTINGS.unshift(newListing as any);

    return HttpResponse.json(mockSuccessResponse(newListing), { status: 201 });
  }),

  // PATCH /listings/:id (update listing)
  http.patch(`${API_BASE}/listings/:id`, async ({ params, request }) => {
    // Skip if it's a lifecycle action (publish/unpublish/archive)
    const id = params.id as string;
    if (id.includes("/")) return;

    await delay(400);

    const listing = MOCK_LISTINGS.find((l) => l.id === id);
    if (!listing) {
      return HttpResponse.json(
        mockErrorResponse("LISTING_NOT_FOUND", "Listing not found"),
        { status: 404 },
      );
    }

    const body = (await request.json()) as Record<string, unknown>;

    // Update mutable fields
    if (typeof body.title === "string") (listing as Record<string, unknown>).title = body.title;
    if (typeof body.description === "string") (listing as Record<string, unknown>).description = body.description;
    if (typeof body.price === "number") (listing as Record<string, unknown>).price = body.price;
    if (typeof body.currency === "string") (listing as Record<string, unknown>).currency = body.currency;
    if (typeof body.priceType === "string") (listing as Record<string, unknown>).priceType = body.priceType;
    if (body.location && typeof body.location === "object") {
      (listing as Record<string, unknown>).location = { ...listing.location, ...(body.location as object) };
    }
    if (body.attributes && typeof body.attributes === "object") {
      (listing as Record<string, unknown>).attributes = { ...listing.attributes, ...(body.attributes as Record<string, unknown>) };
    }
    (listing as Record<string, unknown>).updatedAt = new Date().toISOString();

    return HttpResponse.json(mockSuccessResponse(listing));
  }),

  // GET /listings (paginated — Format A)
  http.get(`${API_BASE}/listings`, async ({ request }) => {
    await delay(300);

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const pageSize = parseInt(url.searchParams.get("pageSize") || "20", 10);
    const status = url.searchParams.get("status");
    const search = url.searchParams.get("search");
    const verticalType = url.searchParams.get("verticalType");
    const vendorId = url.searchParams.get("vendorId");
    const sortBy = url.searchParams.get("sortBy") || "updatedAt";
    const sortOrder = url.searchParams.get("sortOrder") || "desc";
    const minPrice = url.searchParams.get("minPrice");
    const maxPrice = url.searchParams.get("maxPrice");
    const city = url.searchParams.get("city");
    const isFeatured = url.searchParams.get("isFeatured");

    let filtered = [...MOCK_LISTINGS];

    // Filter by status
    if (status) {
      filtered = filtered.filter((l) => l.status === status);
    }

    // Filter by vertical type
    if (verticalType) {
      filtered = filtered.filter((l) =>
        l.verticalType.toLowerCase() === verticalType.toLowerCase()
      );
    }

    // Filter by vendor
    if (vendorId) {
      filtered = filtered.filter((l) => l.vendorId === vendorId);
    }

    // Filter by search term
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          l.description.toLowerCase().includes(q) ||
          l.location.city?.toLowerCase().includes(q)
      );
    }

    // Filter by price range
    if (minPrice) {
      filtered = filtered.filter((l) => l.price >= Number(minPrice));
    }
    if (maxPrice) {
      filtered = filtered.filter((l) => l.price <= Number(maxPrice));
    }

    // Filter by city
    if (city) {
      filtered = filtered.filter(
        (l) => l.location.city?.toLowerCase() === city.toLowerCase()
      );
    }

    // Filter by featured
    if (isFeatured === "true") {
      filtered = filtered.filter((l) => l.isFeatured);
    }

    // --- Attribute-level filters (real estate) ---
    const attrPropertyType = url.searchParams.get("propertyType");
    if (attrPropertyType) {
      const types = attrPropertyType.split(",").filter(Boolean);
      filtered = filtered.filter((l) =>
        types.some((t) => (l.attributes as Record<string, unknown>)?.propertyType === t)
      );
    }

    const attrListingType = url.searchParams.get("listingType");
    if (attrListingType) {
      filtered = filtered.filter(
        (l) => (l.attributes as Record<string, unknown>)?.listingType === attrListingType
      );
    }

    const attrBedrooms = url.searchParams.get("bedrooms");
    if (attrBedrooms) {
      const bedroomVal = attrBedrooms.endsWith("+")
        ? Number(attrBedrooms.replace("+", ""))
        : Number(attrBedrooms);
      const isPlus = attrBedrooms.endsWith("+");
      filtered = filtered.filter((l) => {
        const beds = (l.attributes as Record<string, unknown>)?.bedrooms;
        if (typeof beds !== "number") return false;
        return isPlus ? beds >= bedroomVal : beds === bedroomVal;
      });
    }

    const attrBathrooms = url.searchParams.get("bathrooms");
    if (attrBathrooms) {
      const bathroomVal = attrBathrooms.endsWith("+")
        ? Number(attrBathrooms.replace("+", ""))
        : Number(attrBathrooms);
      const isPlus = attrBathrooms.endsWith("+");
      filtered = filtered.filter((l) => {
        const baths = (l.attributes as Record<string, unknown>)?.bathrooms;
        if (typeof baths !== "number") return false;
        return isPlus ? baths >= bathroomVal : baths === bathroomVal;
      });
    }

    const attrFurnishing = url.searchParams.get("furnishing");
    if (attrFurnishing) {
      filtered = filtered.filter(
        (l) => (l.attributes as Record<string, unknown>)?.furnishing === attrFurnishing
      );
    }

    const priceMin = url.searchParams.get("price_min");
    const priceMax = url.searchParams.get("price_max");
    if (priceMin) {
      filtered = filtered.filter((l) => l.price >= Number(priceMin));
    }
    if (priceMax) {
      filtered = filtered.filter((l) => l.price <= Number(priceMax));
    }

    const builtUpSizeMin = url.searchParams.get("builtUpSize_min");
    const builtUpSizeMax = url.searchParams.get("builtUpSize_max");
    if (builtUpSizeMin) {
      filtered = filtered.filter((l) => {
        const size = (l.attributes as Record<string, unknown>)?.builtUpSize;
        return typeof size === "number" && size >= Number(builtUpSizeMin);
      });
    }
    if (builtUpSizeMax) {
      filtered = filtered.filter((l) => {
        const size = (l.attributes as Record<string, unknown>)?.builtUpSize;
        return typeof size === "number" && size <= Number(builtUpSizeMax);
      });
    }

    // Sort
    filtered.sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case "price":
          cmp = a.price - b.price;
          break;
        case "title":
          cmp = a.title.localeCompare(b.title);
          break;
        case "createdAt":
          cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case "updatedAt":
        default:
          cmp = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
      }
      return sortOrder === "desc" ? -cmp : cmp;
    });

    // Paginate
    const start = (page - 1) * pageSize;
    const paginated = filtered.slice(start, start + pageSize);

    return HttpResponse.json(
      mockPaginatedResponse(paginated, page, pageSize, filtered.length)
    );
  }),

  // GET /listings/:id (single entity)
  http.get(`${API_BASE}/listings/:id`, async ({ params }) => {
    await delay(200);

    const listing = MOCK_LISTINGS.find((l) => l.id === params.id);

    if (!listing) {
      return HttpResponse.json(
        mockErrorResponse("LISTING_NOT_FOUND", "Listing not found"),
        { status: 404 }
      );
    }

    // Build multiple media items for gallery
    const listingIndex = MOCK_LISTINGS.indexOf(listing);
    const mediaCount = 3 + (listingIndex % 5); // 3-7 images per listing
    const media = Array.from({ length: mediaCount }, (_, i) => {
      const imgIdx = (listingIndex + i) % UNSPLASH_IMAGES.length;
      return {
        id: `media-${listing.id}-${String(i + 1).padStart(3, "0")}`,
        filename: `image-${i + 1}.jpg`,
        mimeType: "image/jpeg",
        size: 200000 + i * 50000,
        mediaType: "IMAGE" as const,
        cdnUrl: UNSPLASH_IMAGES[imgIdx].replace("w=400&h=300", "w=800&h=600"),
        thumbnailUrl: UNSPLASH_IMAGES[imgIdx],
        sortOrder: i,
        isPrimary: i === 0,
        altText: `${listing.title} - Image ${i + 1}`,
      };
    });

    // Return detailed version with vendor and media
    const detailedListing = {
      ...listing,
      vendor: {
        id: listing.vendorId,
        name: `${["Acme Properties", "Skyline Realty", "Golden Homes"][parseInt(listing.vendorId.slice(-1)) - 1] || "Unknown Vendor"}`,
        slug: `vendor-${listing.vendorId.slice(-3)}`,
      },
      media,
    };

    return HttpResponse.json(mockSuccessResponse(detailedListing));
  }),

  // PATCH /listings/:id/publish
  http.patch(`${API_BASE}/listings/:id/publish`, async ({ params }) => {
    await delay(400);

    const listing = MOCK_LISTINGS.find((l) => l.id === params.id);
    if (!listing) {
      return HttpResponse.json(
        mockErrorResponse("LISTING_NOT_FOUND", "Listing not found"),
        { status: 404 }
      );
    }

    if (listing.status !== "DRAFT" && listing.status !== "EXPIRED" && listing.status !== "ARCHIVED") {
      return HttpResponse.json(
        mockErrorResponse("INVALID_STATUS", "Listing must be in DRAFT, EXPIRED, or ARCHIVED status to publish"),
        { status: 422 }
      );
    }

    // Update in-memory status
    (listing as { status: string }).status = "PUBLISHED";
    (listing as { publishedAt: string }).publishedAt = new Date().toISOString();

    return HttpResponse.json(mockSuccessResponse(listing));
  }),

  // PATCH /listings/:id/unpublish
  http.patch(`${API_BASE}/listings/:id/unpublish`, async ({ params }) => {
    await delay(400);

    const listing = MOCK_LISTINGS.find((l) => l.id === params.id);
    if (!listing) {
      return HttpResponse.json(
        mockErrorResponse("LISTING_NOT_FOUND", "Listing not found"),
        { status: 404 }
      );
    }

    (listing as { status: string }).status = "DRAFT";
    return HttpResponse.json(mockSuccessResponse(listing));
  }),

  // PATCH /listings/:id/archive
  http.patch(`${API_BASE}/listings/:id/archive`, async ({ params }) => {
    await delay(400);

    const listing = MOCK_LISTINGS.find((l) => l.id === params.id);
    if (!listing) {
      return HttpResponse.json(
        mockErrorResponse("LISTING_NOT_FOUND", "Listing not found"),
        { status: 404 }
      );
    }

    (listing as { status: string }).status = "ARCHIVED";
    return HttpResponse.json(mockSuccessResponse(listing));
  }),

  // DELETE /listings/:id
  http.delete(`${API_BASE}/listings/:id`, async ({ params }) => {
    await delay(400);

    const idx = MOCK_LISTINGS.findIndex((l) => l.id === params.id);
    if (idx === -1) {
      return HttpResponse.json(
        mockErrorResponse("LISTING_NOT_FOUND", "Listing not found"),
        { status: 404 }
      );
    }

    // Remove from mock data
    MOCK_LISTINGS.splice(idx, 1);
    return HttpResponse.json(mockSuccessResponse({ deleted: true }));
  }),

  // GET /admin/listings — Admin-scoped paginated listing list
  http.get(`${API_BASE}/admin/listings`, async ({ request }) => {
    await delay(300);

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const pageSize = parseInt(url.searchParams.get("pageSize") || "20", 10);
    const status = url.searchParams.get("status");
    const verticalType = url.searchParams.get("verticalType");

    let filtered = [...MOCK_LISTINGS];
    if (status) filtered = filtered.filter((l) => l.status === status);
    if (verticalType) filtered = filtered.filter((l) => l.verticalType === verticalType);

    return HttpResponse.json(mockPaginatedResponse(filtered, page, pageSize));
  }),

  // GET /listings/facets — Facet counts for filter UI
  http.get(`${API_BASE}/listings/facets`, async ({ request }) => {
    await delay(200);

    const url = new URL(request.url);
    const listingType = url.searchParams.get("listingType");

    let source = [...MOCK_LISTINGS];

    // Optionally filter by listing type before computing facets
    if (listingType) {
      source = source.filter(
        (l) => (l.attributes as Record<string, unknown>)?.listingType === listingType
      );
    }

    // Compute property type counts
    const propertyTypeCounts: Record<string, number> = {};
    for (const l of source) {
      const pt = (l.attributes as Record<string, unknown>)?.propertyType;
      if (typeof pt === "string") {
        propertyTypeCounts[pt] = (propertyTypeCounts[pt] || 0) + 1;
      }
    }

    // Compute listing type counts
    const listingTypeCounts: Record<string, number> = {};
    for (const l of MOCK_LISTINGS) {
      const lt = (l.attributes as Record<string, unknown>)?.listingType;
      if (typeof lt === "string") {
        listingTypeCounts[lt] = (listingTypeCounts[lt] || 0) + 1;
      }
    }

    // Compute furnishing counts
    const furnishingCounts: Record<string, number> = {};
    for (const l of source) {
      const f = (l.attributes as Record<string, unknown>)?.furnishing;
      if (typeof f === "string") {
        furnishingCounts[f] = (furnishingCounts[f] || 0) + 1;
      }
    }

    const facets = {
      propertyType: Object.entries(propertyTypeCounts).map(([value, count]) => ({
        value,
        count,
      })),
      listingType: Object.entries(listingTypeCounts).map(([value, count]) => ({
        value,
        count,
      })),
      furnishing: Object.entries(furnishingCounts).map(([value, count]) => ({
        value,
        count,
      })),
    };

    return HttpResponse.json(mockSuccessResponse(facets));
  }),
];
