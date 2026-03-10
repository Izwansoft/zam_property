// =============================================================================
// MSW Handlers — Analytics domain mock handlers
// =============================================================================
// Mocks for partner analytics, vendor analytics, vendor listing analytics,
// and admin dashboard stats endpoints.
// =============================================================================

import { http, HttpResponse, delay } from "msw";
import { mockSuccessResponse, mockTimestamp } from "../utils";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000/api/v1";

// ---------------------------------------------------------------------------
// Mock Data — Partner Analytics Overview
// ---------------------------------------------------------------------------

function buildPartnerOverview(startDate: string, endDate: string) {
  return {
    startDate,
    endDate,
    totals: {
      viewsCount: 12_450,
      leadsCount: 342,
      enquiriesCount: 198,
      bookingsCount: 87,
    },
  };
}

// ---------------------------------------------------------------------------
// Mock Data — Vendor Analytics Overview
// ---------------------------------------------------------------------------

function buildVendorOverview(
  vendorId: string,
  startDate: string,
  endDate: string
) {
  return {
    vendorId,
    startDate,
    endDate,
    totals: {
      viewsCount: 3_210,
      leadsCount: 89,
      enquiriesCount: 52,
      bookingsCount: 23,
    },
  };
}

// ---------------------------------------------------------------------------
// Mock Data — Vendor Listing Analytics
// ---------------------------------------------------------------------------

function buildVendorListings(
  vendorId: string,
  startDate: string,
  endDate: string
) {
  return {
    vendorId,
    startDate,
    endDate,
    items: [
      {
        listingId: "listing-001",
        verticalType: "real_estate",
        viewsCount: 1_240,
        leadsCount: 34,
        enquiriesCount: 18,
        bookingsCount: 8,
      },
      {
        listingId: "listing-002",
        verticalType: "real_estate",
        viewsCount: 890,
        leadsCount: 22,
        enquiriesCount: 15,
        bookingsCount: 7,
      },
      {
        listingId: "listing-003",
        verticalType: "automotive",
        viewsCount: 560,
        leadsCount: 18,
        enquiriesCount: 10,
        bookingsCount: 5,
      },
      {
        listingId: "listing-004",
        verticalType: "real_estate",
        viewsCount: 320,
        leadsCount: 10,
        enquiriesCount: 6,
        bookingsCount: 2,
      },
      {
        listingId: "listing-005",
        verticalType: "automotive",
        viewsCount: 200,
        leadsCount: 5,
        enquiriesCount: 3,
        bookingsCount: 1,
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// Mock Data — Admin Dashboard Stats
// ---------------------------------------------------------------------------

const MOCK_ADMIN_STATS = {
  vendorsByStatus: {
    ACTIVE: 42,
    PENDING: 5,
    SUSPENDED: 2,
    INACTIVE: 8,
  },
  listingsByStatus: {
    PUBLISHED: 156,
    DRAFT: 23,
    PENDING_REVIEW: 8,
    ARCHIVED: 45,
    REJECTED: 3,
  },
  interactionsLast7DaysByType: {
    VIEW: 2_840,
    LEAD: 156,
    ENQUIRY: 89,
    BOOKING: 34,
    CALL: 67,
  },
  pendingVendors: 5,
  pendingReviews: 8,
  generatedAt: mockTimestamp(0),
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getDateParams(url: URL) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  return {
    startDate:
      url.searchParams.get("startDate") ??
      thirtyDaysAgo.toISOString().split("T")[0],
    endDate:
      url.searchParams.get("endDate") ?? now.toISOString().split("T")[0],
  };
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

export const analyticsHandlers = [
  // ---- GET /analytics/partner/overview ----
  http.get(`${API_BASE}/analytics/partner/overview`, async ({ request }) => {
    await delay(400);

    const url = new URL(request.url);
    const { startDate, endDate } = getDateParams(url);

    return HttpResponse.json(
      mockSuccessResponse(buildPartnerOverview(startDate, endDate))
    );
  }),

  // ---- GET /analytics/vendor/overview ----
  http.get(`${API_BASE}/analytics/vendor/overview`, async ({ request }) => {
    await delay(400);

    const url = new URL(request.url);
    const { startDate, endDate } = getDateParams(url);
    const vendorId = url.searchParams.get("vendorId") ?? "vendor-001";

    return HttpResponse.json(
      mockSuccessResponse(buildVendorOverview(vendorId, startDate, endDate))
    );
  }),

  // ---- GET /analytics/vendor/listings ----
  http.get(`${API_BASE}/analytics/vendor/listings`, async ({ request }) => {
    await delay(500);

    const url = new URL(request.url);
    const { startDate, endDate } = getDateParams(url);
    const vendorId = url.searchParams.get("vendorId") ?? "vendor-001";

    return HttpResponse.json(
      mockSuccessResponse(buildVendorListings(vendorId, startDate, endDate))
    );
  }),

  // ---- GET /admin/dashboard/stats ----
  http.get(`${API_BASE}/admin/dashboard/stats`, async () => {
    await delay(300);

    return HttpResponse.json(
      mockSuccessResponse({
        ...MOCK_ADMIN_STATS,
        generatedAt: new Date().toISOString(),
      })
    );
  }),

  // ---- GET /admin/dashboard/pm-stats ----
  http.get(`${API_BASE}/admin/dashboard/pm-stats`, async () => {
    await delay(300);

    return HttpResponse.json(
      mockSuccessResponse({
        activeTenancies: 24,
        totalProperties: 156,
        occupancyRate: 87.5,
        totalRentCollected: 284500,
        overdueRent: 12300,
        maintenanceRequests: { open: 8, inProgress: 3, resolved: 45 },
        upcomingRenewals: 6,
        pendingPayouts: 4,
        generatedAt: new Date().toISOString(),
      })
    );
  }),
];
