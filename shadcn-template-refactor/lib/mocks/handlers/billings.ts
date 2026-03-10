// =============================================================================
// MSW Handlers — Billing domain mock handlers
// =============================================================================
// Mocks the rent-billings endpoints for billing/payment management.
// Session 6.1 implementation.
// =============================================================================

import { http, HttpResponse, delay } from "msw";
import {
  mockSuccessResponse,
  mockErrorResponse,
  mockTimestamp,
  nextId,
} from "../utils";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000/api/v1";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MockBillingLineItem {
  id: string;
  billingId: string;
  description: string;
  type: "RENT" | "UTILITY" | "LATE_FEE" | "CLAIM_DEDUCTION" | "OTHER";
  amount: number;
  claimId?: string | null;
  createdAt: string;
}

interface MockBilling {
  id: string;
  tenancyId: string;
  billNumber: string;
  billingPeriod: string;
  status:
    | "DRAFT"
    | "GENERATED"
    | "SENT"
    | "PARTIALLY_PAID"
    | "PAID"
    | "OVERDUE"
    | "WRITTEN_OFF";
  rentAmount: number;
  lateFee: number;
  adjustments: number;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  issueDate: string;
  dueDate: string;
  paidDate: string | null;
  lineItems: MockBillingLineItem[];
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// In-memory store
// ---------------------------------------------------------------------------

const billingStore: Map<string, MockBilling> = new Map();

// Pre-populate sample billings
const sampleBillings: MockBilling[] = [
  // June 2025 — Paid bill
  {
    id: "billing-001",
    tenancyId: "tenancy-001",
    billNumber: "BILL-202506-0001",
    billingPeriod: "2025-06-01",
    status: "PAID",
    rentAmount: 1500,
    lateFee: 0,
    adjustments: 0,
    totalAmount: 1600,
    paidAmount: 1600,
    balanceDue: 0,
    issueDate: "2025-05-25",
    dueDate: "2025-06-05",
    paidDate: "2025-06-03",
    lineItems: [
      {
        id: "li-001a",
        billingId: "billing-001",
        description: "Monthly Rent",
        type: "RENT",
        amount: 1500,
        claimId: null,
        createdAt: "2025-05-25T00:00:00Z",
      },
      {
        id: "li-001b",
        billingId: "billing-001",
        description: "Water & Electricity",
        type: "UTILITY",
        amount: 100,
        claimId: null,
        createdAt: "2025-05-25T00:00:00Z",
      },
    ],
    createdAt: "2025-05-25T00:00:00Z",
    updatedAt: "2025-06-03T00:00:00Z",
  },

  // July 2025 — Paid bill
  {
    id: "billing-002",
    tenancyId: "tenancy-001",
    billNumber: "BILL-202507-0001",
    billingPeriod: "2025-07-01",
    status: "PAID",
    rentAmount: 1500,
    lateFee: 0,
    adjustments: 0,
    totalAmount: 1620,
    paidAmount: 1620,
    balanceDue: 0,
    issueDate: "2025-06-25",
    dueDate: "2025-07-05",
    paidDate: "2025-07-01",
    lineItems: [
      {
        id: "li-002a",
        billingId: "billing-002",
        description: "Monthly Rent",
        type: "RENT",
        amount: 1500,
        claimId: null,
        createdAt: "2025-06-25T00:00:00Z",
      },
      {
        id: "li-002b",
        billingId: "billing-002",
        description: "Water & Electricity",
        type: "UTILITY",
        amount: 120,
        claimId: null,
        createdAt: "2025-06-25T00:00:00Z",
      },
    ],
    createdAt: "2025-06-25T00:00:00Z",
    updatedAt: "2025-07-01T00:00:00Z",
  },

  // August 2025 — Overdue with late fee
  {
    id: "billing-003",
    tenancyId: "tenancy-001",
    billNumber: "BILL-202508-0001",
    billingPeriod: "2025-08-01",
    status: "OVERDUE",
    rentAmount: 1500,
    lateFee: 75,
    adjustments: 0,
    totalAmount: 1685,
    paidAmount: 0,
    balanceDue: 1685,
    issueDate: "2025-07-25",
    dueDate: "2025-08-05",
    paidDate: null,
    lineItems: [
      {
        id: "li-003a",
        billingId: "billing-003",
        description: "Monthly Rent",
        type: "RENT",
        amount: 1500,
        claimId: null,
        createdAt: "2025-07-25T00:00:00Z",
      },
      {
        id: "li-003b",
        billingId: "billing-003",
        description: "Water & Electricity",
        type: "UTILITY",
        amount: 110,
        claimId: null,
        createdAt: "2025-07-25T00:00:00Z",
      },
      {
        id: "li-003c",
        billingId: "billing-003",
        description: "Late Fee (5%)",
        type: "LATE_FEE",
        amount: 75,
        claimId: null,
        createdAt: "2025-08-06T00:00:00Z",
      },
    ],
    createdAt: "2025-07-25T00:00:00Z",
    updatedAt: "2025-08-06T00:00:00Z",
  },

  // September 2025 — Partially paid
  {
    id: "billing-004",
    tenancyId: "tenancy-001",
    billNumber: "BILL-202509-0001",
    billingPeriod: "2025-09-01",
    status: "PARTIALLY_PAID",
    rentAmount: 1500,
    lateFee: 0,
    adjustments: 0,
    totalAmount: 1590,
    paidAmount: 800,
    balanceDue: 790,
    issueDate: "2025-08-25",
    dueDate: "2025-09-05",
    paidDate: null,
    lineItems: [
      {
        id: "li-004a",
        billingId: "billing-004",
        description: "Monthly Rent",
        type: "RENT",
        amount: 1500,
        claimId: null,
        createdAt: "2025-08-25T00:00:00Z",
      },
      {
        id: "li-004b",
        billingId: "billing-004",
        description: "Water & Electricity",
        type: "UTILITY",
        amount: 90,
        claimId: null,
        createdAt: "2025-08-25T00:00:00Z",
      },
    ],
    createdAt: "2025-08-25T00:00:00Z",
    updatedAt: "2025-09-02T00:00:00Z",
  },

  // October 2025 — Sent (pending payment)
  {
    id: "billing-005",
    tenancyId: "tenancy-001",
    billNumber: "BILL-202510-0001",
    billingPeriod: "2025-10-01",
    status: "SENT",
    rentAmount: 1500,
    lateFee: 0,
    adjustments: 0,
    totalAmount: 1615,
    paidAmount: 0,
    balanceDue: 1615,
    issueDate: "2025-09-25",
    dueDate: "2025-10-05",
    paidDate: null,
    lineItems: [
      {
        id: "li-005a",
        billingId: "billing-005",
        description: "Monthly Rent",
        type: "RENT",
        amount: 1500,
        claimId: null,
        createdAt: "2025-09-25T00:00:00Z",
      },
      {
        id: "li-005b",
        billingId: "billing-005",
        description: "Water & Electricity",
        type: "UTILITY",
        amount: 115,
        claimId: null,
        createdAt: "2025-09-25T00:00:00Z",
      },
    ],
    createdAt: "2025-09-25T00:00:00Z",
    updatedAt: "2025-09-25T00:00:00Z",
  },

  // November 2025 — Generated (not yet sent)
  {
    id: "billing-006",
    tenancyId: "tenancy-001",
    billNumber: "BILL-202511-0001",
    billingPeriod: "2025-11-01",
    status: "GENERATED",
    rentAmount: 1500,
    lateFee: 0,
    adjustments: 0,
    totalAmount: 1600,
    paidAmount: 0,
    balanceDue: 1600,
    issueDate: "2025-10-25",
    dueDate: "2025-11-05",
    paidDate: null,
    lineItems: [
      {
        id: "li-006a",
        billingId: "billing-006",
        description: "Monthly Rent",
        type: "RENT",
        amount: 1500,
        claimId: null,
        createdAt: "2025-10-25T00:00:00Z",
      },
      {
        id: "li-006b",
        billingId: "billing-006",
        description: "Water & Electricity",
        type: "UTILITY",
        amount: 100,
        claimId: null,
        createdAt: "2025-10-25T00:00:00Z",
      },
    ],
    createdAt: "2025-10-25T00:00:00Z",
    updatedAt: "2025-10-25T00:00:00Z",
  },

  // Written off example
  {
    id: "billing-007",
    tenancyId: "tenancy-002",
    billNumber: "BILL-202505-0002",
    billingPeriod: "2025-05-01",
    status: "WRITTEN_OFF",
    rentAmount: 1200,
    lateFee: 60,
    adjustments: -1260,
    totalAmount: 0,
    paidAmount: 0,
    balanceDue: 0,
    issueDate: "2025-04-25",
    dueDate: "2025-05-05",
    paidDate: null,
    lineItems: [
      {
        id: "li-007a",
        billingId: "billing-007",
        description: "Monthly Rent",
        type: "RENT",
        amount: 1200,
        claimId: null,
        createdAt: "2025-04-25T00:00:00Z",
      },
      {
        id: "li-007b",
        billingId: "billing-007",
        description: "Late Fee (5%)",
        type: "LATE_FEE",
        amount: 60,
        claimId: null,
        createdAt: "2025-05-06T00:00:00Z",
      },
    ],
    createdAt: "2025-04-25T00:00:00Z",
    updatedAt: "2025-06-15T00:00:00Z",
  },
];

// Populate store
sampleBillings.forEach((b) => billingStore.set(b.id, b));

// ---------------------------------------------------------------------------
// Mock Payments
// ---------------------------------------------------------------------------

interface MockPayment {
  id: string;
  billingId: string;
  paymentNumber: string;
  amount: number;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "REFUNDED" | "DISPUTED";
  method: string;
  currency: string;
  reference: string | null;
  receiptNumber: string | null;
  receiptUrl: string | null;
  paymentDate: string | null;
  processedAt: string | null;
  payerName: string | null;
  payerEmail: string | null;
  createdAt: string;
  updatedAt: string;
}

const paymentStore: Map<string, MockPayment> = new Map();

const samplePayments: MockPayment[] = [
  // Payments for billing-001 (PAID)
  {
    id: "payment-001",
    billingId: "billing-001",
    paymentNumber: "PAY-202506-0001",
    amount: 1600,
    status: "COMPLETED",
    method: "FPX",
    currency: "MYR",
    reference: "FPX-REF-001234",
    receiptNumber: "RCP-202506-0001",
    receiptUrl: "#",
    paymentDate: "2025-06-03T10:30:00Z",
    processedAt: "2025-06-03T10:30:15Z",
    payerName: "Sarah Tan",
    payerEmail: "sarah@example.com",
    createdAt: "2025-06-03T10:29:00Z",
    updatedAt: "2025-06-03T10:30:15Z",
  },

  // Payments for billing-002 (PAID)
  {
    id: "payment-002",
    billingId: "billing-002",
    paymentNumber: "PAY-202507-0001",
    amount: 1620,
    status: "COMPLETED",
    method: "CARD",
    currency: "MYR",
    reference: "CARD-REF-005678",
    receiptNumber: "RCP-202507-0001",
    receiptUrl: "#",
    paymentDate: "2025-07-01T09:15:00Z",
    processedAt: "2025-07-01T09:15:10Z",
    payerName: "Sarah Tan",
    payerEmail: "sarah@example.com",
    createdAt: "2025-07-01T09:14:00Z",
    updatedAt: "2025-07-01T09:15:10Z",
  },

  // Payments for billing-004 (PARTIALLY_PAID — one completed, one failed)
  {
    id: "payment-003",
    billingId: "billing-004",
    paymentNumber: "PAY-202509-0001",
    amount: 800,
    status: "COMPLETED",
    method: "BANK_TRANSFER",
    currency: "MYR",
    reference: "BT-REF-009012",
    receiptNumber: "RCP-202509-0001",
    receiptUrl: "#",
    paymentDate: "2025-09-02T14:00:00Z",
    processedAt: "2025-09-02T14:00:20Z",
    payerName: "Sarah Tan",
    payerEmail: "sarah@example.com",
    createdAt: "2025-09-02T13:59:00Z",
    updatedAt: "2025-09-02T14:00:20Z",
  },
  {
    id: "payment-004",
    billingId: "billing-004",
    paymentNumber: "PAY-202509-0002",
    amount: 790,
    status: "FAILED",
    method: "FPX",
    currency: "MYR",
    reference: null,
    receiptNumber: null,
    receiptUrl: null,
    paymentDate: null,
    processedAt: null,
    payerName: "Sarah Tan",
    payerEmail: "sarah@example.com",
    createdAt: "2025-09-03T11:20:00Z",
    updatedAt: "2025-09-03T11:20:30Z",
  },
];

samplePayments.forEach((p) => paymentStore.set(p.id, p));

// ---------------------------------------------------------------------------
// Mock Tenancy References (for enriching list responses)
// ---------------------------------------------------------------------------

const tenancyReferences: Record<
  string,
  {
    id: string;
    status: string;
    monthlyRent: number;
    billingDay: number;
    paymentDueDay: number;
    lateFeePercent: number | null;
    listing: { id: string; title: string };
    owner: { id: string; name: string; email: string | null };
    tenant: { id: string; user: { fullName: string; email: string } };
  }
> = {
  "tenancy-001": {
    id: "tenancy-001",
    status: "ACTIVE",
    monthlyRent: 1500,
    billingDay: 25,
    paymentDueDay: 5,
    lateFeePercent: 5,
    listing: { id: "listing-001", title: "Condo at Bangsar South" },
    owner: { id: "owner-001", name: "Ahmad Ibrahim", email: "ahmad@example.com" },
    tenant: {
      id: "tenant-001",
      user: { fullName: "Sarah Tan", email: "sarah@example.com" },
    },
  },
  "tenancy-002": {
    id: "tenancy-002",
    status: "TERMINATED",
    monthlyRent: 1200,
    billingDay: 25,
    paymentDueDay: 5,
    lateFeePercent: 5,
    listing: { id: "listing-002", title: "Studio at Mont Kiara" },
    owner: { id: "owner-001", name: "Ahmad Ibrahim", email: "ahmad@example.com" },
    tenant: {
      id: "tenant-002",
      user: { fullName: "James Wong", email: "james@example.com" },
    },
  },
};

/** Enrich a billing with tenancy reference data */
function enrichBillingWithTenancy(billing: MockBilling) {
  const tenancy = tenancyReferences[billing.tenancyId];
  return {
    ...billing,
    tenancy: tenancy || null,
  };
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function matchesFilter(
  billing: MockBilling,
  params: URLSearchParams
): boolean {
  const tenancyId = params.get("tenancyId");
  if (tenancyId && billing.tenancyId !== tenancyId) return false;

  const statusParam = params.get("status");
  if (statusParam) {
    const statuses = statusParam.split(",");
    if (!statuses.includes(billing.status)) return false;
  }

  const billingPeriod = params.get("billingPeriod");
  if (billingPeriod && !billing.billingPeriod.startsWith(billingPeriod))
    return false;

  const fromDate = params.get("fromDate");
  if (fromDate && billing.billingPeriod < fromDate) return false;

  const toDate = params.get("toDate");
  if (toDate && billing.billingPeriod > toDate) return false;

  const overdueOnly = params.get("overdueOnly");
  if (overdueOnly === "true" && billing.status !== "OVERDUE") return false;

  return true;
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

export const billingHandlers = [
  // =========================================================================
  // GET /rent-billings — List billings (paginated & filtered)
  // =========================================================================
  http.get(`${API_BASE}/rent-billings`, async ({ request }) => {
    await delay(300);

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "10", 10);
    const sortBy = url.searchParams.get("sortBy") || "billingPeriod";
    const sortOrder = url.searchParams.get("sortOrder") || "desc";

    // Filter
    const allBillings = Array.from(billingStore.values());
    const filtered = allBillings.filter((b) =>
      matchesFilter(b, url.searchParams)
    );

    // Sort
    filtered.sort((a, b) => {
      const aVal = String((a as unknown as Record<string, unknown>)[sortBy] ?? "");
      const bVal = String((b as unknown as Record<string, unknown>)[sortBy] ?? "");
      const cmp = aVal.localeCompare(bVal);
      return sortOrder === "desc" ? -cmp : cmp;
    });

    // Paginate
    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const startIdx = (page - 1) * limit;
    const data = filtered.slice(startIdx, startIdx + limit);

    // Enrich with tenancy references for property grouping
    const enriched = data.map(enrichBillingWithTenancy);

    return HttpResponse.json({
      data: enriched,
      total,
      page,
      limit,
      totalPages,
    });
  }),

  // =========================================================================
  // GET /rent-billings/:id — Get single billing detail
  // =========================================================================
  http.get(`${API_BASE}/rent-billings/:id`, async ({ params }) => {
    await delay(200);

    const { id } = params;
    const billing = billingStore.get(id as string);

    if (!billing) {
      return HttpResponse.json(
        mockErrorResponse("NOT_FOUND", "Billing not found"),
        { status: 404 }
      );
    }

    // Add tenancy reference for detail view
    const enriched = {
      ...billing,
      tenancy: tenancyReferences[billing.tenancyId] || {
        id: billing.tenancyId,
        status: "ACTIVE",
        monthlyRent: billing.rentAmount,
        billingDay: 25,
        paymentDueDay: 5,
        lateFeePercent: 5,
        listing: {
          id: "listing-001",
          title: "Condo at Bangsar South",
        },
        owner: {
          id: "owner-001",
          name: "Ahmad Ibrahim",
          email: "ahmad@example.com",
        },
        tenant: {
          id: "tenant-001",
          user: {
            fullName: "Sarah Tan",
            email: "sarah@example.com",
          },
        },
      },
      reminders: [],
    };

    return HttpResponse.json(mockSuccessResponse(enriched));
  }),

  // =========================================================================
  // GET /rent-billings/summary — Billing summary for a tenancy
  // =========================================================================
  http.get(`${API_BASE}/rent-billings/summary`, async ({ request }) => {
    await delay(200);

    const url = new URL(request.url);
    const tenancyId = url.searchParams.get("tenancyId") || "tenancy-001";

    const billings = Array.from(billingStore.values()).filter(
      (b) => b.tenancyId === tenancyId
    );

    const totalBilled = billings.reduce((sum, b) => sum + b.totalAmount, 0);
    const totalPaid = billings.reduce((sum, b) => sum + b.paidAmount, 0);
    const totalOutstanding = billings.reduce(
      (sum, b) => sum + b.balanceDue,
      0
    );
    const overdueCount = billings.filter(
      (b) => b.status === "OVERDUE"
    ).length;

    return HttpResponse.json(
      mockSuccessResponse({
        tenancyId,
        totalBilled,
        totalPaid,
        totalOutstanding,
        totalBills: billings.length,
        overdueCount,
        lastPaymentDate: billings
          .filter((b) => b.paidDate)
          .sort((a, b) => (b.paidDate ?? "").localeCompare(a.paidDate ?? ""))
          .at(0)?.paidDate ?? null,
      })
    );
  }),

  // =========================================================================
  // GET /rent-payments — List payments (paginated, filterable by billingId)
  // =========================================================================
  http.get(`${API_BASE}/rent-payments`, async ({ request }) => {
    await delay(250);

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "50", 10);
    const billingId = url.searchParams.get("billingId");
    const status = url.searchParams.get("status");
    const method = url.searchParams.get("method");

    let allPayments = Array.from(paymentStore.values());

    // Filter by billingId
    if (billingId) {
      allPayments = allPayments.filter((p) => p.billingId === billingId);
    }

    // Filter by status
    if (status) {
      const statuses = status.split(",");
      allPayments = allPayments.filter((p) => statuses.includes(p.status));
    }

    // Filter by method
    if (method) {
      allPayments = allPayments.filter((p) => p.method === method);
    }

    // Sort by createdAt desc
    allPayments.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Paginate
    const total = allPayments.length;
    const totalPages = Math.ceil(total / limit);
    const startIdx = (page - 1) * limit;
    const data = allPayments.slice(startIdx, startIdx + limit);

    return HttpResponse.json({
      data,
      total,
      page,
      limit,
      totalPages,
    });
  }),

  // =========================================================================
  // GET /rent-payments/:id — Get single payment detail
  // =========================================================================
  http.get(`${API_BASE}/rent-payments/:id`, async ({ params }) => {
    await delay(200);

    const { id } = params;
    const payment = paymentStore.get(id as string);

    if (!payment) {
      return HttpResponse.json(
        mockErrorResponse("NOT_FOUND", "Payment not found"),
        { status: 404 }
      );
    }

    return HttpResponse.json(mockSuccessResponse(payment));
  }),

  // =========================================================================
  // POST /rent-payments — Create a payment intent
  // =========================================================================
  http.post(`${API_BASE}/rent-payments`, async ({ request }) => {
    await delay(800);

    const body = (await request.json()) as {
      billingId: string;
      amount: number;
      method: string;
      currency?: string;
      bankCode?: string;
      referenceNumber?: string;
    };

    const { billingId, amount, method, currency, bankCode, referenceNumber } =
      body;

    // Validate billing exists
    const billing = billingStore.get(billingId);
    if (!billing) {
      return HttpResponse.json(
        mockErrorResponse("NOT_FOUND", "Billing not found"),
        { status: 404 }
      );
    }

    // Validate amount
    if (amount <= 0 || amount > billing.balanceDue) {
      return HttpResponse.json(
        mockErrorResponse(
          "VALIDATION_ERROR",
          `Amount must be between 0.01 and ${billing.balanceDue}`
        ),
        { status: 400 }
      );
    }

    // Create a new payment record
    const paymentId = `payment-${nextId()}`;
    const now = mockTimestamp();
    const isManual = method === "BANK_TRANSFER";

    const newPayment: MockPayment = {
      id: paymentId,
      billingId,
      paymentNumber: `PAY-${new Date().toISOString().slice(0, 7).replace("-", "")}-${String(paymentStore.size + 1).padStart(4, "0")}`,
      amount,
      // Manual transfers start PENDING, card/fpx simulate quickly completing
      status: isManual ? "PENDING" : "PROCESSING",
      method: method as MockPayment["method"],
      currency: currency || "MYR",
      reference: isManual
        ? referenceNumber || null
        : method === "FPX"
          ? `FPX-${bankCode}-${Date.now()}`
          : `CARD-${Date.now()}`,
      receiptNumber: null,
      receiptUrl: null,
      paymentDate: null,
      processedAt: null,
      payerName: "Sarah Tan",
      payerEmail: "sarah@example.com",
      createdAt: now,
      updatedAt: now,
    };

    paymentStore.set(paymentId, newPayment);

    // Simulate async payment completion for card/FPX (after 3 seconds)
    if (!isManual) {
      setTimeout(() => {
        const p = paymentStore.get(paymentId);
        if (p && p.status === "PROCESSING") {
          const completedAt = mockTimestamp();
          p.status = "COMPLETED";
          p.paymentDate = completedAt;
          p.processedAt = completedAt;
          p.receiptNumber = `RCP-${new Date().toISOString().slice(0, 7).replace("-", "")}-${String(paymentStore.size).padStart(4, "0")}`;
          p.receiptUrl = "#";

          // Update billing amounts
          if (billing) {
            billing.paidAmount += amount;
            billing.balanceDue -= amount;
            if (billing.balanceDue <= 0) {
              billing.balanceDue = 0;
              billing.status = "PAID";
              billing.paidDate = completedAt;
            } else {
              billing.status = "PARTIALLY_PAID";
            }
          }
        }
      }, 3000);
    }

    // Return the payment intent
    const response = {
      ...newPayment,
      clientSecret: isManual
        ? undefined
        : `pi_${paymentId}_secret_${Math.random().toString(36).substring(7)}`,
      redirectUrl:
        method === "FPX"
          ? `#fpx-redirect-${bankCode}`
          : undefined,
      bankDetails: isManual
        ? {
            bankName: "Maybank",
            accountName: "Zam Property Sdn Bhd",
            accountNumber: "5123 4567 8901",
            reference: newPayment.paymentNumber,
          }
        : undefined,
    };

    return HttpResponse.json(mockSuccessResponse(response), { status: 201 });
  }),
];
