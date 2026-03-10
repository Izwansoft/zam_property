// =============================================================================
// MSW Handlers — Partner admin mock handlers (Platform Admin)
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
// Mock partner data (8 partners with varied statuses/plans)
// ---------------------------------------------------------------------------

const MOCK_PARTNERS: Array<{
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  status: "ACTIVE" | "SUSPENDED" | "DEACTIVATED";
  logo: string | null;
  settings: Record<string, unknown> | null;
  plan: "FREE" | "STARTER" | "PROFESSIONAL" | "ENTERPRISE";
  userCount: number;
  vendorCount: number;
  listingCount: number;
  activeListingCount: number;
  enabledVerticals: string[];
  adminEmail: string;
  adminName: string;
  subscription: {
    plan: "FREE" | "STARTER" | "PROFESSIONAL" | "ENTERPRISE";
    status: "ACTIVE" | "PAST_DUE" | "CANCELLED" | "TRIALING";
    currentPeriodStart: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
  };
  usage: {
    vendorsUsed: number;
    vendorsLimit: number;
    listingsUsed: number;
    listingsLimit: number;
    storageUsedMB: number;
    storageLimitMB: number;
  };
  suspensionReason?: string;
  deactivationReason?: string;
  lastActivityAt?: string;
  createdAt: string;
  updatedAt: string;
}> = [
  {
    id: "partner-001",
    name: "Acme Realty Malaysia",
    slug: "acme-realty-my",
    domain: "acme-realty.zamproperty.com",
    status: "ACTIVE",
    logo: null,
    settings: { brandColor: "#3B82F6", currency: "MYR" },
    plan: "PROFESSIONAL",
    userCount: 28,
    vendorCount: 12,
    listingCount: 156,
    activeListingCount: 98,
    enabledVerticals: ["PROPERTY_SALE", "PROPERTY_RENTAL"],
    adminEmail: "admin@acmerealty.my",
    adminName: "Ahmad Razak",
    subscription: {
      plan: "PROFESSIONAL",
      status: "ACTIVE",
      currentPeriodStart: mockTimestamp(15),
      currentPeriodEnd: mockTimestamp(-15),
      cancelAtPeriodEnd: false,
    },
    usage: {
      vendorsUsed: 12,
      vendorsLimit: 50,
      listingsUsed: 156,
      listingsLimit: 500,
      storageUsedMB: 2048,
      storageLimitMB: 10240,
    },
    lastActivityAt: mockTimestamp(0),
    createdAt: mockTimestamp(365),
    updatedAt: mockTimestamp(1),
  },
  {
    id: "partner-002",
    name: "PropTech Solutions",
    slug: "proptech-solutions",
    domain: "proptech.zamproperty.com",
    status: "ACTIVE",
    logo: null,
    settings: { brandColor: "#10B981", currency: "MYR" },
    plan: "ENTERPRISE",
    userCount: 86,
    vendorCount: 45,
    listingCount: 890,
    activeListingCount: 672,
    enabledVerticals: ["PROPERTY_SALE", "PROPERTY_RENTAL", "COMMERCIAL_LEASE"],
    adminEmail: "ops@proptechsolutions.my",
    adminName: "Sarah Lim",
    subscription: {
      plan: "ENTERPRISE",
      status: "ACTIVE",
      currentPeriodStart: mockTimestamp(5),
      currentPeriodEnd: mockTimestamp(-25),
      cancelAtPeriodEnd: false,
    },
    usage: {
      vendorsUsed: 45,
      vendorsLimit: 200,
      listingsUsed: 890,
      listingsLimit: 5000,
      storageUsedMB: 8192,
      storageLimitMB: 51200,
    },
    lastActivityAt: mockTimestamp(0),
    createdAt: mockTimestamp(500),
    updatedAt: mockTimestamp(0),
  },
  {
    id: "partner-003",
    name: "KL Property Hub",
    slug: "kl-property-hub",
    domain: null,
    status: "ACTIVE",
    logo: null,
    settings: { brandColor: "#8B5CF6", currency: "MYR" },
    plan: "STARTER",
    userCount: 8,
    vendorCount: 5,
    listingCount: 32,
    activeListingCount: 24,
    enabledVerticals: ["PROPERTY_SALE"],
    adminEmail: "info@klpropertyhub.com",
    adminName: "Wei Ming Tan",
    subscription: {
      plan: "STARTER",
      status: "ACTIVE",
      currentPeriodStart: mockTimestamp(10),
      currentPeriodEnd: mockTimestamp(-20),
      cancelAtPeriodEnd: false,
    },
    usage: {
      vendorsUsed: 5,
      vendorsLimit: 10,
      listingsUsed: 32,
      listingsLimit: 100,
      storageUsedMB: 512,
      storageLimitMB: 2048,
    },
    lastActivityAt: mockTimestamp(1),
    createdAt: mockTimestamp(120),
    updatedAt: mockTimestamp(3),
  },
  {
    id: "partner-004",
    name: "Horizon Real Estate",
    slug: "horizon-re",
    domain: "horizon.zamproperty.com",
    status: "SUSPENDED",
    logo: null,
    settings: { brandColor: "#EF4444", currency: "MYR" },
    plan: "PROFESSIONAL",
    userCount: 15,
    vendorCount: 8,
    listingCount: 45,
    activeListingCount: 0,
    enabledVerticals: ["PROPERTY_SALE", "PROPERTY_RENTAL"],
    adminEmail: "admin@horizonre.my",
    adminName: "Raj Kumar",
    subscription: {
      plan: "PROFESSIONAL",
      status: "PAST_DUE",
      currentPeriodStart: mockTimestamp(45),
      currentPeriodEnd: mockTimestamp(15),
      cancelAtPeriodEnd: false,
    },
    usage: {
      vendorsUsed: 8,
      vendorsLimit: 50,
      listingsUsed: 45,
      listingsLimit: 500,
      storageUsedMB: 1024,
      storageLimitMB: 10240,
    },
    suspensionReason: "Payment overdue for more than 30 days. Multiple reminders sent without response.",
    lastActivityAt: mockTimestamp(30),
    createdAt: mockTimestamp(200),
    updatedAt: mockTimestamp(15),
  },
  {
    id: "partner-005",
    name: "Coastal Properties",
    slug: "coastal-properties",
    domain: null,
    status: "ACTIVE",
    logo: null,
    settings: { brandColor: "#0EA5E9", currency: "MYR" },
    plan: "FREE",
    userCount: 3,
    vendorCount: 2,
    listingCount: 8,
    activeListingCount: 6,
    enabledVerticals: ["PROPERTY_SALE"],
    adminEmail: "hello@coastalproperties.my",
    adminName: "Nurul Aisyah",
    subscription: {
      plan: "FREE",
      status: "ACTIVE",
      currentPeriodStart: mockTimestamp(30),
      currentPeriodEnd: mockTimestamp(-335),
      cancelAtPeriodEnd: false,
    },
    usage: {
      vendorsUsed: 2,
      vendorsLimit: 3,
      listingsUsed: 8,
      listingsLimit: 15,
      storageUsedMB: 128,
      storageLimitMB: 512,
    },
    lastActivityAt: mockTimestamp(2),
    createdAt: mockTimestamp(60),
    updatedAt: mockTimestamp(5),
  },
  {
    id: "partner-006",
    name: "MetroHomes",
    slug: "metrohomes",
    domain: "metrohomes.zamproperty.com",
    status: "DEACTIVATED",
    logo: null,
    settings: null,
    plan: "STARTER",
    userCount: 0,
    vendorCount: 0,
    listingCount: 0,
    activeListingCount: 0,
    enabledVerticals: [],
    adminEmail: "deactivated@metrohomes.my",
    adminName: "David Ong",
    subscription: {
      plan: "STARTER",
      status: "CANCELLED",
      currentPeriodStart: mockTimestamp(90),
      currentPeriodEnd: mockTimestamp(60),
      cancelAtPeriodEnd: true,
    },
    usage: {
      vendorsUsed: 0,
      vendorsLimit: 10,
      listingsUsed: 0,
      listingsLimit: 100,
      storageUsedMB: 0,
      storageLimitMB: 2048,
    },
    deactivationReason: "Partner owner requested account closure. All data archived.",
    lastActivityAt: mockTimestamp(60),
    createdAt: mockTimestamp(300),
    updatedAt: mockTimestamp(60),
  },
  {
    id: "partner-007",
    name: "GreenLiving Realty",
    slug: "greenliving-realty",
    domain: null,
    status: "ACTIVE",
    logo: null,
    settings: { brandColor: "#22C55E", currency: "MYR" },
    plan: "PROFESSIONAL",
    userCount: 42,
    vendorCount: 18,
    listingCount: 210,
    activeListingCount: 145,
    enabledVerticals: ["PROPERTY_SALE", "PROPERTY_RENTAL", "NEW_LAUNCH"],
    adminEmail: "admin@greenliving.my",
    adminName: "Azrina Binti Hassan",
    subscription: {
      plan: "PROFESSIONAL",
      status: "ACTIVE",
      currentPeriodStart: mockTimestamp(8),
      currentPeriodEnd: mockTimestamp(-22),
      cancelAtPeriodEnd: false,
    },
    usage: {
      vendorsUsed: 18,
      vendorsLimit: 50,
      listingsUsed: 210,
      listingsLimit: 500,
      storageUsedMB: 3584,
      storageLimitMB: 10240,
    },
    lastActivityAt: mockTimestamp(0),
    createdAt: mockTimestamp(180),
    updatedAt: mockTimestamp(0),
  },
  {
    id: "partner-008",
    name: "TrialTech Properties",
    slug: "trialtech-properties",
    domain: null,
    status: "ACTIVE",
    logo: null,
    settings: { brandColor: "#F59E0B", currency: "MYR" },
    plan: "STARTER",
    userCount: 2,
    vendorCount: 1,
    listingCount: 3,
    activeListingCount: 2,
    enabledVerticals: ["PROPERTY_SALE"],
    adminEmail: "trial@trialtechprops.my",
    adminName: "James Lee",
    subscription: {
      plan: "STARTER",
      status: "TRIALING",
      currentPeriodStart: mockTimestamp(7),
      currentPeriodEnd: mockTimestamp(-7),
      cancelAtPeriodEnd: false,
    },
    usage: {
      vendorsUsed: 1,
      vendorsLimit: 10,
      listingsUsed: 3,
      listingsLimit: 100,
      storageUsedMB: 64,
      storageLimitMB: 2048,
    },
    lastActivityAt: mockTimestamp(0),
    createdAt: mockTimestamp(7),
    updatedAt: mockTimestamp(1),
  },
];

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

export const PartnerAdminHandlers = [
  // GET /admin/partners (paginated — Format A)
  http.get(`${API_BASE}/admin/partners`, async ({ request }) => {
    await delay(250);

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const pageSize = parseInt(url.searchParams.get("pageSize") || "20", 10);
    const status = url.searchParams.get("status");
    const plan = url.searchParams.get("plan");
    const search = url.searchParams.get("search");
    const sortBy = url.searchParams.get("sortBy") || "createdAt";
    const sortOrder = url.searchParams.get("sortOrder") || "desc";

    let filtered = [...MOCK_PARTNERS];

    // Filter by status
    if (status) {
      filtered = filtered.filter((t) => t.status === status);
    }

    // Filter by plan
    if (plan) {
      filtered = filtered.filter((t) => t.plan === plan);
    }

    // Search by name, slug, or admin email
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.slug.toLowerCase().includes(q) ||
          t.adminEmail.toLowerCase().includes(q)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "vendorCount":
          comparison = a.vendorCount - b.vendorCount;
          break;
        case "updatedAt":
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
        case "createdAt":
        default:
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      return sortOrder === "desc" ? -comparison : comparison;
    });

    const start = (page - 1) * pageSize;
    const paginated = filtered.slice(start, start + pageSize);

    // Return list items (without extended detail fields like subscription/usage)
    const listItems = paginated.map(({ subscription: _s, usage: _u, suspensionReason: _sr, deactivationReason: _dr, ...rest }) => rest);

    return HttpResponse.json(
      mockPaginatedResponse(listItems, page, pageSize, filtered.length)
    );
  }),

  // GET /admin/partners/:id (single entity — with detail fields)
  http.get(`${API_BASE}/admin/partners/:id`, async ({ params }) => {
    await delay(200);

    const partner = MOCK_PARTNERS.find((t) => t.id === params.id);

    if (!partner) {
      return HttpResponse.json(
        mockErrorResponse("PARTNER_NOT_FOUND", "Partner not found"),
        { status: 404 }
      );
    }

    return HttpResponse.json(mockSuccessResponse(partner));
  }),

  // PATCH /admin/partners/:id/suspend
  http.patch(`${API_BASE}/admin/partners/:id/suspend`, async ({ params, request }) => {
    await delay(300);

    const partner = MOCK_PARTNERS.find((t) => t.id === params.id);

    if (!partner) {
      return HttpResponse.json(
        mockErrorResponse("PARTNER_NOT_FOUND", "Partner not found"),
        { status: 404 }
      );
    }

    if (partner.status !== "ACTIVE") {
      return HttpResponse.json(
        mockErrorResponse(
          "INVALID_STATUS_TRANSITION",
          `Cannot suspend partner with status ${partner.status}. Only ACTIVE partners can be suspended.`
        ),
        { status: 422 }
      );
    }

    const body = (await request.json()) as { reason?: string };

    if (!body.reason?.trim()) {
      return HttpResponse.json(
        mockErrorResponse("VALIDATION_ERROR", "Suspension reason is required", [
          { field: "reason", code: "REQUIRED", message: "Reason is required" },
        ]),
        { status: 422 }
      );
    }

    partner.status = "SUSPENDED";
    partner.suspensionReason = body.reason.trim();
    partner.activeListingCount = 0;
    partner.updatedAt = new Date().toISOString();

    return HttpResponse.json(mockSuccessResponse(partner));
  }),

  // PATCH /admin/partners/:id/reactivate
  http.patch(`${API_BASE}/admin/partners/:id/reactivate`, async ({ params }) => {
    await delay(300);

    const partner = MOCK_PARTNERS.find((t) => t.id === params.id);

    if (!partner) {
      return HttpResponse.json(
        mockErrorResponse("PARTNER_NOT_FOUND", "Partner not found"),
        { status: 404 }
      );
    }

    if (partner.status !== "SUSPENDED") {
      return HttpResponse.json(
        mockErrorResponse(
          "INVALID_STATUS_TRANSITION",
          `Cannot reactivate partner with status ${partner.status}. Only SUSPENDED partners can be reactivated.`
        ),
        { status: 422 }
      );
    }

    partner.status = "ACTIVE";
    partner.suspensionReason = undefined;
    partner.updatedAt = new Date().toISOString();

    return HttpResponse.json(mockSuccessResponse(partner));
  }),

  // PATCH /admin/partners/:id/deactivate
  http.patch(`${API_BASE}/admin/partners/:id/deactivate`, async ({ params, request }) => {
    await delay(300);

    const partner = MOCK_PARTNERS.find((t) => t.id === params.id);

    if (!partner) {
      return HttpResponse.json(
        mockErrorResponse("PARTNER_NOT_FOUND", "Partner not found"),
        { status: 404 }
      );
    }

    if (partner.status === "DEACTIVATED") {
      return HttpResponse.json(
        mockErrorResponse(
          "INVALID_STATUS_TRANSITION",
          "Partner is already deactivated."
        ),
        { status: 422 }
      );
    }

    const body = (await request.json()) as { reason?: string };

    if (!body.reason?.trim()) {
      return HttpResponse.json(
        mockErrorResponse("VALIDATION_ERROR", "Deactivation reason is required", [
          { field: "reason", code: "REQUIRED", message: "Reason is required" },
        ]),
        { status: 422 }
      );
    }

    partner.status = "DEACTIVATED";
    partner.deactivationReason = body.reason.trim();
    partner.activeListingCount = 0;
    partner.vendorCount = 0;
    partner.listingCount = 0;
    partner.updatedAt = new Date().toISOString();

    return HttpResponse.json(mockSuccessResponse(partner));
  }),

  // PATCH /admin/partners/:id/settings
  http.patch(`${API_BASE}/admin/partners/:id/settings`, async ({ params, request }) => {
    await delay(300);

    const partner = MOCK_PARTNERS.find((t) => t.id === params.id);

    if (!partner) {
      return HttpResponse.json(
        mockErrorResponse("PARTNER_NOT_FOUND", "Partner not found"),
        { status: 404 }
      );
    }

    const body = (await request.json()) as {
      name?: string;
      domain?: string | null;
      logo?: string | null;
      enabledVerticals?: string[];
      settings?: Record<string, unknown>;
    };

    // Apply updates
    if (body.name !== undefined) partner.name = body.name;
    if (body.domain !== undefined) partner.domain = body.domain;
    if (body.logo !== undefined) partner.logo = body.logo;
    if (body.enabledVerticals !== undefined) partner.enabledVerticals = body.enabledVerticals;
    if (body.settings !== undefined) partner.settings = { ...partner.settings, ...body.settings };
    partner.updatedAt = new Date().toISOString();

    return HttpResponse.json(mockSuccessResponse(partner));
  }),

  // POST /admin/partners — Create new partner (SUPER_ADMIN)
  http.post(`${API_BASE}/admin/partners`, async ({ request }) => {
    await delay(500);

    const body = (await request.json()) as {
      name: string;
      slug: string;
      verticalTypes?: string[];
      adminEmail: string;
      adminName: string;
      adminPassword: string;
      adminPhone?: string;
      branding?: Record<string, unknown>;
    };

    // Basic validation
    if (!body.name || !body.slug || !body.adminEmail || !body.adminName || !body.adminPassword) {
      return HttpResponse.json(
        mockErrorResponse("VALIDATION_ERROR", "Missing required fields", [
          ...(!body.name ? [{ field: "name", code: "REQUIRED", message: "Name is required" }] : []),
          ...(!body.slug ? [{ field: "slug", code: "REQUIRED", message: "Slug is required" }] : []),
          ...(!body.adminEmail ? [{ field: "adminEmail", code: "REQUIRED", message: "Admin email is required" }] : []),
          ...(!body.adminName ? [{ field: "adminName", code: "REQUIRED", message: "Admin name is required" }] : []),
          ...(!body.adminPassword ? [{ field: "adminPassword", code: "REQUIRED", message: "Admin password is required" }] : []),
        ]),
        { status: 400 }
      );
    }

    // Check slug uniqueness
    if (MOCK_PARTNERS.some((p) => p.slug === body.slug)) {
      return HttpResponse.json(
        mockErrorResponse("SLUG_CONFLICT", `Slug "${body.slug}" is already in use`),
        { status: 409 }
      );
    }

    const newPartner = {
      id: `partner-${String(MOCK_PARTNERS.length + 1).padStart(3, "0")}`,
      name: body.name,
      slug: body.slug,
      domain: null,
      status: "ACTIVE" as const,
      logo: null,
      settings: null,
      plan: "FREE" as const,
      userCount: 1, // Admin user
      vendorCount: 0,
      listingCount: 0,
      activeListingCount: 0,
      enabledVerticals: body.verticalTypes ?? [],
      adminEmail: body.adminEmail,
      adminName: body.adminName,
      subscription: {
        plan: "FREE" as const,
        status: "TRIALING" as const,
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        cancelAtPeriodEnd: false,
      },
      usage: {
        vendorsUsed: 0,
        vendorsLimit: 10,
        listingsUsed: 0,
        listingsLimit: 50,
        storageUsedMB: 0,
        storageLimitMB: 500,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    MOCK_PARTNERS.push(newPartner);

    return HttpResponse.json(mockSuccessResponse(newPartner), { status: 201 });
  }),
];
