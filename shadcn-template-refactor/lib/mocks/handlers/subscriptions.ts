// =============================================================================
// MSW Handlers — Subscription domain mock handlers
// =============================================================================
// Mocks for plans, subscriptions, entitlements, and usage endpoints.
// =============================================================================

import { http, HttpResponse, delay } from "msw";
import {
  mockSuccessResponse,
  mockMetaPaginatedResponse,
  mockTimestamp,
  mockErrorResponse,
} from "../utils";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000/api/v1";

// ---------------------------------------------------------------------------
// Mock Plans
// ---------------------------------------------------------------------------

const MOCK_PLANS = [
  {
    id: "plan-001",
    name: "Starter",
    slug: "starter",
    description: "Perfect for getting started with basic listings",
    priceMonthly: "99.00",
    priceYearly: "990.00",
    currency: "MYR",
    entitlements: {
      listings: { limit: 10, verticals: { real_estate: 10 } },
      interactions: { limit: 50 },
      media: { uploadSizeLimit: 10, storageSizeLimit: 1 },
      features: [],
      verticals: ["real_estate"],
      api: { requestsPerMinute: 30 },
    },
    isActive: true,
    isPublic: true,
    createdAt: mockTimestamp(180),
    updatedAt: mockTimestamp(30),
  },
  {
    id: "plan-002",
    name: "Professional",
    slug: "professional",
    description: "For growing businesses with more listings and leads",
    priceMonthly: "299.00",
    priceYearly: "2990.00",
    currency: "MYR",
    entitlements: {
      listings: {
        limit: 50,
        verticals: { real_estate: 30, automotive: 20 },
      },
      interactions: { limit: 500 },
      media: { uploadSizeLimit: 50, storageSizeLimit: 10 },
      features: ["analytics", "priority_support"],
      verticals: ["real_estate", "automotive"],
      api: { requestsPerMinute: 120 },
    },
    isActive: true,
    isPublic: true,
    createdAt: mockTimestamp(180),
    updatedAt: mockTimestamp(15),
  },
  {
    id: "plan-003",
    name: "Enterprise",
    slug: "enterprise",
    description: "Unlimited power for large-scale operations",
    priceMonthly: "799.00",
    priceYearly: "7990.00",
    currency: "MYR",
    entitlements: {
      listings: {
        limit: 500,
        verticals: { real_estate: 300, automotive: 200 },
      },
      interactions: { limit: 5000 },
      media: { uploadSizeLimit: 100, storageSizeLimit: 100 },
      features: [
        "analytics",
        "priority_support",
        "advanced_search",
        "api_access",
        "bulk_operations",
        "custom_branding",
      ],
      verticals: ["real_estate", "automotive"],
      api: { requestsPerMinute: 600 },
    },
    isActive: true,
    isPublic: true,
    createdAt: mockTimestamp(180),
    updatedAt: mockTimestamp(5),
  },
];

// ---------------------------------------------------------------------------
// Mock Subscription
// ---------------------------------------------------------------------------

const periodStart = new Date();
periodStart.setDate(1); // 1st of current month
const periodEnd = new Date(periodStart);
periodEnd.setMonth(periodEnd.getMonth() + 1);

const MOCK_SUBSCRIPTION = {
  id: "sub-001",
  partnerId: "partner-001",
  planId: "plan-002",
  status: "ACTIVE" as const,
  currentPeriodStart: periodStart.toISOString(),
  currentPeriodEnd: periodEnd.toISOString(),
  externalId: "sub_stripe_abc123",
  externalProvider: "stripe",
  overrides: null,
  cancelledAt: null,
  createdAt: mockTimestamp(90),
  updatedAt: mockTimestamp(5),
  plan: {
    id: "plan-002",
    name: "Professional",
    slug: "professional",
    priceMonthly: "299.00",
  },
};

// ---------------------------------------------------------------------------
// Mock Entitlements (resolved)
// ---------------------------------------------------------------------------

const MOCK_ENTITLEMENTS = {
  listings: {
    limit: 50,
    verticals: { real_estate: 30, automotive: 20 },
  },
  interactions: { limit: 500 },
  media: { uploadSizeLimit: 50, storageSizeLimit: 10 },
  features: ["analytics", "priority_support"],
  verticals: ["real_estate", "automotive"],
  api: { requestsPerMinute: 120 },
};

// ---------------------------------------------------------------------------
// Mock Usage Metrics
// ---------------------------------------------------------------------------

const MOCK_USAGE = [
  {
    metricKey: "listings_created",
    currentPeriod: {
      count: 35,
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
    },
    limit: 50,
    percentage: 70.0,
  },
  {
    metricKey: "interactions_received",
    currentPeriod: {
      count: 420,
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
    },
    limit: 500,
    percentage: 84.0,
  },
  {
    metricKey: "media_uploads",
    currentPeriod: {
      count: 7,
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
    },
    limit: 50,
    percentage: 14.0,
  },
  {
    metricKey: "storage_used",
    currentPeriod: {
      count: 4,
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
    },
    limit: 10,
    percentage: 40.0,
  },
];

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

export const subscriptionHandlers = [
  // ---- GET /plans ----
  http.get(`${API_BASE}/plans`, async ({ request }) => {
    await delay(300);

    const url = new URL(request.url);
    const isActive = url.searchParams.get("isActive");
    const isPublic = url.searchParams.get("isPublic");
    const page = parseInt(url.searchParams.get("page") ?? "1", 10);
    const pageSize = parseInt(url.searchParams.get("pageSize") ?? "20", 10);

    let filtered = [...MOCK_PLANS];
    if (isActive !== null) {
      filtered = filtered.filter(
        (p) => p.isActive === (isActive === "true")
      );
    }
    if (isPublic !== null) {
      filtered = filtered.filter(
        (p) => p.isPublic === (isPublic === "true")
      );
    }

    // Paginate
    const start = (page - 1) * pageSize;
    const paged = filtered.slice(start, start + pageSize);

    return HttpResponse.json(
      mockMetaPaginatedResponse(paged, page, pageSize, filtered.length)
    );
  }),

  // ---- GET /plans/:id ----
  http.get(`${API_BASE}/plans/:id`, async ({ params }) => {
    await delay(200);
    const plan = MOCK_PLANS.find((p) => p.id === params.id);
    if (!plan) {
      return HttpResponse.json(
        mockErrorResponse("PLAN_NOT_FOUND", "Plan not found"),
        { status: 404 }
      );
    }
    return HttpResponse.json(mockSuccessResponse(plan));
  }),

  // ---- GET /subscriptions/current ----
  http.get(`${API_BASE}/subscriptions/current`, async () => {
    await delay(300);
    return HttpResponse.json(mockSuccessResponse(MOCK_SUBSCRIPTION));
  }),

  // ---- GET /subscriptions/entitlements ----
  http.get(`${API_BASE}/subscriptions/entitlements`, async () => {
    await delay(200);
    return HttpResponse.json(mockSuccessResponse(MOCK_ENTITLEMENTS));
  }),

  // ---- GET /subscriptions/usage ----
  http.get(`${API_BASE}/subscriptions/usage`, async ({ request }) => {
    await delay(300);

    const url = new URL(request.url);
    const metricKey = url.searchParams.get("metricKey");

    if (metricKey) {
      const metric = MOCK_USAGE.find((m) => m.metricKey === metricKey);
      if (!metric) {
        return HttpResponse.json(
          mockErrorResponse("METRIC_NOT_FOUND", "Metric not found"),
          { status: 404 }
        );
      }
      return HttpResponse.json(mockSuccessResponse(metric));
    }

    return HttpResponse.json(mockSuccessResponse(MOCK_USAGE));
  }),
];
