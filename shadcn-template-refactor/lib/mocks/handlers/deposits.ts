// =============================================================================
// MSW Handlers — Deposit domain mock handlers
// =============================================================================
// Mocks the deposit endpoints for Property Management.
// Session 5.8 implementation.
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

interface MockDeductionClaim {
  claimId?: string;
  description: string;
  amount: number;
  addedAt: string;
}

interface MockDeposit {
  id: string;
  tenancyId: string;
  partnerId: string;
  ownerId: string;
  tenantId?: string;
  type: "SECURITY" | "UTILITY" | "KEY";
  amount: number;
  currency: string;
  status: "PENDING" | "COLLECTED" | "HELD" | "PARTIALLY_REFUNDED" | "FULLY_REFUNDED" | "FORFEITED";
  collectedAt?: string;
  collectedBy?: string;
  refundedAt?: string;
  refundedAmount?: number;
  refundRef?: string;
  refundNotes?: string;
  deductionClaims: MockDeductionClaim[];
  createdAt: string;
  updatedAt: string;
}

interface MockDepositSummary {
  tenancyId: string;
  totalDeposits: number;
  totalCollected: number;
  totalRefunded: number;
  totalDeductions: number;
  totalPending: number;
  deposits: Array<{
    id: string;
    type: string;
    amount: number;
    status: string;
    refundableAmount: number | null;
  }>;
}

// ---------------------------------------------------------------------------
// In-memory store
// ---------------------------------------------------------------------------

const depositStore: Map<string, MockDeposit> = new Map();

// Pre-populate sample deposits
const sampleDeposits: MockDeposit[] = [
  // Tenancy 001 deposits (ACTIVE tenancy - all collected)
  {
    id: "deposit-001",
    tenancyId: "tenancy-001",
    partnerId: "partner-001",
    ownerId: "owner-001",
    tenantId: "tenant-001",
    type: "SECURITY",
    amount: 5000,
    currency: "MYR",
    status: "COLLECTED",
    collectedAt: "2024-01-01T10:00:00.000Z",
    collectedBy: "owner-001",
    deductionClaims: [],
    createdAt: "2023-12-20T10:00:00.000Z",
    updatedAt: mockTimestamp(),
  },
  {
    id: "deposit-002",
    tenancyId: "tenancy-001",
    partnerId: "partner-001",
    ownerId: "owner-001",
    tenantId: "tenant-001",
    type: "UTILITY",
    amount: 500,
    currency: "MYR",
    status: "COLLECTED",
    collectedAt: "2024-01-01T10:00:00.000Z",
    collectedBy: "owner-001",
    deductionClaims: [],
    createdAt: "2023-12-20T10:00:00.000Z",
    updatedAt: mockTimestamp(),
  },
  {
    id: "deposit-003",
    tenancyId: "tenancy-001",
    partnerId: "partner-001",
    ownerId: "owner-001",
    tenantId: "tenant-001",
    type: "KEY",
    amount: 100,
    currency: "MYR",
    status: "COLLECTED",
    collectedAt: "2024-01-01T10:00:00.000Z",
    collectedBy: "owner-001",
    deductionClaims: [],
    createdAt: "2023-12-20T10:00:00.000Z",
    updatedAt: mockTimestamp(),
  },
  // Tenancy 002 deposits (PENDING_CONTRACT - deposits pending)
  {
    id: "deposit-004",
    tenancyId: "tenancy-002",
    partnerId: "partner-001",
    ownerId: "owner-002",
    tenantId: "tenant-001",
    type: "SECURITY",
    amount: 3600,
    currency: "MYR",
    status: "PENDING",
    deductionClaims: [],
    createdAt: "2024-01-20T10:00:00.000Z",
    updatedAt: mockTimestamp(),
  },
  {
    id: "deposit-005",
    tenancyId: "tenancy-002",
    partnerId: "partner-001",
    ownerId: "owner-002",
    tenantId: "tenant-001",
    type: "UTILITY",
    amount: 400,
    currency: "MYR",
    status: "PENDING",
    deductionClaims: [],
    createdAt: "2024-01-20T10:00:00.000Z",
    updatedAt: mockTimestamp(),
  },
  // Tenancy 003 deposits (TERMINATED - with deductions, partially refunded)
  {
    id: "deposit-006",
    tenancyId: "tenancy-003",
    partnerId: "partner-001",
    ownerId: "owner-003",
    tenantId: "tenant-001",
    type: "SECURITY",
    amount: 4000,
    currency: "MYR",
    status: "PARTIALLY_REFUNDED",
    collectedAt: "2023-01-01T10:00:00.000Z",
    collectedBy: "owner-003",
    refundedAt: "2024-01-15T10:00:00.000Z",
    refundedAmount: 3200,
    refundRef: "REF-2024-001234",
    refundNotes: "Deducted for wall repair and cleaning",
    deductionClaims: [
      {
        claimId: "claim-001",
        description: "Wall repair - living room damage",
        amount: 500,
        addedAt: "2024-01-10T10:00:00.000Z",
      },
      {
        claimId: "claim-002",
        description: "Professional cleaning",
        amount: 300,
        addedAt: "2024-01-10T10:00:00.000Z",
      },
    ],
    createdAt: "2022-12-20T10:00:00.000Z",
    updatedAt: mockTimestamp(),
  },
  {
    id: "deposit-007",
    tenancyId: "tenancy-003",
    partnerId: "partner-001",
    ownerId: "owner-003",
    tenantId: "tenant-001",
    type: "UTILITY",
    amount: 500,
    currency: "MYR",
    status: "FULLY_REFUNDED",
    collectedAt: "2023-01-01T10:00:00.000Z",
    collectedBy: "owner-003",
    refundedAt: "2024-01-15T10:00:00.000Z",
    refundedAmount: 500,
    refundRef: "REF-2024-001235",
    deductionClaims: [],
    createdAt: "2022-12-20T10:00:00.000Z",
    updatedAt: mockTimestamp(),
  },
  {
    id: "deposit-008",
    tenancyId: "tenancy-003",
    partnerId: "partner-001",
    ownerId: "owner-003",
    tenantId: "tenant-001",
    type: "KEY",
    amount: 100,
    currency: "MYR",
    status: "FORFEITED",
    collectedAt: "2023-01-01T10:00:00.000Z",
    collectedBy: "owner-003",
    refundNotes: "Keys not returned",
    deductionClaims: [],
    createdAt: "2022-12-20T10:00:00.000Z",
    updatedAt: mockTimestamp(),
  },
];

// Initialize store
sampleDeposits.forEach((deposit) => {
  depositStore.set(deposit.id, deposit);
});

// ---------------------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------------------

function getDepositsByTenancy(tenancyId: string): MockDeposit[] {
  return Array.from(depositStore.values()).filter(
    (deposit) => deposit.tenancyId === tenancyId
  );
}

function calculateSummary(tenancyId: string): MockDepositSummary {
  const deposits = getDepositsByTenancy(tenancyId);
  
  const totalDeposits = deposits.reduce((sum, d) => sum + d.amount, 0);
  
  const collected = deposits.filter((d) =>
    ["COLLECTED", "HELD", "PARTIALLY_REFUNDED"].includes(d.status)
  );
  const totalCollected = collected.reduce((sum, d) => sum + d.amount, 0);
  
  const totalRefunded = deposits.reduce((sum, d) => sum + (d.refundedAmount ?? 0), 0);
  
  const totalDeductions = deposits.reduce(
    (sum, d) => sum + (d.deductionClaims?.reduce((s, c) => s + c.amount, 0) ?? 0),
    0
  );
  
  const pending = deposits.filter((d) => d.status === "PENDING");
  const totalPending = pending.reduce((sum, d) => sum + d.amount, 0);

  return {
    tenancyId,
    totalDeposits,
    totalCollected,
    totalRefunded,
    totalDeductions,
    totalPending,
    deposits: deposits.map((d) => {
      const deductionTotal = d.deductionClaims?.reduce((s, c) => s + c.amount, 0) ?? 0;
      return {
        id: d.id,
        type: d.type,
        amount: d.amount,
        status: d.status,
        refundableAmount:
          d.status === "COLLECTED" || d.status === "HELD"
            ? d.amount - deductionTotal
            : null,
      };
    }),
  };
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

export const depositHandlers = [
  // GET /deposits/tenancy/:tenancyId — List deposits for tenancy
  http.get(`${API_BASE}/deposits/tenancy/:tenancyId`, async ({ params }) => {
    await delay(150);
    const { tenancyId } = params;
    const deposits = getDepositsByTenancy(tenancyId as string);
    return HttpResponse.json(mockSuccessResponse(deposits));
  }),

  // GET /deposits/tenancy/:tenancyId/summary — Get deposit summary
  http.get(`${API_BASE}/deposits/tenancy/:tenancyId/summary`, async ({ params }) => {
    await delay(150);
    const { tenancyId } = params;
    const summary = calculateSummary(tenancyId as string);
    return HttpResponse.json(mockSuccessResponse(summary));
  }),

  // GET /deposits/:id — Get single deposit
  http.get(`${API_BASE}/deposits/:id`, async ({ params }) => {
    await delay(100);
    const { id } = params;
    const deposit = depositStore.get(id as string);
    
    if (!deposit) {
      return HttpResponse.json(
        mockErrorResponse("DEPOSIT_NOT_FOUND", "Deposit not found"),
        { status: 404 }
      );
    }
    
    return HttpResponse.json(mockSuccessResponse(deposit));
  }),

  // POST /deposits — Create deposit
  http.post(`${API_BASE}/deposits`, async ({ request }) => {
    await delay(200);
    const body = (await request.json()) as {
      tenancyId: string;
      type: "SECURITY" | "UTILITY" | "KEY";
      amount: number;
      currency?: string;
    };
    
    const newDeposit: MockDeposit = {
      id: `deposit-${nextId()}`,
      tenancyId: body.tenancyId,
      partnerId: "partner-001",
      ownerId: "owner-001",
      tenantId: "tenant-001",
      type: body.type,
      amount: body.amount,
      currency: body.currency ?? "MYR",
      status: "PENDING",
      deductionClaims: [],
      createdAt: mockTimestamp(),
      updatedAt: mockTimestamp(),
    };
    
    depositStore.set(newDeposit.id, newDeposit);
    return HttpResponse.json(mockSuccessResponse(newDeposit), { status: 201 });
  }),

  // POST /deposits/:id/collect — Mark deposit as collected
  http.post(`${API_BASE}/deposits/:id/collect`, async ({ params, request }) => {
    await delay(200);
    const { id } = params;
    const body = (await request.json()) as { collectedBy?: string; notes?: string };
    
    const deposit = depositStore.get(id as string);
    if (!deposit) {
      return HttpResponse.json(
        mockErrorResponse("DEPOSIT_NOT_FOUND", "Deposit not found"),
        { status: 404 }
      );
    }
    
    if (deposit.status !== "PENDING") {
      return HttpResponse.json(
        mockErrorResponse("INVALID_STATUS", "Deposit must be PENDING to collect"),
        { status: 400 }
      );
    }
    
    const updated: MockDeposit = {
      ...deposit,
      status: "COLLECTED",
      collectedAt: mockTimestamp(),
      collectedBy: body.collectedBy ?? "current-user",
      updatedAt: mockTimestamp(),
    };
    
    depositStore.set(id as string, updated);
    return HttpResponse.json(mockSuccessResponse(updated));
  }),

  // POST /deposits/:id/deduction — Add deduction
  http.post(`${API_BASE}/deposits/:id/deduction`, async ({ params, request }) => {
    await delay(200);
    const { id } = params;
    const body = (await request.json()) as {
      claimId?: string;
      description: string;
      amount: number;
    };
    
    const deposit = depositStore.get(id as string);
    if (!deposit) {
      return HttpResponse.json(
        mockErrorResponse("DEPOSIT_NOT_FOUND", "Deposit not found"),
        { status: 404 }
      );
    }
    
    if (!["COLLECTED", "HELD"].includes(deposit.status)) {
      return HttpResponse.json(
        mockErrorResponse("INVALID_STATUS", "Deposit must be COLLECTED or HELD"),
        { status: 400 }
      );
    }
    
    const totalDeductions =
      (deposit.deductionClaims?.reduce((s, c) => s + c.amount, 0) ?? 0) + body.amount;
    
    if (totalDeductions > deposit.amount) {
      return HttpResponse.json(
        mockErrorResponse("DEDUCTION_EXCEEDS_AMOUNT", "Total deductions exceed deposit amount"),
        { status: 400 }
      );
    }
    
    const newDeduction: MockDeductionClaim = {
      claimId: body.claimId,
      description: body.description,
      amount: body.amount,
      addedAt: mockTimestamp(),
    };
    
    const updated: MockDeposit = {
      ...deposit,
      status: "HELD",
      deductionClaims: [...(deposit.deductionClaims ?? []), newDeduction],
      updatedAt: mockTimestamp(),
    };
    
    depositStore.set(id as string, updated);
    return HttpResponse.json(mockSuccessResponse(updated));
  }),

  // POST /deposits/:id/refund — Process refund
  http.post(`${API_BASE}/deposits/:id/refund`, async ({ params, request }) => {
    await delay(300);
    const { id } = params;
    const body = (await request.json()) as { refundRef?: string; notes?: string };
    
    const deposit = depositStore.get(id as string);
    if (!deposit) {
      return HttpResponse.json(
        mockErrorResponse("DEPOSIT_NOT_FOUND", "Deposit not found"),
        { status: 404 }
      );
    }
    
    if (!["COLLECTED", "HELD"].includes(deposit.status)) {
      return HttpResponse.json(
        mockErrorResponse("INVALID_STATUS", "Deposit must be COLLECTED or HELD to refund"),
        { status: 400 }
      );
    }
    
    const totalDeductions = deposit.deductionClaims?.reduce((s, c) => s + c.amount, 0) ?? 0;
    const refundAmount = deposit.amount - totalDeductions;
    
    const updated: MockDeposit = {
      ...deposit,
      status: refundAmount === deposit.amount ? "FULLY_REFUNDED" : "PARTIALLY_REFUNDED",
      refundedAt: mockTimestamp(),
      refundedAmount: refundAmount,
      refundRef: body.refundRef ?? `REF-${Date.now()}`,
      refundNotes: body.notes,
      updatedAt: mockTimestamp(),
    };
    
    depositStore.set(id as string, updated);
    return HttpResponse.json(mockSuccessResponse(updated));
  }),

  // POST /deposits/:id/forfeit — Forfeit deposit
  http.post(`${API_BASE}/deposits/:id/forfeit`, async ({ params, request }) => {
    await delay(200);
    const { id } = params;
    const body = (await request.json()) as { notes?: string };
    
    const deposit = depositStore.get(id as string);
    if (!deposit) {
      return HttpResponse.json(
        mockErrorResponse("DEPOSIT_NOT_FOUND", "Deposit not found"),
        { status: 404 }
      );
    }
    
    if (!["COLLECTED", "HELD"].includes(deposit.status)) {
      return HttpResponse.json(
        mockErrorResponse("INVALID_STATUS", "Deposit must be COLLECTED or HELD to forfeit"),
        { status: 400 }
      );
    }
    
    const updated: MockDeposit = {
      ...deposit,
      status: "FORFEITED",
      refundNotes: body.notes,
      updatedAt: mockTimestamp(),
    };
    
    depositStore.set(id as string, updated);
    return HttpResponse.json(mockSuccessResponse(updated));
  }),

  // POST /deposits/:id/finalize — Finalize with claims
  http.post(`${API_BASE}/deposits/:id/finalize`, async ({ params, request }) => {
    await delay(300);
    const { id } = params;
    const body = (await request.json()) as { refundRef?: string; notes?: string };
    
    const deposit = depositStore.get(id as string);
    if (!deposit) {
      return HttpResponse.json(
        mockErrorResponse("DEPOSIT_NOT_FOUND", "Deposit not found"),
        { status: 404 }
      );
    }
    
    if (!["COLLECTED", "HELD"].includes(deposit.status)) {
      return HttpResponse.json(
        mockErrorResponse("INVALID_STATUS", "Deposit must be COLLECTED or HELD to finalize"),
        { status: 400 }
      );
    }
    
    const totalDeductions = deposit.deductionClaims?.reduce((s, c) => s + c.amount, 0) ?? 0;
    const refundAmount = deposit.amount - totalDeductions;
    
    let newStatus: MockDeposit["status"];
    if (refundAmount <= 0) {
      newStatus = "FORFEITED";
    } else if (refundAmount < deposit.amount) {
      newStatus = "PARTIALLY_REFUNDED";
    } else {
      newStatus = "FULLY_REFUNDED";
    }
    
    const updated: MockDeposit = {
      ...deposit,
      status: newStatus,
      refundedAt: mockTimestamp(),
      refundedAmount: Math.max(0, refundAmount),
      refundRef: body.refundRef ?? `REF-${Date.now()}`,
      refundNotes: body.notes,
      updatedAt: mockTimestamp(),
    };
    
    depositStore.set(id as string, updated);
    return HttpResponse.json(mockSuccessResponse(updated));
  }),

  // GET /deposits/:id/refund-calculation — Calculate refund
  http.get(`${API_BASE}/deposits/:id/refund-calculation`, async ({ params }) => {
    await delay(100);
    const { id } = params;
    const deposit = depositStore.get(id as string);
    
    if (!deposit) {
      return HttpResponse.json(
        mockErrorResponse("DEPOSIT_NOT_FOUND", "Deposit not found"),
        { status: 404 }
      );
    }
    
    const totalDeductions = deposit.deductionClaims?.reduce((s, c) => s + c.amount, 0) ?? 0;
    const refundableAmount = deposit.amount - totalDeductions;
    
    const calculation = {
      depositId: deposit.id,
      depositType: deposit.type,
      originalAmount: deposit.amount,
      totalDeductions,
      refundableAmount: Math.max(0, refundableAmount),
      deductions: deposit.deductionClaims ?? [],
      canRefund: ["COLLECTED", "HELD"].includes(deposit.status),
      reason:
        !["COLLECTED", "HELD"].includes(deposit.status)
          ? `Cannot refund deposit in ${deposit.status} status`
          : undefined,
    };
    
    return HttpResponse.json(mockSuccessResponse(calculation));
  }),

  // GET /deposits/:id/transactions — Get transaction history
  http.get(`${API_BASE}/deposits/:id/transactions`, async ({ params }) => {
    await delay(100);
    const { id } = params;
    const deposit = depositStore.get(id as string);
    
    if (!deposit) {
      return HttpResponse.json(
        mockErrorResponse("DEPOSIT_NOT_FOUND", "Deposit not found"),
        { status: 404 }
      );
    }
    
    // Generate mock transactions from deposit history
    const transactions = [];
    let balance = 0;
    
    // Collection
    if (deposit.collectedAt) {
      balance = deposit.amount;
      transactions.push({
        id: `txn-${deposit.id}-001`,
        depositId: deposit.id,
        type: "COLLECTION",
        amount: deposit.amount,
        balanceAfter: balance,
        description: "Deposit collected",
        performedBy: deposit.collectedBy,
        performedAt: deposit.collectedAt,
      });
    }
    
    // Deductions
    deposit.deductionClaims?.forEach((deduction, idx) => {
      balance -= deduction.amount;
      transactions.push({
        id: `txn-${deposit.id}-ded-${idx}`,
        depositId: deposit.id,
        type: "DEDUCTION",
        amount: deduction.amount,
        balanceAfter: balance,
        description: deduction.description,
        performedAt: deduction.addedAt,
        metadata: deduction.claimId ? { claimId: deduction.claimId } : undefined,
      });
    });
    
    // Refund
    if (deposit.refundedAt && deposit.refundedAmount) {
      balance -= deposit.refundedAmount;
      transactions.push({
        id: `txn-${deposit.id}-refund`,
        depositId: deposit.id,
        type: "REFUND",
        amount: deposit.refundedAmount,
        balanceAfter: balance,
        description: deposit.refundNotes ?? "Deposit refunded",
        performedAt: deposit.refundedAt,
        metadata: deposit.refundRef ? { refundRef: deposit.refundRef } : undefined,
      });
    }
    
    // Forfeit
    if (deposit.status === "FORFEITED" && deposit.refundedAt === undefined) {
      transactions.push({
        id: `txn-${deposit.id}-forfeit`,
        depositId: deposit.id,
        type: "FORFEIT",
        amount: balance,
        balanceAfter: 0,
        description: deposit.refundNotes ?? "Deposit forfeited",
        performedAt: deposit.updatedAt,
      });
    }
    
    return HttpResponse.json(mockSuccessResponse(transactions));
  }),
];
