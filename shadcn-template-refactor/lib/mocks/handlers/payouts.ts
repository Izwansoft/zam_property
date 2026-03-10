// =============================================================================
// MSW Handlers — Payout domain mock handlers
// =============================================================================

import { http, HttpResponse, delay } from "msw";
import {
  mockSuccessResponse,
  mockErrorResponse,
  mockTimestamp,
} from "../utils";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000/api/v1";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MockPayoutLineItem {
  id: string;
  payoutId: string;
  tenancyId: string;
  billingId?: string | null;
  type: string;
  description: string;
  amount: number;
  createdAt: string;
}

interface MockPayout {
  id: string;
  partnerId: string;
  ownerId: string;
  ownerName: string;
  payoutNumber: string;
  periodStart: string;
  periodEnd: string;
  status: string;
  grossRental: number;
  platformFee: number;
  maintenanceCost: number;
  otherDeductions: number;
  netPayout: number;
  bankName: string | null;
  bankAccount: string | null;
  bankAccountName: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  processedAt: string | null;
  bankReference: string | null;
  lineItems: MockPayoutLineItem[];
  lineItemCount: number;
  tenancyCount: number;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// In-memory store
// ---------------------------------------------------------------------------

const payoutStore: Map<string, MockPayout> = new Map();

// Pre-populate sample payouts
const samplePayouts: MockPayout[] = [
  // January 2026 — Completed
  {
    id: "payout-001",
    partnerId: "partner-001",
    ownerId: "vendor-001",
    ownerName: "Ahmad Ibrahim",
    payoutNumber: "PAY-OUT-202601-0001",
    periodStart: "2026-01-01T00:00:00Z",
    periodEnd: "2026-01-31T00:00:00Z",
    status: "COMPLETED",
    grossRental: 5000.0,
    platformFee: 500.0,
    maintenanceCost: 200.0,
    otherDeductions: 0,
    netPayout: 4300.0,
    bankName: "Maybank",
    bankAccount: "5123 4567 8901",
    bankAccountName: "Ahmad Ibrahim",
    approvedBy: "admin-001",
    approvedAt: "2026-02-10T08:00:00Z",
    processedAt: "2026-02-12T10:30:00Z",
    bankReference: "MBB-TRF-20260212-001",
    lineItems: [
      {
        id: "pli-001a",
        payoutId: "payout-001",
        tenancyId: "tenancy-001",
        billingId: "billing-001",
        type: "RENTAL",
        description: "Rental payment — Condo at Bangsar South (Jan 2026)",
        amount: 3000.0,
        createdAt: "2026-02-10T00:00:00Z",
      },
      {
        id: "pli-001b",
        payoutId: "payout-001",
        tenancyId: "tenancy-002",
        billingId: "billing-002",
        type: "RENTAL",
        description: "Rental payment — Studio at Mont Kiara (Jan 2026)",
        amount: 2000.0,
        createdAt: "2026-02-10T00:00:00Z",
      },
      {
        id: "pli-001c",
        payoutId: "payout-001",
        tenancyId: "tenancy-001",
        billingId: null,
        type: "PLATFORM_FEE",
        description: "Platform fee — 10% of gross rental",
        amount: -500.0,
        createdAt: "2026-02-10T00:00:00Z",
      },
      {
        id: "pli-001d",
        payoutId: "payout-001",
        tenancyId: "tenancy-001",
        billingId: null,
        type: "MAINTENANCE",
        description: "Plumbing repair — Condo at Bangsar South",
        amount: -200.0,
        createdAt: "2026-02-10T00:00:00Z",
      },
    ],
    lineItemCount: 4,
    tenancyCount: 2,
    createdAt: "2026-02-10T08:00:00Z",
    updatedAt: "2026-02-12T10:30:00Z",
  },

  // February 2026 — Completed
  {
    id: "payout-002",
    partnerId: "partner-001",
    ownerId: "vendor-001",
    ownerName: "Ahmad Ibrahim",
    payoutNumber: "PAY-OUT-202602-0001",
    periodStart: "2026-02-01T00:00:00Z",
    periodEnd: "2026-02-28T00:00:00Z",
    status: "COMPLETED",
    grossRental: 5000.0,
    platformFee: 500.0,
    maintenanceCost: 0,
    otherDeductions: 0,
    netPayout: 4500.0,
    bankName: "Maybank",
    bankAccount: "5123 4567 8901",
    bankAccountName: "Ahmad Ibrahim",
    approvedBy: "admin-001",
    approvedAt: "2026-03-10T08:00:00Z",
    processedAt: "2026-03-12T09:15:00Z",
    bankReference: "MBB-TRF-20260312-001",
    lineItems: [
      {
        id: "pli-002a",
        payoutId: "payout-002",
        tenancyId: "tenancy-001",
        billingId: "billing-003",
        type: "RENTAL",
        description: "Rental payment — Condo at Bangsar South (Feb 2026)",
        amount: 3000.0,
        createdAt: "2026-03-10T00:00:00Z",
      },
      {
        id: "pli-002b",
        payoutId: "payout-002",
        tenancyId: "tenancy-002",
        billingId: "billing-004",
        type: "RENTAL",
        description: "Rental payment — Studio at Mont Kiara (Feb 2026)",
        amount: 2000.0,
        createdAt: "2026-03-10T00:00:00Z",
      },
      {
        id: "pli-002c",
        payoutId: "payout-002",
        tenancyId: "tenancy-001",
        billingId: null,
        type: "PLATFORM_FEE",
        description: "Platform fee — 10% of gross rental",
        amount: -500.0,
        createdAt: "2026-03-10T00:00:00Z",
      },
    ],
    lineItemCount: 3,
    tenancyCount: 2,
    createdAt: "2026-03-10T08:00:00Z",
    updatedAt: "2026-03-12T09:15:00Z",
  },

  // March 2026 — Approved (awaiting processing)
  {
    id: "payout-003",
    partnerId: "partner-001",
    ownerId: "vendor-001",
    ownerName: "Ahmad Ibrahim",
    payoutNumber: "PAY-OUT-202603-0001",
    periodStart: "2026-03-01T00:00:00Z",
    periodEnd: "2026-03-31T00:00:00Z",
    status: "APPROVED",
    grossRental: 5000.0,
    platformFee: 500.0,
    maintenanceCost: 150.0,
    otherDeductions: 0,
    netPayout: 4350.0,
    bankName: "Maybank",
    bankAccount: "5123 4567 8901",
    bankAccountName: "Ahmad Ibrahim",
    approvedBy: "admin-001",
    approvedAt: "2026-04-10T08:00:00Z",
    processedAt: null,
    bankReference: null,
    lineItems: [
      {
        id: "pli-003a",
        payoutId: "payout-003",
        tenancyId: "tenancy-001",
        billingId: "billing-005",
        type: "RENTAL",
        description: "Rental payment — Condo at Bangsar South (Mar 2026)",
        amount: 3000.0,
        createdAt: "2026-04-10T00:00:00Z",
      },
      {
        id: "pli-003b",
        payoutId: "payout-003",
        tenancyId: "tenancy-002",
        billingId: "billing-006",
        type: "RENTAL",
        description: "Rental payment — Studio at Mont Kiara (Mar 2026)",
        amount: 2000.0,
        createdAt: "2026-04-10T00:00:00Z",
      },
      {
        id: "pli-003c",
        payoutId: "payout-003",
        tenancyId: "tenancy-001",
        billingId: null,
        type: "PLATFORM_FEE",
        description: "Platform fee — 10% of gross rental",
        amount: -500.0,
        createdAt: "2026-04-10T00:00:00Z",
      },
      {
        id: "pli-003d",
        payoutId: "payout-003",
        tenancyId: "tenancy-001",
        billingId: null,
        type: "MAINTENANCE",
        description: "Aircon servicing — Condo at Bangsar South",
        amount: -150.0,
        createdAt: "2026-04-10T00:00:00Z",
      },
    ],
    lineItemCount: 4,
    tenancyCount: 2,
    createdAt: "2026-04-10T08:00:00Z",
    updatedAt: "2026-04-10T08:00:00Z",
  },

  // December 2025 — Completed (older)
  {
    id: "payout-004",
    partnerId: "partner-001",
    ownerId: "vendor-001",
    ownerName: "Ahmad Ibrahim",
    payoutNumber: "PAY-OUT-202512-0001",
    periodStart: "2025-12-01T00:00:00Z",
    periodEnd: "2025-12-31T00:00:00Z",
    status: "COMPLETED",
    grossRental: 3000.0,
    platformFee: 300.0,
    maintenanceCost: 0,
    otherDeductions: 0,
    netPayout: 2700.0,
    bankName: "Maybank",
    bankAccount: "5123 4567 8901",
    bankAccountName: "Ahmad Ibrahim",
    approvedBy: "admin-001",
    approvedAt: "2026-01-10T08:00:00Z",
    processedAt: "2026-01-12T14:00:00Z",
    bankReference: "MBB-TRF-20260112-001",
    lineItems: [
      {
        id: "pli-004a",
        payoutId: "payout-004",
        tenancyId: "tenancy-001",
        billingId: "billing-007",
        type: "RENTAL",
        description: "Rental payment — Condo at Bangsar South (Dec 2025)",
        amount: 3000.0,
        createdAt: "2026-01-10T00:00:00Z",
      },
      {
        id: "pli-004b",
        payoutId: "payout-004",
        tenancyId: "tenancy-001",
        billingId: null,
        type: "PLATFORM_FEE",
        description: "Platform fee — 10% of gross rental",
        amount: -300.0,
        createdAt: "2026-01-10T00:00:00Z",
      },
    ],
    lineItemCount: 2,
    tenancyCount: 1,
    createdAt: "2026-01-10T08:00:00Z",
    updatedAt: "2026-01-12T14:00:00Z",
  },

  // April 2026 — Calculated (pending approval)
  {
    id: "payout-005",
    partnerId: "partner-001",
    ownerId: "vendor-001",
    ownerName: "Ahmad Ibrahim",
    payoutNumber: "PAY-OUT-202604-0001",
    periodStart: "2026-04-01T00:00:00Z",
    periodEnd: "2026-04-30T00:00:00Z",
    status: "CALCULATED",
    grossRental: 5000.0,
    platformFee: 500.0,
    maintenanceCost: 0,
    otherDeductions: 0,
    netPayout: 4500.0,
    bankName: null,
    bankAccount: null,
    bankAccountName: null,
    approvedBy: null,
    approvedAt: null,
    processedAt: null,
    bankReference: null,
    lineItems: [
      {
        id: "pli-005a",
        payoutId: "payout-005",
        tenancyId: "tenancy-001",
        billingId: "billing-008",
        type: "RENTAL",
        description: "Rental payment — Condo at Bangsar South (Apr 2026)",
        amount: 3000.0,
        createdAt: "2026-05-10T00:00:00Z",
      },
      {
        id: "pli-005b",
        payoutId: "payout-005",
        tenancyId: "tenancy-002",
        billingId: "billing-009",
        type: "RENTAL",
        description: "Rental payment — Studio at Mont Kiara (Apr 2026)",
        amount: 2000.0,
        createdAt: "2026-05-10T00:00:00Z",
      },
      {
        id: "pli-005c",
        payoutId: "payout-005",
        tenancyId: "tenancy-001",
        billingId: null,
        type: "PLATFORM_FEE",
        description: "Platform fee — 10% of gross rental",
        amount: -500.0,
        createdAt: "2026-05-10T00:00:00Z",
      },
    ],
    lineItemCount: 3,
    tenancyCount: 2,
    createdAt: "2026-05-10T08:00:00Z",
    updatedAt: "2026-05-10T08:00:00Z",
  },
];

// Initialize store
for (const payout of samplePayouts) {
  payoutStore.set(payout.id, payout);
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

export const payoutHandlers = [
  // ---- GET /payouts — List payouts ----
  http.get(`${API_BASE}/payouts`, async ({ request }) => {
    await delay(300);

    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const periodStart = url.searchParams.get("periodStart");
    const periodEnd = url.searchParams.get("periodEnd");
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "20", 10);
    const sortBy = url.searchParams.get("sortBy") || "createdAt";
    const sortOrder = url.searchParams.get("sortOrder") || "desc";

    let data = Array.from(payoutStore.values());

    // Filter by status
    if (status) {
      const statuses = status.split(",");
      data = data.filter((p) => statuses.includes(p.status));
    }

    // Filter by period range
    if (periodStart) {
      const start = new Date(periodStart);
      data = data.filter((p) => new Date(p.periodStart) >= start);
    }
    if (periodEnd) {
      const end = new Date(periodEnd);
      data = data.filter((p) => new Date(p.periodEnd) <= end);
    }

    // Sort
    data.sort((a, b) => {
      const aVal = (a as unknown as Record<string, unknown>)[sortBy] as string;
      const bVal = (b as unknown as Record<string, unknown>)[sortBy] as string;
      const cmp = String(aVal).localeCompare(String(bVal));
      return sortOrder === "desc" ? -cmp : cmp;
    });

    const total = data.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const paginatedData = data.slice(start, start + limit);

    // Strip line items from list response (detail only)
    const listData = paginatedData.map(({ lineItems, ...rest }) => rest);

    return HttpResponse.json(
      mockSuccessResponse({
        items: listData,
        pagination: {
          page,
          pageSize: limit,
          total,
          totalPages,
        },
      })
    );
  }),

  // ---- GET /payouts/:id — Get payout detail ----
  http.get(`${API_BASE}/payouts/:id`, async ({ params }) => {
    await delay(200);

    const { id } = params;
    const payout = payoutStore.get(id as string);

    if (!payout) {
      return HttpResponse.json(
        mockErrorResponse("NOT_FOUND", "Payout not found"),
        { status: 404 }
      );
    }

    return HttpResponse.json(mockSuccessResponse(payout));
  }),

  // ---- GET /payouts/:id/statement — Download statement (mock) ----
  http.get(`${API_BASE}/payouts/:id/statement`, async ({ params }) => {
    await delay(500);

    const { id } = params;
    const payout = payoutStore.get(id as string);

    if (!payout) {
      return HttpResponse.json(
        mockErrorResponse("NOT_FOUND", "Payout not found"),
        { status: 404 }
      );
    }

    // Return mock PDF URL
    return HttpResponse.json(
      mockSuccessResponse({
        url: `#statement-${payout.payoutNumber}.pdf`,
        filename: `${payout.payoutNumber}-statement.pdf`,
      })
    );
  }),

  // ---- POST /payouts/process-batch — Batch approve/process payouts ----
  http.post(`${API_BASE}/payouts/process-batch`, async ({ request }) => {
    await delay(500);
    const body = (await request.json()) as { ids: string[]; action: string };
    return HttpResponse.json(
      mockSuccessResponse({
        processed: body.ids?.length ?? 0,
        action: body.action ?? "approve",
        message: `Successfully processed ${body.ids?.length ?? 0} payouts`,
      })
    );
  }),
];
