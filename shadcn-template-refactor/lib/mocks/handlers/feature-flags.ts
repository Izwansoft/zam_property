// =============================================================================
// MSW Handlers — Feature Flags & Experiments mock handlers
// =============================================================================
// Mocks for 11 endpoints:
//   GET  /admin/feature-flags
//   GET  /admin/feature-flags/:key
//   POST /admin/feature-flags
//   PATCH /admin/feature-flags/:key
//   POST /admin/feature-flags/:key/overrides
//   POST /admin/feature-flags/:key/user-targets
//   GET  /admin/experiments
//   GET  /admin/experiments/:key
//   POST /admin/experiments
//   POST /admin/experiments/:key/partner-opt-in
//   GET  /feature-flags/check
// =============================================================================

import { http, HttpResponse, delay } from "msw";
import { mockTimestamp } from "../utils";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000/api/v1";

// ---------------------------------------------------------------------------
// Mock Data — Feature Flags
// ---------------------------------------------------------------------------

const mockFlags = [
  {
    id: "ff-001",
    key: "new-dashboard-layout",
    type: "BOOLEAN",
    description: "Enables the redesigned dashboard layout for all users",
    owner: "frontend-team",
    defaultValue: true,
    rolloutPercentage: null,
    allowedVerticals: [],
    allowedRoles: [],
    reviewAt: mockTimestamp(-30),
    expiresAt: null,
    isArchived: false,
    createdAt: mockTimestamp(90),
    updatedAt: mockTimestamp(5),
  },
  {
    id: "ff-002",
    key: "ai-powered-search",
    type: "PERCENTAGE",
    description: "Gradual rollout of AI-powered listing search",
    owner: "search-team",
    defaultValue: true,
    rolloutPercentage: 35,
    allowedVerticals: ["real_estate"],
    allowedRoles: [],
    reviewAt: mockTimestamp(-14),
    expiresAt: mockTimestamp(-60),
    isArchived: false,
    createdAt: mockTimestamp(60),
    updatedAt: mockTimestamp(2),
  },
  {
    id: "ff-003",
    key: "emergency-kill-switch-payments",
    type: "BOOLEAN",
    description: "Emergency kill switch for payment processing",
    owner: "platform-team",
    defaultValue: false,
    rolloutPercentage: null,
    allowedVerticals: [],
    allowedRoles: ["SUPER_ADMIN"],
    reviewAt: null,
    expiresAt: null,
    isArchived: false,
    createdAt: mockTimestamp(120),
    updatedAt: mockTimestamp(0),
  },
  {
    id: "ff-004",
    key: "vendor-analytics-v2",
    type: "BOOLEAN",
    description: "New vendor analytics dashboard with advanced charts",
    owner: "analytics-team",
    defaultValue: false,
    rolloutPercentage: null,
    allowedVerticals: [],
    allowedRoles: ["VENDOR_ADMIN", "VENDOR_STAFF"],
    reviewAt: mockTimestamp(-7),
    expiresAt: null,
    isArchived: false,
    createdAt: mockTimestamp(45),
    updatedAt: mockTimestamp(10),
  },
  {
    id: "ff-005",
    key: "legacy-media-upload",
    type: "BOOLEAN",
    description: "Legacy media upload flow (deprecated)",
    owner: "media-team",
    defaultValue: false,
    rolloutPercentage: null,
    allowedVerticals: [],
    allowedRoles: [],
    reviewAt: null,
    expiresAt: mockTimestamp(30),
    isArchived: true,
    createdAt: mockTimestamp(180),
    updatedAt: mockTimestamp(30),
  },
];

const mockOverrides = [
  {
    id: "ov-001",
    partnerId: "t-001",
    verticalType: null,
    role: null,
    value: true,
    rolloutPercentage: null,
    isEmergency: false,
    createdAt: mockTimestamp(10),
  },
  {
    id: "ov-002",
    partnerId: null,
    verticalType: "real_estate",
    role: "VENDOR_ADMIN",
    value: false,
    rolloutPercentage: 50,
    isEmergency: false,
    createdAt: mockTimestamp(5),
  },
  {
    id: "ov-003",
    partnerId: null,
    verticalType: null,
    role: null,
    value: false,
    rolloutPercentage: null,
    isEmergency: true,
    createdAt: mockTimestamp(1),
  },
];

const mockUserTargets = [
  {
    id: "ut-001",
    partnerId: "t-001",
    userId: "u-001",
    value: true,
    createdAt: mockTimestamp(3),
  },
  {
    id: "ut-002",
    partnerId: "t-001",
    userId: "u-002",
    value: false,
    createdAt: mockTimestamp(2),
  },
];

// ---------------------------------------------------------------------------
// Mock Data — Experiments
// ---------------------------------------------------------------------------

const mockExperiments = [
  {
    id: "exp-001",
    key: "checkout-flow-redesign",
    description: "Testing new checkout flow vs current for conversion rates",
    owner: "growth-team",
    successMetrics: "conversion_rate, avg_time_to_complete",
    variants: [
      { key: "control", weight: 50 },
      { key: "new-flow", weight: 50 },
    ],
    startsAt: mockTimestamp(14),
    endsAt: mockTimestamp(-30),
    isActive: true,
    featureFlagKey: null,
    createdAt: mockTimestamp(20),
    updatedAt: mockTimestamp(1),
  },
  {
    id: "exp-002",
    key: "search-ranking-algorithm",
    description: "Compare BM25 vs semantic search ranking",
    owner: "search-team",
    successMetrics: "click_through_rate, relevance_score",
    variants: [
      { key: "bm25", weight: 33 },
      { key: "semantic", weight: 34 },
      { key: "hybrid", weight: 33 },
    ],
    startsAt: mockTimestamp(7),
    endsAt: mockTimestamp(-14),
    isActive: true,
    featureFlagKey: "ai-powered-search",
    createdAt: mockTimestamp(10),
    updatedAt: mockTimestamp(2),
  },
  {
    id: "exp-003",
    key: "onboarding-tutorial",
    description: "Testing guided vs self-explore onboarding",
    owner: "product-team",
    successMetrics: "activation_rate, day_7_retention",
    variants: [
      { key: "guided", weight: 50 },
      { key: "self-explore", weight: 50 },
    ],
    startsAt: mockTimestamp(-10),
    endsAt: mockTimestamp(-40),
    isActive: false,
    featureFlagKey: null,
    createdAt: mockTimestamp(60),
    updatedAt: mockTimestamp(40),
  },
];

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

export const featureFlagHandlers = [
  // GET /admin/feature-flags — List all flags
  http.get(`${API_BASE}/admin/feature-flags`, async () => {
    await delay(300);
    return HttpResponse.json({
      data: mockFlags,
      meta: { requestId: "req-ff-list" },
    });
  }),

  // GET /admin/feature-flags/:key — Flag detail
  http.get(`${API_BASE}/admin/feature-flags/:key`, async ({ params }) => {
    await delay(200);
    const flag = mockFlags.find((f) => f.key === params.key);
    if (!flag) {
      return HttpResponse.json(
        { message: "Feature flag not found", statusCode: 404 },
        { status: 404 }
      );
    }
    return HttpResponse.json({
      data: {
        ...flag,
        overrides: mockOverrides,
        userTargets: mockUserTargets,
      },
      meta: { requestId: "req-ff-detail" },
    });
  }),

  // POST /admin/feature-flags — Create flag
  http.post(`${API_BASE}/admin/feature-flags`, async ({ request }) => {
    await delay(400);
    const body = (await request.json()) as Record<string, unknown>;
    const newFlag = {
      id: `ff-${Date.now()}`,
      key: body.key,
      type: body.type || "BOOLEAN",
      description: body.description || "",
      owner: body.owner || "",
      defaultValue: body.defaultValue ?? false,
      rolloutPercentage: body.rolloutPercentage ?? null,
      allowedVerticals: body.allowedVerticals || [],
      allowedRoles: body.allowedRoles || [],
      reviewAt: body.reviewAt || null,
      expiresAt: body.expiresAt || null,
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return HttpResponse.json(
      { data: newFlag, meta: { requestId: "req-ff-create" } },
      { status: 201 }
    );
  }),

  // PATCH /admin/feature-flags/:key — Update flag
  http.patch(
    `${API_BASE}/admin/feature-flags/:key`,
    async ({ params, request }) => {
      await delay(300);
      const flag = mockFlags.find((f) => f.key === params.key);
      if (!flag) {
        return HttpResponse.json(
          { message: "Feature flag not found", statusCode: 404 },
          { status: 404 }
        );
      }
      const body = (await request.json()) as Record<string, unknown>;
      const updated = { ...flag, ...body, updatedAt: new Date().toISOString() };
      return HttpResponse.json({
        data: updated,
        meta: { requestId: "req-ff-update" },
      });
    }
  ),

  // POST /admin/feature-flags/:key/overrides — Add override
  http.post(
    `${API_BASE}/admin/feature-flags/:key/overrides`,
    async ({ request }) => {
      await delay(300);
      const body = (await request.json()) as Record<string, unknown>;
      const override = {
        id: `ov-${Date.now()}`,
        partnerId: body.partnerId || null,
        verticalType: body.verticalType || null,
        role: body.role || null,
        value: body.value ?? true,
        rolloutPercentage: body.rolloutPercentage ?? null,
        isEmergency: body.isEmergency ?? false,
        createdAt: new Date().toISOString(),
      };
      return HttpResponse.json(
        { data: override, meta: { requestId: "req-ff-override" } },
        { status: 201 }
      );
    }
  ),

  // POST /admin/feature-flags/:key/user-targets — Add user target
  http.post(
    `${API_BASE}/admin/feature-flags/:key/user-targets`,
    async ({ request }) => {
      await delay(300);
      const body = (await request.json()) as Record<string, unknown>;
      const target = {
        id: `ut-${Date.now()}`,
        partnerId: body.partnerId,
        userId: body.userId,
        value: body.value ?? true,
        createdAt: new Date().toISOString(),
      };
      return HttpResponse.json(
        { data: target, meta: { requestId: "req-ff-target" } },
        { status: 201 }
      );
    }
  ),

  // GET /admin/experiments — List experiments
  http.get(`${API_BASE}/admin/experiments`, async () => {
    await delay(300);
    return HttpResponse.json({
      data: mockExperiments,
      meta: { requestId: "req-exp-list" },
    });
  }),

  // GET /admin/experiments/:key — Experiment detail
  http.get(`${API_BASE}/admin/experiments/:key`, async ({ params }) => {
    await delay(200);
    const exp = mockExperiments.find((e) => e.key === params.key);
    if (!exp) {
      return HttpResponse.json(
        { message: "Experiment not found", statusCode: 404 },
        { status: 404 }
      );
    }
    return HttpResponse.json({
      data: exp,
      meta: { requestId: "req-exp-detail" },
    });
  }),

  // POST /admin/experiments — Create experiment
  http.post(`${API_BASE}/admin/experiments`, async ({ request }) => {
    await delay(400);
    const body = (await request.json()) as Record<string, unknown>;
    const newExp = {
      id: `exp-${Date.now()}`,
      key: body.key,
      description: body.description || "",
      owner: body.owner || "",
      successMetrics: body.successMetrics || "",
      variants: body.variants || [],
      startsAt: body.startsAt,
      endsAt: body.endsAt,
      isActive: body.isActive ?? false,
      featureFlagKey: body.featureFlagKey || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return HttpResponse.json(
      { data: newExp, meta: { requestId: "req-exp-create" } },
      { status: 201 }
    );
  }),

  // POST /admin/experiments/:key/partner-opt-in — Opt in/out partner
  http.post(
    `${API_BASE}/admin/experiments/:key/partner-opt-in`,
    async ({ request }) => {
      await delay(300);
      const body = (await request.json()) as Record<string, unknown>;
      return HttpResponse.json({
        data: {
          experimentKey: body.experimentKey,
          partnerId: body.partnerId,
          optIn: body.optIn,
        },
        meta: { requestId: "req-exp-optin" },
      });
    }
  ),

  // GET /feature-flags/check — Runtime flag check
  http.get(`${API_BASE}/feature-flags/check`, async ({ request }) => {
    await delay(100);
    const url = new URL(request.url);
    const key = url.searchParams.get("key");
    const flag = mockFlags.find((f) => f.key === key);
    return HttpResponse.json({
      data: {
        enabled: flag ? flag.defaultValue : false,
        variant: null,
      },
      meta: { requestId: "req-ff-check" },
    });
  }),
];
