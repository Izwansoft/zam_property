// =============================================================================
// MSW Handlers — Reviews domain mock handlers
// =============================================================================

import { http, HttpResponse, delay } from "msw";
import {
  mockSuccessResponse,
  mockPaginatedResponse,
  mockErrorResponse,
  mockTimestamp,
} from "../utils";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000/api/v1";

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const LISTING_TITLES = [
  "Spacious Condo with KLCC View",
  "Modern Apartment in Mont Kiara",
  "Luxury Bungalow with Pool",
  "Cozy Studio near LRT",
  "Family Home in Damansara Heights",
  "Penthouse Suite with Panoramic View",
];

const VENDOR_NAMES = [
  "Premier Properties Sdn Bhd",
  "Golden Gate Realty",
  "Skyline Homes",
  "Emerald Property Group",
  "Horizon Real Estate",
  "Pinnacle Properties",
];

const CUSTOMER_NAMES = [
  "Ahmad Razak",
  "Siti Nurhaliza",
  "James Wong",
  "Priya Nair",
  "David Tan",
  "Fatimah Abdullah",
  "Kevin Lim",
  "Aishah Mohamed",
  "Chen Wei",
  "Rajesh Kumar",
];

const REVIEW_TITLES = [
  "Great property, highly recommended!",
  "Decent experience overall",
  "Not as expected",
  "Excellent service and quality",
  "Good value for money",
  "Below average experience",
  "Outstanding property",
  "Average, could be better",
  "Very satisfied with the deal",
  "Disappointing experience",
  "Wonderful property and location",
  "Quick and professional service",
];

const REVIEW_CONTENTS = [
  "The property was exactly as described in the listing. The agent was very responsive and helpful throughout the process. Would definitely recommend to others looking for a quality property.",
  "Overall a decent experience. The property was nice but some minor issues with the plumbing that weren't mentioned. The vendor handled it professionally after I pointed it out.",
  "The property didn't quite match what was shown in the photos. However, the location is great and the price was reasonable. Service from the agent could have been better.",
  "Absolutely excellent! From start to finish, the experience was seamless. The property exceeded my expectations and the vendor was professional and transparent.",
  "Good value for the price paid. The property is well-maintained and the neighborhood is nice. Only giving 4 stars because the handover process took longer than expected.",
  "I had a few issues with this property. The renovation quality was below what was promised, and communication with the vendor was slow at times.",
  "This is an outstanding property. Beautiful views, excellent facilities, and the vendor provided excellent after-sales service. Very happy with my purchase.",
  "The property is average. Nothing particularly wrong, but nothing exceptional either. The agent was helpful but the process was slower than I'd like.",
  "Very satisfied with the entire transaction. The vendor was upfront about everything and there were no hidden surprises. The property is exactly what I was looking for.",
  "Frankly disappointing. The property had several defects that weren't disclosed. Still negotiating repairs with the vendor.",
  "A wonderful property in a prime location. The vendor was very transparent about the property's history and condition. Moving in was smooth.",
  "Professional service from start to finish. Documentation was handled efficiently and the property was in excellent condition.",
];

const VENDOR_REPLIES = [
  "Thank you for your kind words! We're glad you had a positive experience.",
  "We appreciate your honest feedback. We've addressed the plumbing issues as discussed.",
  "We apologize for any inconvenience. We'd love to make things right — please contact us.",
  "Thank you! We strive for excellence and appreciate your recognition.",
  "Thanks for the 4-star review! We've since improved our handover process.",
  null, // no reply
  "We're thrilled you love the property! Thank you for choosing us.",
  null, // no reply
  "Thank you for your trust in us! We're glad the process was transparent.",
  null, // no reply
  "Thank you! We take pride in transparency and are happy you appreciate that.",
  "We're glad the process was smooth for you. Thank you for the kind review!",
];

const STATUSES = [
  "PENDING",
  "APPROVED",
  "APPROVED",
  "APPROVED",
  "APPROVED",
  "PENDING",
  "APPROVED",
  "APPROVED",
  "APPROVED",
  "FLAGGED",
  "APPROVED",
  "REJECTED",
] as const;

const RATINGS = [5, 4, 3, 5, 4, 2, 5, 3, 4, 1, 5, 4];

// Generate mock reviews
const MOCK_REVIEWS = Array.from({ length: 24 }, (_, i) => {
  const idx = i % 12;
  const createdDate = new Date();
  createdDate.setDate(createdDate.getDate() - (30 - i));
  createdDate.setHours(8 + (i % 14), (i * 13) % 60, 0, 0);

  const vendorReply = VENDOR_REPLIES[idx];
  const replyDate = vendorReply
    ? new Date(createdDate.getTime() + 86_400_000 * (1 + (i % 3)))
    : undefined;

  return {
    id: `review-${String(i + 1).padStart(3, "0")}`,
    partnerId: "partner-001",
    vendorId: `vendor-${String((i % 6) + 1).padStart(3, "0")}`,
    vendorName: VENDOR_NAMES[i % VENDOR_NAMES.length],
    listingId: `listing-${String((i % 6) + 1).padStart(3, "0")}`,
    listingTitle: LISTING_TITLES[i % LISTING_TITLES.length],
    customerId: `customer-${String((i % CUSTOMER_NAMES.length) + 1).padStart(3, "0")}`,
    customerName: CUSTOMER_NAMES[i % CUSTOMER_NAMES.length],
    rating: RATINGS[idx],
    title: REVIEW_TITLES[idx],
    content: REVIEW_CONTENTS[idx],
    status: STATUSES[idx],
    vendorReply: vendorReply ?? undefined,
    vendorReplyDate: replyDate?.toISOString(),
    hasVendorReply: !!vendorReply,
    moderationReason:
      STATUSES[idx] === "REJECTED"
        ? "Content violates community guidelines"
        : STATUSES[idx] === "FLAGGED"
          ? "Suspected spam or abuse"
          : undefined,
    createdAt: createdDate.toISOString(),
    updatedAt: createdDate.toISOString(),
  };
});

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

export const reviewHandlers = [
  // ---- GET /reviews (paginated list) ----
  http.get(`${API_BASE}/reviews`, async ({ request }) => {
    await delay(300);

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const pageSize = parseInt(url.searchParams.get("pageSize") || "20", 10);
    const status = url.searchParams.get("status");
    const rating = url.searchParams.get("rating");
    const search = url.searchParams.get("search");
    const vendorId = url.searchParams.get("vendorId");
    const listingId = url.searchParams.get("listingId");
    const sortBy = url.searchParams.get("sortBy") || "createdAt";
    const sortOrder = url.searchParams.get("sortOrder") || "desc";

    let filtered = [...MOCK_REVIEWS];

    // Filter by status
    if (status) {
      filtered = filtered.filter((r) => r.status === status);
    }

    // Filter by rating
    if (rating) {
      const ratingNum = parseInt(rating, 10);
      filtered = filtered.filter((r) => r.rating === ratingNum);
    }

    // Filter by vendor
    if (vendorId) {
      filtered = filtered.filter((r) => r.vendorId === vendorId);
    }

    // Filter by listing
    if (listingId) {
      filtered = filtered.filter((r) => r.listingId === listingId);
    }

    // Search by content/title/customer
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.content.toLowerCase().includes(q) ||
          (r.title?.toLowerCase().includes(q) ?? false) ||
          r.customerName.toLowerCase().includes(q) ||
          r.listingTitle.toLowerCase().includes(q),
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let cmp = 0;
      if (sortBy === "rating") {
        cmp = a.rating - b.rating;
      } else if (sortBy === "updatedAt") {
        cmp =
          new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      } else {
        cmp =
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return sortOrder === "asc" ? cmp : -cmp;
    });

    // Paginate
    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize);

    return HttpResponse.json(mockPaginatedResponse(items, page, pageSize, total));
  }),

  // ---- GET /reviews/stats ----
  http.get(`${API_BASE}/reviews/stats`, async ({ request }) => {
    await delay(200);

    const url = new URL(request.url);
    const vendorId = url.searchParams.get("vendorId");

    let reviews = MOCK_REVIEWS.filter((r) => r.status === "APPROVED");
    if (vendorId) {
      reviews = reviews.filter((r) => r.vendorId === vendorId);
    }

    const totalReviews = reviews.length;
    const avgRating =
      totalReviews > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
        : 0;

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const r of reviews) {
      distribution[r.rating as 1 | 2 | 3 | 4 | 5]++;
    }

    return HttpResponse.json(
      mockSuccessResponse({
        averageRating: Math.round(avgRating * 10) / 10,
        totalReviews,
        distribution,
        trend: "stable" as const,
      }),
    );
  }),

  // ---- GET /reviews/:id (detail) ----
  http.get(`${API_BASE}/reviews/:id`, async ({ params }) => {
    await delay(250);

    const review = MOCK_REVIEWS.find((r) => r.id === params.id);
    if (!review) {
      return HttpResponse.json(
        mockErrorResponse("REVIEW_NOT_FOUND", "Review not found"),
        { status: 404 },
      );
    }

    // Extend with detail fields
    const detail = {
      ...review,
      customerEmail: `${review.customerName.toLowerCase().replace(/\s/g, ".")}@example.com`,
      customerPhone: `+601${Math.floor(10000000 + Math.random() * 90000000)}`,
      interactionId: `interaction-${String(parseInt(review.id.split("-")[1]) % 12 + 1).padStart(3, "0")}`,
      internalNotes:
        review.status === "FLAGGED"
          ? ["Auto-flagged by abuse detection system", "Pending manual review"]
          : review.status === "REJECTED"
            ? ["Rejected due to community guideline violation"]
            : undefined,
      reportReasons:
        review.status === "FLAGGED"
          ? ["Suspected spam", "Inappropriate language"]
          : undefined,
    };

    return HttpResponse.json(mockSuccessResponse(detail));
  }),

  // ---- PATCH /reviews/:id/approve ----
  http.patch(`${API_BASE}/reviews/:id/approve`, async ({ params }) => {
    await delay(300);

    const review = MOCK_REVIEWS.find((r) => r.id === params.id);
    if (!review) {
      return HttpResponse.json(
        mockErrorResponse("REVIEW_NOT_FOUND", "Review not found"),
        { status: 404 },
      );
    }

    if (review.status === "APPROVED") {
      return HttpResponse.json(
        mockErrorResponse("ALREADY_APPROVED", "Review is already approved"),
        { status: 400 },
      );
    }

    // Simulate approval
    const updated = { ...review, status: "APPROVED" as const, updatedAt: new Date().toISOString() };
    return HttpResponse.json(mockSuccessResponse(updated));
  }),

  // ---- PATCH /reviews/:id/reject ----
  http.patch(`${API_BASE}/reviews/:id/reject`, async ({ params, request }) => {
    await delay(300);

    const body = (await request.json()) as { reason?: string };

    if (!body?.reason) {
      return HttpResponse.json(
        mockErrorResponse("VALIDATION_ERROR", "Rejection reason is required", [
          { field: "reason", code: "required", message: "Reason is required" },
        ]),
        { status: 422 },
      );
    }

    const review = MOCK_REVIEWS.find((r) => r.id === params.id);
    if (!review) {
      return HttpResponse.json(
        mockErrorResponse("REVIEW_NOT_FOUND", "Review not found"),
        { status: 404 },
      );
    }

    const updated = {
      ...review,
      status: "REJECTED" as const,
      moderationReason: body.reason,
      updatedAt: new Date().toISOString(),
    };
    return HttpResponse.json(mockSuccessResponse(updated));
  }),

  // ---- PATCH /reviews/:id/flag ----
  http.patch(`${API_BASE}/reviews/:id/flag`, async ({ params, request }) => {
    await delay(300);

    const body = (await request.json()) as { reason?: string };

    if (!body?.reason) {
      return HttpResponse.json(
        mockErrorResponse("VALIDATION_ERROR", "Flag reason is required", [
          { field: "reason", code: "required", message: "Reason is required" },
        ]),
        { status: 422 },
      );
    }

    const review = MOCK_REVIEWS.find((r) => r.id === params.id);
    if (!review) {
      return HttpResponse.json(
        mockErrorResponse("REVIEW_NOT_FOUND", "Review not found"),
        { status: 404 },
      );
    }

    const updated = {
      ...review,
      status: "FLAGGED" as const,
      moderationReason: body.reason,
      updatedAt: new Date().toISOString(),
    };
    return HttpResponse.json(mockSuccessResponse(updated));
  }),

  // ---- POST /reviews/:id/reply (vendor reply) ----
  http.post(`${API_BASE}/reviews/:id/reply`, async ({ params, request }) => {
    await delay(300);

    const body = (await request.json()) as { content?: string };

    if (!body?.content || body.content.trim().length === 0) {
      return HttpResponse.json(
        mockErrorResponse("VALIDATION_ERROR", "Reply content is required", [
          { field: "content", code: "required", message: "Reply content is required" },
        ]),
        { status: 422 },
      );
    }

    const review = MOCK_REVIEWS.find((r) => r.id === params.id);
    if (!review) {
      return HttpResponse.json(
        mockErrorResponse("REVIEW_NOT_FOUND", "Review not found"),
        { status: 404 },
      );
    }

    if (review.hasVendorReply) {
      return HttpResponse.json(
        mockErrorResponse("ALREADY_REPLIED", "Vendor has already replied to this review"),
        { status: 400 },
      );
    }

    const updated = {
      ...review,
      vendorReply: body.content,
      vendorReplyDate: new Date().toISOString(),
      hasVendorReply: true,
      updatedAt: new Date().toISOString(),
    };
    return HttpResponse.json(mockSuccessResponse(updated));
  }),
];
