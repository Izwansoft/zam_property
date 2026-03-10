// =============================================================================
// MSW Handlers — Pricing mock handlers
// =============================================================================
// Mocks for 8 endpoints:
//   GET    /pricing/configs
//   GET    /pricing/configs/:id
//   POST   /pricing/configs
//   PATCH  /pricing/configs/:id
//   DELETE /pricing/configs/:id
//   GET    /pricing/rules
//   POST   /pricing/rules
//   DELETE /pricing/rules/:id
//   GET    /pricing/charges
//   GET    /pricing/charges/:id
//   POST   /pricing/calculate
// =============================================================================

import { http, HttpResponse, delay } from "msw";
import { mockTimestamp } from "../utils";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000/api/v1";

// ---------------------------------------------------------------------------
// Mock Data — Pricing Configs
// ---------------------------------------------------------------------------

const mockPricingConfigs = [
  {
    id: "pc-001",
    partnerId: "p-001",
    model: "SAAS",
    name: "Standard SaaS Pricing",
    description: "Monthly subscription-based pricing model",
    config: { monthlyFee: 299, yearlyFee: 2990, features: ["listings", "leads", "analytics"] },
    verticalId: null,
    isActive: true,
    createdAt: mockTimestamp(90),
    updatedAt: mockTimestamp(5),
    rules: [],
  },
  {
    id: "pc-002",
    partnerId: "p-001",
    model: "LEAD_BASED",
    name: "Lead-Based Pricing",
    description: "Pay per lead received",
    config: { baseFee: 0, leadCost: 5, monthlyMinimum: 50 },
    verticalId: null,
    isActive: true,
    createdAt: mockTimestamp(60),
    updatedAt: mockTimestamp(3),
    rules: [],
  },
  {
    id: "pc-003",
    partnerId: "p-001",
    model: "HYBRID",
    name: "Hybrid Enterprise Plan",
    description: "Subscription + commission on transactions",
    config: { monthlyFee: 199, commissionRate: 2.5, cappedAt: 5000 },
    verticalId: null,
    isActive: false,
    createdAt: mockTimestamp(30),
    updatedAt: mockTimestamp(10),
    rules: [],
  },
];

// ---------------------------------------------------------------------------
// Mock Data — Pricing Rules
// ---------------------------------------------------------------------------

const mockPricingRules = [
  {
    id: "pr-001",
    pricingConfigId: "pc-001",
    name: "Monthly Subscription Fee",
    description: "Recurring monthly subscription charge",
    eventType: "subscription.renewed",
    chargeType: "SUBSCRIPTION",
    amount: 299,
    currency: "MYR",
    conditions: null,
    isActive: true,
    createdAt: mockTimestamp(90),
    updatedAt: mockTimestamp(5),
    pricingConfig: { id: "pc-001", name: "Standard SaaS Pricing", model: "SAAS" },
  },
  {
    id: "pr-002",
    pricingConfigId: "pc-001",
    name: "Lead Overage Charge",
    description: "Charge for leads exceeding monthly limit",
    eventType: "lead.overage",
    chargeType: "OVERAGE",
    amount: 2.5,
    currency: "MYR",
    conditions: { overLimit: 100 },
    isActive: true,
    createdAt: mockTimestamp(60),
    updatedAt: mockTimestamp(3),
    pricingConfig: { id: "pc-001", name: "Standard SaaS Pricing", model: "SAAS" },
  },
  {
    id: "pr-003",
    pricingConfigId: "pc-002",
    name: "Featured Listing Boost",
    description: "One-time charge for featured placement",
    eventType: "listing.featured",
    chargeType: "LISTING",
    amount: 50,
    currency: "MYR",
    conditions: { durationDays: 30 },
    isActive: true,
    createdAt: mockTimestamp(45),
    updatedAt: mockTimestamp(1),
    pricingConfig: { id: "pc-002", name: "Lead-Based Pricing", model: "LEAD_BASED" },
  },
];

// ---------------------------------------------------------------------------
// Mock Data — Charge Events
// ---------------------------------------------------------------------------

const mockChargeEvents = [
  {
    id: "ce-001",
    partnerId: "p-001",
    chargeType: "SUBSCRIPTION",
    amount: 299,
    currency: "MYR",
    eventType: "subscription.renewed",
    resourceType: "subscription",
    resourceId: "sub-001",
    processed: true,
    processedAt: mockTimestamp(1),
    createdAt: mockTimestamp(1),
  },
  {
    id: "ce-002",
    partnerId: "p-001",
    chargeType: "LEAD",
    amount: 5,
    currency: "MYR",
    eventType: "lead.created",
    resourceType: "interaction",
    resourceId: "int-001",
    processed: false,
    processedAt: null,
    createdAt: mockTimestamp(0),
  },
  {
    id: "ce-003",
    partnerId: "p-001",
    chargeType: "LISTING",
    amount: 50,
    currency: "MYR",
    eventType: "listing.featured",
    resourceType: "listing",
    resourceId: "lst-001",
    processed: true,
    processedAt: mockTimestamp(2),
    createdAt: mockTimestamp(3),
  },
];

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

export const pricingHandlers = [
  // GET /pricing/configs
  http.get(`${API_BASE}/pricing/configs`, async ({ request }) => {
    await delay(200);
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") || "1");
    const pageSize = Number(url.searchParams.get("pageSize") || "20");

    return HttpResponse.json({
      data: mockPricingConfigs,
      meta: {
        pagination: {
          page,
          pageSize,
          totalItems: mockPricingConfigs.length,
          totalPages: 1,
        },
      },
    });
  }),

  // GET /pricing/configs/:id
  http.get(`${API_BASE}/pricing/configs/:id`, async ({ params }) => {
    await delay(150);
    const config = mockPricingConfigs.find((c) => c.id === params.id);
    if (!config) {
      return HttpResponse.json({ message: "Config not found" }, { status: 404 });
    }
    const configWithRules = {
      ...config,
      rules: mockPricingRules.filter((r) => r.pricingConfigId === config.id),
    };
    return HttpResponse.json(configWithRules);
  }),

  // POST /pricing/configs
  http.post(`${API_BASE}/pricing/configs`, async ({ request }) => {
    await delay(300);
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      {
        id: `pc-${Date.now()}`,
        partnerId: "p-001",
        ...body,
        isActive: body.isActive ?? true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        rules: [],
      },
      { status: 201 },
    );
  }),

  // PATCH /pricing/configs/:id
  http.patch(`${API_BASE}/pricing/configs/:id`, async ({ params, request }) => {
    await delay(200);
    const body = (await request.json()) as Record<string, unknown>;
    const config = mockPricingConfigs.find((c) => c.id === params.id);
    if (!config) {
      return HttpResponse.json({ message: "Config not found" }, { status: 404 });
    }
    return HttpResponse.json({ ...config, ...body, updatedAt: new Date().toISOString() });
  }),

  // DELETE /pricing/configs/:id
  http.delete(`${API_BASE}/pricing/configs/:id`, async () => {
    await delay(200);
    return new HttpResponse(null, { status: 204 });
  }),

  // GET /pricing/rules
  http.get(`${API_BASE}/pricing/rules`, async ({ request }) => {
    await delay(200);
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") || "1");
    const pageSize = Number(url.searchParams.get("pageSize") || "20");
    const configId = url.searchParams.get("pricingConfigId");

    const filtered = configId
      ? mockPricingRules.filter((r) => r.pricingConfigId === configId)
      : mockPricingRules;

    return HttpResponse.json({
      data: filtered,
      meta: {
        pagination: {
          page,
          pageSize,
          totalItems: filtered.length,
          totalPages: 1,
        },
      },
    });
  }),

  // POST /pricing/rules
  http.post(`${API_BASE}/pricing/rules`, async ({ request }) => {
    await delay(300);
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      {
        id: `pr-${Date.now()}`,
        ...body,
        currency: body.currency || "MYR",
        isActive: body.isActive ?? true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { status: 201 },
    );
  }),

  // DELETE /pricing/rules/:id
  http.delete(`${API_BASE}/pricing/rules/:id`, async () => {
    await delay(200);
    return new HttpResponse(null, { status: 204 });
  }),

  // GET /pricing/charges
  http.get(`${API_BASE}/pricing/charges`, async ({ request }) => {
    await delay(200);
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") || "1");
    const pageSize = Number(url.searchParams.get("pageSize") || "20");

    return HttpResponse.json({
      data: mockChargeEvents,
      meta: {
        pagination: {
          page,
          pageSize,
          totalItems: mockChargeEvents.length,
          totalPages: 1,
        },
      },
    });
  }),

  // GET /pricing/charges/:id
  http.get(`${API_BASE}/pricing/charges/:id`, async ({ params }) => {
    await delay(150);
    const event = mockChargeEvents.find((e) => e.id === params.id);
    if (!event) {
      return HttpResponse.json({ message: "Charge event not found" }, { status: 404 });
    }
    return HttpResponse.json(event);
  }),

  // POST /pricing/calculate
  http.post(`${API_BASE}/pricing/calculate`, async () => {
    await delay(400);
    return HttpResponse.json({
      shouldCharge: true,
      chargeType: "LEAD",
      amount: 5,
      currency: "MYR",
      pricingConfigId: "pc-002",
      pricingRuleId: "pr-002",
      reason: "Lead charge applied based on lead-based pricing config",
    });
  }),
];
