// =============================================================================
// MSW Handlers — Contract domain mock handlers
// =============================================================================
// Mocks the contract endpoints for the Property Management system.
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

interface MockContractSigner {
  id: string;
  contractId: string;
  userId: string;
  role: string;
  status: string;
  name: string;
  email: string;
  signedAt?: string;
  signatureUrl?: string;
  ipAddress?: string;
  order: number;
}

interface MockContractEvent {
  id: string;
  contractId: string;
  eventType: string;
  actorId?: string;
  actorName?: string;
  actorRole?: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

interface MockContract {
  id: string;
  partnerId: string;
  tenancyId: string;
  type: string;
  status: string;
  version: number;
  title: string;
  description?: string;
  documentUrl?: string;
  pdfUrl?: string;
  htmlContent?: string;
  externalSigningUrl?: string;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  signedAt?: string;
  signers: MockContractSigner[];
  events: MockContractEvent[];
  terms: {
    tenancyPeriod: {
      startDate: string;
      endDate: string;
      durationMonths: number;
    };
    financials: {
      monthlyRent: number;
      securityDeposit: number;
      utilityDeposit: number;
      stampDuty?: number;
      currency: string;
    };
    noticePeriodDays: number;
    renewalTerms?: string;
    specialClauses?: string[];
    petPolicy?: string;
    maintenanceResponsibilities?: {
      owner: string[];
      tenant: string[];
    };
  };
  tenancy?: {
    id: string;
    propertyTitle: string;
    propertyAddress: string;
    tenantName: string;
    ownerName: string;
  };
}

// ---------------------------------------------------------------------------
// In-memory store
// ---------------------------------------------------------------------------

const contractStore: Map<string, MockContract> = new Map();
const tenancyContractMap: Map<string, string> = new Map(); // tenancyId -> contractId

// Pre-populate sample contracts
const sampleContracts: MockContract[] = [
  {
    id: "contract-001",
    partnerId: "partner-001",
    tenancyId: "tenancy-001",
    type: "TENANCY_AGREEMENT",
    status: "SIGNED",
    version: 1,
    title: "Tenancy Agreement - KLCC Condo A-12-03",
    description: "Standard residential tenancy agreement for 12 months",
    pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    htmlContent: `
      <h1>TENANCY AGREEMENT</h1>
      <p>This Tenancy Agreement is made on the 1st day of January 2024</p>
      <h2>BETWEEN</h2>
      <p><strong>LANDLORD:</strong> Tan Properties Sdn Bhd (Company No: 123456-X)</p>
      <p><strong>PARTNER:</strong> Ahmad bin Abdullah (IC: 880101-14-5555)</p>
      <h2>PROPERTY</h2>
      <p>Unit A-12-03, Luxurious Condo at KLCC, No. 1, Jalan Sultan Ismail, 50250 Kuala Lumpur</p>
      <h2>TERMS</h2>
      <ul>
        <li>Tenancy Period: 12 months from 1st January 2024 to 31st December 2024</li>
        <li>Monthly Rent: RM 2,500</li>
        <li>Security Deposit: RM 5,000 (2 months rent)</li>
        <li>Utility Deposit: RM 500</li>
      </ul>
      <h2>CONDITIONS</h2>
      <ol>
        <li>Partner shall use the premises for residential purposes only.</li>
        <li>Partner shall not sublet or assign the premises without written consent.</li>
        <li>Partner shall maintain the premises in good condition.</li>
        <li>Landlord shall be responsible for structural repairs.</li>
      </ol>
    `,
    createdAt: "2023-12-20T10:00:00.000Z",
    updatedAt: "2024-01-05T14:30:00.000Z",
    signedAt: "2024-01-05T14:30:00.000Z",
    signers: [
      {
        id: "signer-001",
        contractId: "contract-001",
        userId: "owner-001",
        role: "OWNER",
        status: "SIGNED",
        name: "Tan Ah Kow",
        email: "tan@properties.com",
        signedAt: "2024-01-02T10:00:00.000Z",
        ipAddress: "192.168.1.100",
        order: 1,
      },
      {
        id: "signer-002",
        contractId: "contract-001",
        userId: "tenant-001",
        role: "TENANT",
        status: "SIGNED",
        name: "Ahmad bin Abdullah",
        email: "ahmad@email.com",
        signedAt: "2024-01-05T14:30:00.000Z",
        ipAddress: "192.168.1.101",
        order: 2,
      },
    ],
    events: [
      {
        id: "event-001",
        contractId: "contract-001",
        eventType: "CREATED",
        description: "Contract created",
        timestamp: "2023-12-20T10:00:00.000Z",
      },
      {
        id: "event-002",
        contractId: "contract-001",
        eventType: "SENT",
        description: "Contract sent to all parties for signing",
        timestamp: "2023-12-21T09:00:00.000Z",
      },
      {
        id: "event-003",
        contractId: "contract-001",
        eventType: "VIEWED",
        actorId: "owner-001",
        actorName: "Tan Ah Kow",
        actorRole: "OWNER",
        description: "Contract viewed by owner",
        timestamp: "2024-01-01T08:00:00.000Z",
      },
      {
        id: "event-004",
        contractId: "contract-001",
        eventType: "SIGNED",
        actorId: "owner-001",
        actorName: "Tan Ah Kow",
        actorRole: "OWNER",
        description: "Contract signed by owner",
        timestamp: "2024-01-02T10:00:00.000Z",
      },
      {
        id: "event-005",
        contractId: "contract-001",
        eventType: "VIEWED",
        actorId: "tenant-001",
        actorName: "Ahmad bin Abdullah",
        actorRole: "TENANT",
        description: "Contract viewed by partner",
        timestamp: "2024-01-05T14:00:00.000Z",
      },
      {
        id: "event-006",
        contractId: "contract-001",
        eventType: "SIGNED",
        actorId: "tenant-001",
        actorName: "Ahmad bin Abdullah",
        actorRole: "TENANT",
        description: "Contract signed by partner",
        timestamp: "2024-01-05T14:30:00.000Z",
      },
    ],
    terms: {
      tenancyPeriod: {
        startDate: "2024-01-01",
        endDate: "2025-01-01",
        durationMonths: 12,
      },
      financials: {
        monthlyRent: 2500,
        securityDeposit: 5000,
        utilityDeposit: 500,
        stampDuty: 100,
        currency: "MYR",
      },
      noticePeriodDays: 60,
      renewalTerms: "Renewable for another 12 months at mutually agreed rent",
      specialClauses: [
        "No renovation without written approval",
        "Quiet hours from 10pm to 7am",
        "Maximum 4 tenants allowed",
      ],
      petPolicy: "Small pets allowed with additional deposit of RM 500",
      maintenanceResponsibilities: {
        owner: [
          "Major structural repairs",
          "Plumbing and electrical system maintenance",
          "Water heater replacement",
        ],
        tenant: [
          "Minor repairs under RM 200",
          "Replacing light bulbs and fuses",
          "General cleanliness and upkeep",
        ],
      },
    },
    tenancy: {
      id: "tenancy-001",
      propertyTitle: "Luxurious Condo at KLCC",
      propertyAddress: "No. 1, Jalan Sultan Ismail, KLCC, Kuala Lumpur",
      tenantName: "Ahmad bin Abdullah",
      ownerName: "Tan Properties Sdn Bhd",
    },
  },
  {
    id: "contract-002",
    partnerId: "partner-001",
    tenancyId: "tenancy-002",
    type: "TENANCY_AGREEMENT",
    status: "PENDING_SIGNATURES",
    version: 1,
    title: "Tenancy Agreement - Bukit Jalil Apartment",
    description: "Standard residential tenancy agreement for 12 months",
    pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    htmlContent: `
      <h1>TENANCY AGREEMENT</h1>
      <p>This Tenancy Agreement is made on the 15th day of January 2025</p>
      <h2>BETWEEN</h2>
      <p><strong>LANDLORD:</strong> Lee Mei Ling</p>
      <p><strong>PARTNER:</strong> Ahmad bin Abdullah (IC: 880101-14-5555)</p>
      <h2>PROPERTY</h2>
      <p>Unit B-5-10, Bukit Jalil Apartment, Jalan Jalil Perkasa, 57000 Kuala Lumpur</p>
      <h2>TERMS</h2>
      <ul>
        <li>Tenancy Period: 12 months from 1st February 2025 to 31st January 2026</li>
        <li>Monthly Rent: RM 1,800</li>
        <li>Security Deposit: RM 3,600 (2 months rent)</li>
        <li>Utility Deposit: RM 400</li>
      </ul>
    `,
    createdAt: "2025-01-15T10:00:00.000Z",
    updatedAt: mockTimestamp(),
    expiresAt: "2025-02-15T23:59:59.000Z",
    signers: [
      {
        id: "signer-003",
        contractId: "contract-002",
        userId: "owner-002",
        role: "OWNER",
        status: "SIGNED",
        name: "Lee Mei Ling",
        email: "leemeiling@email.com",
        signedAt: "2025-01-20T10:00:00.000Z",
        order: 1,
      },
      {
        id: "signer-004",
        contractId: "contract-002",
        userId: "tenant-001",
        role: "TENANT",
        status: "PENDING",
        name: "Ahmad bin Abdullah",
        email: "ahmad@email.com",
        order: 2,
      },
    ],
    events: [
      {
        id: "event-007",
        contractId: "contract-002",
        eventType: "CREATED",
        description: "Contract created",
        timestamp: "2025-01-15T10:00:00.000Z",
      },
      {
        id: "event-008",
        contractId: "contract-002",
        eventType: "SENT",
        description: "Contract sent to all parties for signing",
        timestamp: "2025-01-16T09:00:00.000Z",
      },
      {
        id: "event-009",
        contractId: "contract-002",
        eventType: "SIGNED",
        actorId: "owner-002",
        actorName: "Lee Mei Ling",
        actorRole: "OWNER",
        description: "Contract signed by owner",
        timestamp: "2025-01-20T10:00:00.000Z",
      },
    ],
    terms: {
      tenancyPeriod: {
        startDate: "2025-02-01",
        endDate: "2026-02-01",
        durationMonths: 12,
      },
      financials: {
        monthlyRent: 1800,
        securityDeposit: 3600,
        utilityDeposit: 400,
        currency: "MYR",
      },
      noticePeriodDays: 30,
      renewalTerms: "Auto-renewable with 30 days notice",
      petPolicy: "No pets allowed",
    },
    tenancy: {
      id: "tenancy-002",
      propertyTitle: "Cozy Apartment Bukit Jalil",
      propertyAddress: "Jalan Jalil Perkasa, Bukit Jalil, Kuala Lumpur",
      tenantName: "Ahmad bin Abdullah",
      ownerName: "Lee Mei Ling",
    },
  },
];

// Initialize stores
sampleContracts.forEach((contract) => {
  contractStore.set(contract.id, contract);
  tenancyContractMap.set(contract.tenancyId, contract.id);
});

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

export const contractHandlers = [
  // GET /contracts/:id — Get contract detail
  http.get(`${API_BASE}/contracts/:id`, async ({ params }) => {
    await delay(200);

    const { id } = params;
    const contract = contractStore.get(id as string);

    if (!contract) {
      return HttpResponse.json(
        mockErrorResponse("Contract not found", "CONTRACT_NOT_FOUND"),
        { status: 404 }
      );
    }

    return HttpResponse.json(mockSuccessResponse(contract));
  }),

  // GET /contracts/:id/pdf — Get contract PDF URL
  http.get(`${API_BASE}/contracts/:id/pdf`, async ({ params }) => {
    await delay(100);

    const { id } = params;
    const contract = contractStore.get(id as string);

    if (!contract) {
      return HttpResponse.json(
        mockErrorResponse("Contract not found", "CONTRACT_NOT_FOUND"),
        { status: 404 }
      );
    }

    return HttpResponse.json(
      mockSuccessResponse({
        url: contract.pdfUrl || "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour
      })
    );
  }),

  // GET /tenancies/:tenancyId/contract — Get contract by tenancy
  http.get(`${API_BASE}/tenancies/:tenancyId/contract`, async ({ params }) => {
    await delay(200);

    const { tenancyId } = params;
    const contractId = tenancyContractMap.get(tenancyId as string);

    if (!contractId) {
      return HttpResponse.json(
        mockErrorResponse("No contract found for this tenancy", "CONTRACT_NOT_FOUND"),
        { status: 404 }
      );
    }

    const contract = contractStore.get(contractId);

    if (!contract) {
      return HttpResponse.json(
        mockErrorResponse("Contract not found", "CONTRACT_NOT_FOUND"),
        { status: 404 }
      );
    }

    return HttpResponse.json(mockSuccessResponse(contract));
  }),

  // POST /contracts/:id/sign — Sign contract
  http.post(`${API_BASE}/contracts/:id/sign`, async ({ params, request }) => {
    await delay(500);

    const { id } = params;
    const contract = contractStore.get(id as string);

    if (!contract) {
      return HttpResponse.json(
        mockErrorResponse("Contract not found", "CONTRACT_NOT_FOUND"),
        { status: 404 }
      );
    }

    const body = (await request.json()) as {
      typedName?: string;
      signature?: string;
      acceptTerms: boolean;
    };

    if (!body.acceptTerms) {
      return HttpResponse.json(
        mockErrorResponse("You must accept the terms and conditions", "TERMS_NOT_ACCEPTED"),
        { status: 400 }
      );
    }

    // Find pending signer for current user (mock: use tenant-001)
    const signerIndex = contract.signers.findIndex(
      (s) => s.userId === "tenant-001" && s.status === "PENDING"
    );

    if (signerIndex === -1) {
      return HttpResponse.json(
        mockErrorResponse("You have already signed or are not a signer", "ALREADY_SIGNED"),
        { status: 400 }
      );
    }

    // Update signer
    contract.signers[signerIndex].status = "SIGNED";
    contract.signers[signerIndex].signedAt = mockTimestamp();
    contract.signers[signerIndex].ipAddress = "192.168.1.102";

    // Add event
    const eventId = `event-${nextId()}`;
    contract.events.push({
      id: eventId,
      contractId: id as string,
      eventType: "SIGNED",
      actorId: "tenant-001",
      actorName: contract.signers[signerIndex].name,
      actorRole: "TENANT",
      description: `Contract signed by ${contract.signers[signerIndex].name}`,
      timestamp: mockTimestamp(),
    });

    // Check if all signed
    const allSigned = contract.signers.every((s) => s.status === "SIGNED");
    if (allSigned) {
      contract.status = "SIGNED";
      contract.signedAt = mockTimestamp();
    }

    contract.updatedAt = mockTimestamp();
    contractStore.set(id as string, contract);

    return HttpResponse.json(mockSuccessResponse(contract));
  }),

  // POST /contracts/:id/resend — Resend contract email
  http.post(`${API_BASE}/contracts/:id/resend`, async ({ params, request }) => {
    await delay(300);

    const { id } = params;
    const contract = contractStore.get(id as string);

    if (!contract) {
      return HttpResponse.json(
        mockErrorResponse("Contract not found", "CONTRACT_NOT_FOUND"),
        { status: 404 }
      );
    }

    const body = (await request.json()) as { signerId?: string; message?: string };

    // Get recipients
    const recipients = body.signerId
      ? contract.signers.filter((s) => s.id === body.signerId).map((s) => s.email)
      : contract.signers.filter((s) => s.status === "PENDING").map((s) => s.email);

    // Add event
    const eventId = `event-${nextId()}`;
    contract.events.push({
      id: eventId,
      contractId: id as string,
      eventType: "SENT",
      description: `Contract resent to ${recipients.join(", ")}`,
      timestamp: mockTimestamp(),
    });

    contract.updatedAt = mockTimestamp();
    contractStore.set(id as string, contract);

    return HttpResponse.json(
      mockSuccessResponse({
        success: true,
        sentTo: recipients,
      })
    );
  }),

  // POST /contracts/:id/void — Void contract
  http.post(`${API_BASE}/contracts/:id/void`, async ({ params, request }) => {
    await delay(300);

    const { id } = params;
    const contract = contractStore.get(id as string);

    if (!contract) {
      return HttpResponse.json(
        mockErrorResponse("Contract not found", "CONTRACT_NOT_FOUND"),
        { status: 404 }
      );
    }

    if (contract.status === "SIGNED") {
      return HttpResponse.json(
        mockErrorResponse("Cannot void a signed contract", "CONTRACT_ALREADY_SIGNED"),
        { status: 400 }
      );
    }

    const body = (await request.json()) as { reason: string };

    contract.status = "VOIDED";

    // Add event
    const eventId = `event-${nextId()}`;
    contract.events.push({
      id: eventId,
      contractId: id as string,
      eventType: "VOIDED",
      description: `Contract voided: ${body.reason}`,
      timestamp: mockTimestamp(),
    });

    contract.updatedAt = mockTimestamp();
    contractStore.set(id as string, contract);

    return HttpResponse.json(mockSuccessResponse(contract));
  }),
];
