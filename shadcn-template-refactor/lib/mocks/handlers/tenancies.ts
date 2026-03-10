// =============================================================================
// MSW Handlers — Tenancy domain mock handlers
// =============================================================================
// Mocks the tenancy list and detail endpoints for tenant portal.
// =============================================================================

import { http, HttpResponse, delay } from "msw";
import {
  mockSuccessResponse,
  mockPaginatedResponse,
  mockErrorResponse,
  mockTimestamp,
  nextId,
} from "../utils";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000/api/v1";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MockTenancy {
  id: string;
  partnerId: string;
  tenantId: string;
  propertyId: string;
  unitId?: string;
  ownerId: string;
  type: string;
  status: string;
  startDate: string;
  endDate: string;
  moveInDate?: string;
  moveOutDate?: string;
  monthlyRent: number;
  currency: string;
  securityDeposit: number;
  utilityDeposit: number;
  noticePeriodDays: number;
  property: {
    id: string;
    title: string;
    address: string;
    city?: string;
    state?: string;
    thumbnailUrl?: string;
    propertyType?: string;
    bedrooms?: number;
    bathrooms?: number;
  };
  unit?: {
    id: string;
    unitNumber: string;
    floor?: number;
    block?: string;
  };
  owner?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
  };
  contractId?: string;
  contractUrl?: string;
  contractStatus?: string;
  createdAt: string;
  updatedAt: string;
}

interface MockTenancyStatusChange {
  id: string;
  fromStatus: string;
  toStatus: string;
  changedAt: string;
  changedById: string;
  reason?: string;
}

// ---------------------------------------------------------------------------
// In-memory store
// ---------------------------------------------------------------------------

const tenancyStore: Map<string, MockTenancy> = new Map();
const statusHistoryStore: Map<string, MockTenancyStatusChange[]> = new Map();

// Pre-populate sample tenancies
const sampleTenancies: MockTenancy[] = [
  {
    id: "tenancy-001",
    partnerId: "partner-001",
    tenantId: "tenant-001",
    propertyId: "property-001",
    unitId: "unit-001",
    ownerId: "owner-001",
    type: "RESIDENTIAL",
    status: "ACTIVE",
    startDate: "2024-01-01",
    endDate: "2025-01-01",
    moveInDate: "2024-01-05",
    monthlyRent: 2500,
    currency: "MYR",
    securityDeposit: 5000,
    utilityDeposit: 500,
    noticePeriodDays: 60,
    property: {
      id: "property-001",
      title: "Luxurious Condo at KLCC",
      address: "No. 1, Jalan Sultan Ismail, KLCC",
      city: "Kuala Lumpur",
      state: "WP Kuala Lumpur",
      thumbnailUrl: "https://placehold.co/400x300/4f46e5/white?text=KLCC+Condo",
      propertyType: "Condominium",
      bedrooms: 3,
      bathrooms: 2,
    },
    unit: {
      id: "unit-001",
      unitNumber: "A-12-03",
      floor: 12,
      block: "A",
    },
    owner: {
      id: "owner-001",
      name: "Tan Properties Sdn Bhd",
      email: "tan@properties.com",
      phone: "0123456789",
    },
    contractId: "contract-001",
    contractUrl: "/mock/contracts/sample.pdf",
    contractStatus: "SIGNED",
    createdAt: "2023-12-15T10:00:00.000Z",
    updatedAt: mockTimestamp(),
  },
  {
    id: "tenancy-002",
    partnerId: "partner-001",
    tenantId: "tenant-001",
    propertyId: "property-002",
    ownerId: "owner-002",
    type: "RESIDENTIAL",
    status: "PENDING_CONTRACT",
    startDate: "2025-02-01",
    endDate: "2026-02-01",
    monthlyRent: 1800,
    currency: "MYR",
    securityDeposit: 3600,
    utilityDeposit: 400,
    noticePeriodDays: 30,
    property: {
      id: "property-002",
      title: "Modern Apartment in Bangsar",
      address: "Jalan Maarof, Bangsar",
      city: "Kuala Lumpur",
      state: "WP Kuala Lumpur",
      thumbnailUrl: "https://placehold.co/400x300/10b981/white?text=Bangsar+Apt",
      propertyType: "Apartment",
      bedrooms: 2,
      bathrooms: 1,
    },
    owner: {
      id: "owner-002",
      name: "Lee Mei Ling",
      email: "meiling@gmail.com",
      phone: "0198765432",
    },
    createdAt: "2025-01-20T14:00:00.000Z",
    updatedAt: mockTimestamp(),
  },
  {
    id: "tenancy-003",
    partnerId: "partner-001",
    tenantId: "tenant-001",
    propertyId: "property-003",
    ownerId: "owner-003",
    type: "RESIDENTIAL",
    status: "OVERDUE",
    startDate: "2023-06-01",
    endDate: "2024-06-01",
    moveInDate: "2023-06-05",
    monthlyRent: 3200,
    currency: "MYR",
    securityDeposit: 6400,
    utilityDeposit: 600,
    noticePeriodDays: 60,
    property: {
      id: "property-003",
      title: "Premium Studio in Mont Kiara",
      address: "Mont Kiara Boulevard",
      city: "Kuala Lumpur",
      state: "WP Kuala Lumpur",
      thumbnailUrl: "https://placehold.co/400x300/ef4444/white?text=MK+Studio",
      propertyType: "Studio",
      bedrooms: 1,
      bathrooms: 1,
    },
    owner: {
      id: "owner-003",
      name: "Wong Holdings",
      email: "contact@wongholdings.com",
      phone: "0387654321",
    },
    contractId: "contract-003",
    contractUrl: "/mock/contracts/sample.pdf",
    contractStatus: "SIGNED",
    createdAt: "2023-05-10T08:00:00.000Z",
    updatedAt: mockTimestamp(),
  },
  {
    id: "tenancy-004",
    partnerId: "partner-001",
    tenantId: "tenant-001",
    propertyId: "property-004",
    ownerId: "owner-004",
    type: "RESIDENTIAL",
    status: "TERMINATED",
    startDate: "2022-01-01",
    endDate: "2023-01-01",
    moveInDate: "2022-01-10",
    moveOutDate: "2023-01-05",
    monthlyRent: 1500,
    currency: "MYR",
    securityDeposit: 3000,
    utilityDeposit: 300,
    noticePeriodDays: 30,
    property: {
      id: "property-004",
      title: "Cozy House in Petaling Jaya",
      address: "SS2, Petaling Jaya",
      city: "Petaling Jaya",
      state: "Selangor",
      thumbnailUrl: "https://placehold.co/400x300/6b7280/white?text=PJ+House",
      propertyType: "Terrace House",
      bedrooms: 4,
      bathrooms: 3,
    },
    owner: {
      id: "owner-004",
      name: "Ahmad Razak",
      email: "ahmad.razak@email.com",
      phone: "0192223333",
    },
    contractId: "contract-004",
    contractUrl: "/mock/contracts/sample.pdf",
    contractStatus: "EXPIRED",
    createdAt: "2021-11-20T12:00:00.000Z",
    updatedAt: "2023-01-05T10:00:00.000Z",
  },
  {
    id: "tenancy-005",
    partnerId: "partner-001",
    tenantId: "tenant-001",
    propertyId: "property-005",
    ownerId: "owner-005",
    type: "RESIDENTIAL",
    status: "PENDING_SIGNATURES",
    startDate: "2025-03-01",
    endDate: "2026-03-01",
    monthlyRent: 2800,
    currency: "MYR",
    securityDeposit: 5600,
    utilityDeposit: 500,
    noticePeriodDays: 60,
    property: {
      id: "property-005",
      title: "Executive Suite in Damansara",
      address: "Damansara Heights",
      city: "Kuala Lumpur",
      state: "WP Kuala Lumpur",
      thumbnailUrl: "https://placehold.co/400x300/f59e0b/white?text=DH+Suite",
      propertyType: "Condominium",
      bedrooms: 2,
      bathrooms: 2,
    },
    owner: {
      id: "owner-005",
      name: "Prestige Rentals",
      email: "info@prestigerentals.com",
      phone: "0312345678",
    },
    contractId: "contract-005",
    contractUrl: "/mock/contracts/sample.pdf",
    contractStatus: "PENDING_SIGNATURES",
    createdAt: "2025-02-01T09:00:00.000Z",
    updatedAt: mockTimestamp(),
  },
];

// Initialize store
sampleTenancies.forEach((t) => tenancyStore.set(t.id, t));

// Initialize sample status history
statusHistoryStore.set("tenancy-001", [
  {
    id: "history-001",
    fromStatus: "PENDING_BOOKING",
    toStatus: "PENDING_CONTRACT",
    changedAt: "2023-12-16T10:00:00.000Z",
    changedById: "system",
  },
  {
    id: "history-002",
    fromStatus: "PENDING_CONTRACT",
    toStatus: "PENDING_SIGNATURES",
    changedAt: "2023-12-18T14:00:00.000Z",
    changedById: "owner-001",
  },
  {
    id: "history-003",
    fromStatus: "PENDING_SIGNATURES",
    toStatus: "APPROVED",
    changedAt: "2023-12-22T09:00:00.000Z",
    changedById: "tenant-001",
  },
  {
    id: "history-004",
    fromStatus: "APPROVED",
    toStatus: "ACTIVE",
    changedAt: "2024-01-05T08:00:00.000Z",
    changedById: "system",
  },
]);

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

export const tenancyHandlers = [
  // ---------------------------------------------------------------------------
  // GET /tenancies — Admin-scoped tenancy list
  // ---------------------------------------------------------------------------
  http.get(`${API_BASE}/tenancies`, async ({ request }) => {
    await delay(300);

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const pageSize = parseInt(url.searchParams.get("pageSize") || "20", 10);
    const statusParam = url.searchParams.get("status");

    let data = [...tenancyStore.values()];
    if (statusParam) {
      const statuses = statusParam.split(",");
      data = data.filter((t) => statuses.includes(t.status));
    }

    const total = data.length;
    const totalPages = Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    const paginatedData = data.slice(start, start + pageSize);

    return HttpResponse.json({
      data: paginatedData,
      meta: { pagination: { page, pageSize, totalItems: total, totalPages } },
    });
  }),

  // ---------------------------------------------------------------------------
  // GET /tenants/me/tenancies — List tenant's tenancies
  // ---------------------------------------------------------------------------
  http.get(`${API_BASE}/tenants/me/tenancies`, async ({ request }) => {
    await delay(300);

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const pageSize = parseInt(url.searchParams.get("pageSize") || "10", 10);
    const statusParam = url.searchParams.get("status");
    const sortBy = url.searchParams.get("sortBy") || "startDate";
    const sortOrder = url.searchParams.get("sortOrder") || "desc";

    let tenancies = Array.from(tenancyStore.values());

    // Filter by status (can be multiple)
    if (statusParam) {
      const statuses = statusParam.includes(",")
        ? statusParam.split(",")
        : [statusParam];
      tenancies = tenancies.filter((t) => statuses.includes(t.status));
    }

    // Sort
    tenancies.sort((a, b) => {
      let aVal: string | number = a[sortBy as keyof MockTenancy] as string | number;
      let bVal: string | number = b[sortBy as keyof MockTenancy] as string | number;

      if (sortBy === "monthlyRent") {
        aVal = Number(aVal);
        bVal = Number(bVal);
      } else {
        aVal = String(aVal);
        bVal = String(bVal);
      }

      if (sortOrder === "asc") {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      }
      return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
    });

    // Paginate
    const total = tenancies.length;
    const totalPages = Math.ceil(total / pageSize);
    const startIdx = (page - 1) * pageSize;
    const items = tenancies.slice(startIdx, startIdx + pageSize);

    return HttpResponse.json(
      mockPaginatedResponse(items, page, pageSize, total)
    );
  }),

  // ---------------------------------------------------------------------------
  // GET /tenancies/:id — Get tenancy detail
  // ---------------------------------------------------------------------------
  http.get(`${API_BASE}/tenancies/:id`, async ({ params }) => {
    await delay(200);

    const { id } = params as { id: string };
    const tenancy = tenancyStore.get(id);

    if (!tenancy) {
      return HttpResponse.json(
        mockErrorResponse("TENANCY_NOT_FOUND", "Tenancy not found"),
        { status: 404 }
      );
    }

    // Build detailed response with financial summary
    const financial = {
      monthlyRent: tenancy.monthlyRent,
      securityDeposit: tenancy.securityDeposit,
      utilityDeposit: tenancy.utilityDeposit,
      stampDutyFee: 100,
      currency: tenancy.currency,
      totalDeposits: tenancy.securityDeposit + tenancy.utilityDeposit,
      depositsCollected: tenancy.status === "ACTIVE" ? tenancy.securityDeposit + tenancy.utilityDeposit : 0,
      depositsPending: tenancy.status === "ACTIVE" ? 0 : tenancy.securityDeposit + tenancy.utilityDeposit,
      outstandingBalance: tenancy.status === "OVERDUE" ? tenancy.monthlyRent * 2 : 0,
    };

    const statusHistory = statusHistoryStore.get(id) || [];

    const detailedTenancy = {
      ...tenancy,
      financial,
      statusHistory,
      renewalTerms: "Auto-renewal with 60-day notice",
      specialTerms: "No pets allowed. No smoking indoors.",
    };

    return HttpResponse.json(mockSuccessResponse(detailedTenancy));
  }),

  // ---------------------------------------------------------------------------
  // POST /tenancies — Create new tenancy (booking)
  // ---------------------------------------------------------------------------
  http.post(`${API_BASE}/tenancies`, async ({ request }) => {
    await delay(400);

    try {
      const body = (await request.json()) as {
        listingId?: string;
        propertyId?: string;
        unitId?: string;
        ownerId?: string;
        type?: string;
        startDate?: string;
        endDate?: string;
        monthlyRent?: number;
        currency?: string;
        securityDeposit?: number;
        utilityDeposit?: number;
        noticePeriodDays?: number;
        paymentIntentId?: string;
        property?: MockTenancy["property"];
        owner?: MockTenancy["owner"];
      };

      // Use listingId as propertyId if propertyId not provided
      const propertyId = body.propertyId || body.listingId || `property-${nextId()}`;

      const newTenancy: MockTenancy = {
        id: `tenancy-${nextId()}`,
        partnerId: "partner-001",
        tenantId: "tenant-001",
        propertyId,
        unitId: body.unitId,
        ownerId: body.ownerId || "owner-001",
        type: body.type || "RESIDENTIAL",
        status: "PENDING_BOOKING",
        startDate: body.startDate || new Date().toISOString().split("T")[0],
        endDate: body.endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        monthlyRent: body.monthlyRent || 2000,
        currency: body.currency || "MYR",
        securityDeposit: body.securityDeposit || (body.monthlyRent || 2000) * 2,
        utilityDeposit: body.utilityDeposit || 500,
        noticePeriodDays: body.noticePeriodDays || 30,
        property: body.property || {
          id: propertyId,
          title: "New Property Booking",
          address: "Address to be confirmed",
        },
        owner: body.owner,
        createdAt: mockTimestamp(),
        updatedAt: mockTimestamp(),
      };

      tenancyStore.set(newTenancy.id, newTenancy);

      // Add initial status history
      statusHistoryStore.set(newTenancy.id, [
        {
          id: `history-${nextId()}`,
          fromStatus: "",
          toStatus: "PENDING_BOOKING",
          changedAt: mockTimestamp(),
          changedById: "user-001",
          reason: body.paymentIntentId ? `Deposit payment: ${body.paymentIntentId}` : "Booking initiated",
        },
      ]);

      return HttpResponse.json(mockSuccessResponse(newTenancy), { status: 201 });
    } catch {
      return HttpResponse.json(
        mockErrorResponse("INVALID_REQUEST", "Invalid request body"),
        { status: 400 }
      );
    }
  }),

  // ---------------------------------------------------------------------------
  // PATCH /tenancies/:id/status — Update tenancy status
  // ---------------------------------------------------------------------------
  http.patch(`${API_BASE}/tenancies/:id/status`, async ({ params, request }) => {
    await delay(300);

    const { id } = params as { id: string };
    const tenancy = tenancyStore.get(id);

    if (!tenancy) {
      return HttpResponse.json(
        mockErrorResponse("TENANCY_NOT_FOUND", "Tenancy not found"),
        { status: 404 }
      );
    }

    try {
      const body = (await request.json()) as { status: string; reason?: string };
      const oldStatus = tenancy.status;

      tenancy.status = body.status;
      tenancy.updatedAt = mockTimestamp();

      // Add to status history
      const history = statusHistoryStore.get(id) || [];
      history.push({
        id: `history-${nextId()}`,
        fromStatus: oldStatus,
        toStatus: body.status,
        changedAt: mockTimestamp(),
        changedById: "user-001",
        reason: body.reason,
      });
      statusHistoryStore.set(id, history);

      tenancyStore.set(id, tenancy);

      return HttpResponse.json(mockSuccessResponse(tenancy));
    } catch {
      return HttpResponse.json(
        mockErrorResponse("INVALID_REQUEST", "Invalid request body"),
        { status: 400 }
      );
    }
  }),

  // ---------------------------------------------------------------------------
  // POST /tenancies/:id/request-termination — Request termination
  // ---------------------------------------------------------------------------
  http.post(`${API_BASE}/tenancies/:id/request-termination`, async ({ params, request }) => {
    await delay(300);

    const { id } = params as { id: string };
    const tenancy = tenancyStore.get(id);

    if (!tenancy) {
      return HttpResponse.json(
        mockErrorResponse("TENANCY_NOT_FOUND", "Tenancy not found"),
        { status: 404 }
      );
    }

    if (tenancy.status !== "ACTIVE" && tenancy.status !== "OVERDUE") {
      return HttpResponse.json(
        mockErrorResponse("INVALID_STATUS", "Can only request termination for active tenancies"),
        { status: 400 }
      );
    }

    try {
      const body = (await request.json()) as { reason: string; requestedMoveOutDate: string };
      const oldStatus = tenancy.status;

      tenancy.status = "TERMINATION_REQUESTED";
      tenancy.updatedAt = mockTimestamp();

      // Add to status history
      const history = statusHistoryStore.get(id) || [];
      history.push({
        id: `history-${nextId()}`,
        fromStatus: oldStatus,
        toStatus: "TERMINATION_REQUESTED",
        changedAt: mockTimestamp(),
        changedById: "tenant-001",
        reason: body.reason,
      });
      statusHistoryStore.set(id, history);

      tenancyStore.set(id, tenancy);

      return HttpResponse.json(mockSuccessResponse({
        ...tenancy,
        terminationRequest: {
          reason: body.reason,
          requestedMoveOutDate: body.requestedMoveOutDate,
          requestedAt: mockTimestamp(),
        },
      }));
    } catch {
      return HttpResponse.json(
        mockErrorResponse("INVALID_REQUEST", "Invalid request body"),
        { status: 400 }
      );
    }
  }),

  // ---------------------------------------------------------------------------
  // OWNER/VENDOR HANDLERS
  // ---------------------------------------------------------------------------

  // ---------------------------------------------------------------------------
  // GET /vendors/me/tenancies — List owner's tenancies across all properties
  // ---------------------------------------------------------------------------
  http.get(`${API_BASE}/vendors/me/tenancies`, async ({ request }) => {
    await delay(300);

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const pageSize = parseInt(url.searchParams.get("pageSize") || "20", 10);
    const statusParam = url.searchParams.get("status");
    const propertyId = url.searchParams.get("propertyId");

    // Mock: All tenancies belong to this owner for demo
    let tenancies = Array.from(tenancyStore.values());

    // Filter by status
    if (statusParam) {
      const statuses = statusParam.includes(",")
        ? statusParam.split(",")
        : [statusParam];
      tenancies = tenancies.filter((t) => statuses.includes(t.status));
    }

    // Filter by property
    if (propertyId) {
      tenancies = tenancies.filter((t) => t.propertyId === propertyId);
    }

    // Sort by start date descending
    tenancies.sort((a, b) => 
      new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );

    // Paginate
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const items = tenancies.slice(start, end);

    return HttpResponse.json(mockPaginatedResponse(items, page, pageSize, tenancies.length));
  }),

  // ---------------------------------------------------------------------------
  // GET /vendors/me/tenancies/summary — Get owner's tenancy summary stats
  // ---------------------------------------------------------------------------
  http.get(`${API_BASE}/vendors/me/tenancies/summary`, async () => {
    await delay(200);

    const tenancies = Array.from(tenancyStore.values());

    const summary = {
      totalTenancies: tenancies.length,
      activeTenancies: tenancies.filter((t) => t.status === "ACTIVE").length,
      pendingTenancies: tenancies.filter((t) =>
        ["PENDING_BOOKING", "PENDING_CONTRACT", "PENDING_SIGNATURES"].includes(t.status)
      ).length,
      overdueTenancies: tenancies.filter((t) => t.status === "OVERDUE").length,
      terminatingTenancies: tenancies.filter((t) =>
        ["TERMINATION_REQUESTED", "TERMINATING"].includes(t.status)
      ).length,
      totalMonthlyRevenue: tenancies
        .filter((t) => t.status === "ACTIVE")
        .reduce((sum, t) => sum + t.monthlyRent, 0),
    };

    return HttpResponse.json(mockSuccessResponse(summary));
  }),

  // ---------------------------------------------------------------------------
  // POST /tenancies/:id/approve — Owner approves a tenancy
  // ---------------------------------------------------------------------------
  http.post(`${API_BASE}/tenancies/:id/approve`, async ({ params }) => {
    await delay(300);

    const { id } = params as { id: string };
    const tenancy = tenancyStore.get(id);

    if (!tenancy) {
      return HttpResponse.json(
        mockErrorResponse("TENANCY_NOT_FOUND", "Tenancy not found"),
        { status: 404 }
      );
    }

    if (tenancy.status !== "PENDING_BOOKING") {
      return HttpResponse.json(
        mockErrorResponse("INVALID_STATUS", "Can only approve pending booking tenancies"),
        { status: 400 }
      );
    }

    const oldStatus = tenancy.status;
    tenancy.status = "PENDING_CONTRACT";
    tenancy.updatedAt = mockTimestamp();

    // Add to status history
    const history = statusHistoryStore.get(id) || [];
    history.push({
      id: `history-${nextId()}`,
      fromStatus: oldStatus,
      toStatus: "PENDING_CONTRACT",
      changedAt: mockTimestamp(),
      changedById: "owner-001",
    });
    statusHistoryStore.set(id, history);

    tenancyStore.set(id, tenancy);

    return HttpResponse.json(mockSuccessResponse(tenancy));
  }),

  // ---------------------------------------------------------------------------
  // POST /tenancies/:id/reject — Owner rejects a tenancy
  // ---------------------------------------------------------------------------
  http.post(`${API_BASE}/tenancies/:id/reject`, async ({ params, request }) => {
    await delay(300);

    const { id } = params as { id: string };
    const tenancy = tenancyStore.get(id);

    if (!tenancy) {
      return HttpResponse.json(
        mockErrorResponse("TENANCY_NOT_FOUND", "Tenancy not found"),
        { status: 404 }
      );
    }

    if (tenancy.status !== "PENDING_BOOKING") {
      return HttpResponse.json(
        mockErrorResponse("INVALID_STATUS", "Can only reject pending booking tenancies"),
        { status: 400 }
      );
    }

    try {
      const body = (await request.json()) as { reason: string };
      const oldStatus = tenancy.status;

      tenancy.status = "CANCELLED";
      tenancy.updatedAt = mockTimestamp();

      // Add to status history
      const history = statusHistoryStore.get(id) || [];
      history.push({
        id: `history-${nextId()}`,
        fromStatus: oldStatus,
        toStatus: "CANCELLED",
        changedAt: mockTimestamp(),
        changedById: "owner-001",
        reason: body.reason,
      });
      statusHistoryStore.set(id, history);

      tenancyStore.set(id, tenancy);

      return HttpResponse.json(mockSuccessResponse(tenancy));
    } catch {
      return HttpResponse.json(
        mockErrorResponse("INVALID_REQUEST", "Invalid request body"),
        { status: 400 }
      );
    }
  }),

  // ---------------------------------------------------------------------------
  // POST /tenancies/:id/confirm-deposit — Owner confirms deposit received
  // ---------------------------------------------------------------------------
  http.post(`${API_BASE}/tenancies/:id/confirm-deposit`, async ({ params, request }) => {
    await delay(300);

    const { id } = params as { id: string };
    const tenancy = tenancyStore.get(id);

    if (!tenancy) {
      return HttpResponse.json(
        mockErrorResponse("TENANCY_NOT_FOUND", "Tenancy not found"),
        { status: 404 }
      );
    }

    if (tenancy.status !== "PENDING_CONTRACT" && tenancy.status !== "PENDING_SIGNATURES") {
      return HttpResponse.json(
        mockErrorResponse("INVALID_STATUS", "Can only confirm deposit for pending contract/signatures tenancies"),
        { status: 400 }
      );
    }

    try {
      const body = (await request.json()) as { depositType: string; amount: number; receivedDate: string };

      // Just acknowledge the deposit confirmation
      tenancy.updatedAt = mockTimestamp();
      tenancyStore.set(id, tenancy);

      return HttpResponse.json(mockSuccessResponse({
        ...tenancy,
        depositConfirmation: {
          depositType: body.depositType,
          amount: body.amount,
          receivedDate: body.receivedDate,
          confirmedAt: mockTimestamp(),
        },
      }));
    } catch {
      return HttpResponse.json(
        mockErrorResponse("INVALID_REQUEST", "Invalid request body"),
        { status: 400 }
      );
    }
  }),

  // ---------------------------------------------------------------------------
  // POST /tenancies/:id/process-termination — Owner processes termination
  // ---------------------------------------------------------------------------
  http.post(`${API_BASE}/tenancies/:id/process-termination`, async ({ params, request }) => {
    await delay(300);

    const { id } = params as { id: string };
    const tenancy = tenancyStore.get(id);

    if (!tenancy) {
      return HttpResponse.json(
        mockErrorResponse("TENANCY_NOT_FOUND", "Tenancy not found"),
        { status: 404 }
      );
    }

    if (tenancy.status !== "TERMINATION_REQUESTED") {
      return HttpResponse.json(
        mockErrorResponse("INVALID_STATUS", "Can only process termination for tenancies with termination requested"),
        { status: 400 }
      );
    }

    try {
      const body = (await request.json()) as { 
        action: "approve" | "reject"; 
        finalMoveOutDate?: string;
        reason?: string;
      };

      const oldStatus = tenancy.status;

      if (body.action === "approve") {
        tenancy.status = "TERMINATING";
        tenancy.moveOutDate = body.finalMoveOutDate;
      } else {
        tenancy.status = "ACTIVE";
      }
      tenancy.updatedAt = mockTimestamp();

      // Add to status history
      const history = statusHistoryStore.get(id) || [];
      history.push({
        id: `history-${nextId()}`,
        fromStatus: oldStatus,
        toStatus: tenancy.status,
        changedAt: mockTimestamp(),
        changedById: "owner-001",
        reason: body.reason,
      });
      statusHistoryStore.set(id, history);

      tenancyStore.set(id, tenancy);

      return HttpResponse.json(mockSuccessResponse(tenancy));
    } catch {
      return HttpResponse.json(
        mockErrorResponse("INVALID_REQUEST", "Invalid request body"),
        { status: 400 }
      );
    }
  }),

  // ---------------------------------------------------------------------------
  // POST /tenancies/:id/sign-contract — Owner signs the tenancy contract
  // ---------------------------------------------------------------------------
  http.post(`${API_BASE}/tenancies/:id/sign-contract`, async ({ params }) => {
    await delay(300);

    const { id } = params as { id: string };
    const tenancy = tenancyStore.get(id);

    if (!tenancy) {
      return HttpResponse.json(
        mockErrorResponse("TENANCY_NOT_FOUND", "Tenancy not found"),
        { status: 404 }
      );
    }

    if (!["PENDING_CONTRACT", "PENDING_SIGNATURES"].includes(tenancy.status)) {
      return HttpResponse.json(
        mockErrorResponse("INVALID_STATUS", "Can only sign contract for tenancies pending contract or signatures"),
        { status: 400 }
      );
    }

    const oldStatus = tenancy.status;
    tenancy.status = tenancy.status === "PENDING_CONTRACT" ? "PENDING_SIGNATURES" : "APPROVED";
    tenancy.contractStatus = tenancy.status === "APPROVED" ? "SIGNED" : "PENDING_SIGNATURE";
    tenancy.updatedAt = mockTimestamp();

    // Add to status history
    const history = statusHistoryStore.get(id) || [];
    history.push({
      id: `history-${nextId()}`,
      fromStatus: oldStatus,
      toStatus: tenancy.status,
      changedAt: mockTimestamp(),
      changedById: "owner-001",
      reason: "Contract signed by owner",
    });
    statusHistoryStore.set(id, history);

    tenancyStore.set(id, tenancy);

    return HttpResponse.json(mockSuccessResponse(tenancy));
  }),

  // ---------------------------------------------------------------------------
  // POST /tenancies/:id/complete-handover — Owner completes property handover
  // ---------------------------------------------------------------------------
  http.post(`${API_BASE}/tenancies/:id/complete-handover`, async ({ params, request }) => {
    await delay(300);

    const { id } = params as { id: string };
    const tenancy = tenancyStore.get(id);

    if (!tenancy) {
      return HttpResponse.json(
        mockErrorResponse("TENANCY_NOT_FOUND", "Tenancy not found"),
        { status: 404 }
      );
    }

    if (tenancy.status !== "APPROVED") {
      return HttpResponse.json(
        mockErrorResponse("INVALID_STATUS", "Can only complete handover for approved tenancies"),
        { status: 400 }
      );
    }

    try {
      const body = (await request.json()) as { 
        handoverDate: string;
        notes?: string;
        checklistItems?: Array<{ id: string; completed: boolean }>;
      };

      const oldStatus = tenancy.status;
      tenancy.status = "ACTIVE";
      tenancy.moveInDate = body.handoverDate;
      tenancy.updatedAt = mockTimestamp();

      // Add to status history
      const history = statusHistoryStore.get(id) || [];
      history.push({
        id: `history-${nextId()}`,
        fromStatus: oldStatus,
        toStatus: tenancy.status,
        changedAt: mockTimestamp(),
        changedById: "owner-001",
        reason: body.notes || "Property handover completed",
      });
      statusHistoryStore.set(id, history);

      tenancyStore.set(id, tenancy);

      return HttpResponse.json(mockSuccessResponse(tenancy));
    } catch {
      return HttpResponse.json(
        mockErrorResponse("INVALID_REQUEST", "Invalid request body"),
        { status: 400 }
      );
    }
  }),

  // ---------------------------------------------------------------------------
  // POST /tenancies/:id/request-inspection — Owner requests property inspection
  // ---------------------------------------------------------------------------
  http.post(`${API_BASE}/tenancies/:id/request-inspection`, async ({ params, request }) => {
    await delay(300);

    const { id } = params as { id: string };
    const tenancy = tenancyStore.get(id);

    if (!tenancy) {
      return HttpResponse.json(
        mockErrorResponse("TENANCY_NOT_FOUND", "Tenancy not found"),
        { status: 404 }
      );
    }

    if (!["ACTIVE", "OVERDUE", "TERMINATION_REQUESTED", "TERMINATING"].includes(tenancy.status)) {
      return HttpResponse.json(
        mockErrorResponse("INVALID_STATUS", "Can only request inspection for active tenancies"),
        { status: 400 }
      );
    }

    try {
      const body = (await request.json()) as { 
        inspectionType: "ROUTINE" | "MOVE_OUT" | "MAINTENANCE";
        preferredDate?: string;
        notes?: string;
      };

      // Create mock inspection request
      const inspection = {
        id: `inspection-${nextId()}`,
        tenancyId: id,
        type: body.inspectionType,
        status: "PENDING",
        preferredDate: body.preferredDate,
        notes: body.notes,
        createdAt: mockTimestamp(),
        updatedAt: mockTimestamp(),
      };

      return HttpResponse.json(mockSuccessResponse({
        tenancy,
        inspection,
      }));
    } catch {
      return HttpResponse.json(
        mockErrorResponse("INVALID_REQUEST", "Invalid request body"),
        { status: 400 }
      );
    }
  }),
];
