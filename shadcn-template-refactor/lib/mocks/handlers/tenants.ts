// =============================================================================
// MSW Handlers — Tenant domain mock handlers
// =============================================================================
// Mocks the tenant profile, document upload, and onboarding endpoints.
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

interface MockTenant {
  id: string;
  userId: string;
  partnerId: string;
  status: string;
  type: string;
  fullName: string;
  icNumber?: string;
  passportNumber?: string;
  dateOfBirth?: string;
  nationality?: string;
  phone: string;
  email: string;
  employmentStatus?: string;
  employerName?: string;
  employerAddress?: string;
  jobTitle?: string;
  monthlyIncome?: number;
  emergencyContacts: Array<{
    name: string;
    relationship: string;
    phone: string;
    email?: string;
  }>;
  documents: MockTenantDocument[];
  verifiedAt?: string;
  verifiedById?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

interface MockTenantDocument {
  id: string;
  tenantId: string;
  type: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  verificationStatus: string;
  verifiedAt?: string;
  verifiedById?: string;
  rejectionReason?: string;
  expiryDate?: string;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// In-memory store
// ---------------------------------------------------------------------------

const tenantStore: Map<string, MockTenant> = new Map();
const documentStore: Map<string, MockTenantDocument> = new Map();
const pendingUploads: Map<string, { uploadUrl: string; fileUrl: string; documentType: string }> = new Map();

// Pre-populate a sample tenant
const sampleTenant: MockTenant = {
  id: "tenant-001",
  userId: "user-001",
  partnerId: "partner-001",
  status: "PENDING_VERIFICATION",
  type: "PRIMARY",
  fullName: "Ahmad bin Abdullah",
  icNumber: "900101-01-1234",
  passportNumber: undefined,
  dateOfBirth: "1990-01-01",
  nationality: "Malaysian",
  phone: "0123456789",
  email: "ahmad@example.com",
  employmentStatus: "EMPLOYED",
  employerName: "Tech Company Sdn Bhd",
  employerAddress: "123 Jalan Tech, KL",
  jobTitle: "Software Engineer",
  monthlyIncome: 8000,
  emergencyContacts: [
    {
      name: "Siti binti Ahmad",
      relationship: "SPOUSE",
      phone: "0198765432",
      email: "siti@example.com",
    },
  ],
  documents: [],
  createdAt: mockTimestamp(30),
  updatedAt: mockTimestamp(1),
};

tenantStore.set(sampleTenant.id, sampleTenant);

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

export const tenantHandlers = [
  // -----------------------------------------------------------------------
  // GET /tenants/me — Get current user's tenant profile
  // -----------------------------------------------------------------------
  http.get(`${API_BASE}/tenants/me`, async () => {
    await delay(200);

    // In a real app, we'd get the user ID from the auth token
    // For mock purposes, return the sample tenant or a "not found" if no profile
    const tenant = tenantStore.get("tenant-001");

    if (!tenant) {
      return HttpResponse.json(
        mockErrorResponse("NOT_FOUND", "Tenant profile not found"),
        { status: 404 }
      );
    }

    return HttpResponse.json(mockSuccessResponse(tenant));
  }),

  // -----------------------------------------------------------------------
  // PATCH /tenants/me — Update current user's tenant profile
  // -----------------------------------------------------------------------
  http.patch(`${API_BASE}/tenants/me`, async ({ request }) => {
    await delay(300);

    const body = await request.json() as Partial<MockTenant>;
    const tenant = tenantStore.get("tenant-001");

    if (!tenant) {
      return HttpResponse.json(
        mockErrorResponse("NOT_FOUND", "Tenant profile not found"),
        { status: 404 }
      );
    }

    const updatedTenant = {
      ...tenant,
      ...body,
      updatedAt: new Date().toISOString(),
    };

    tenantStore.set(tenant.id, updatedTenant);

    return HttpResponse.json(mockSuccessResponse(updatedTenant));
  }),

  // -----------------------------------------------------------------------
  // POST /tenants/onboarding — Submit onboarding data
  // -----------------------------------------------------------------------
  http.post(`${API_BASE}/tenants/onboarding`, async ({ request }) => {
    await delay(500);

    const body = await request.json() as {
      fullName: string;
      phone: string;
      email: string;
      icNumber?: string;
      passportNumber?: string;
      dateOfBirth?: string;
      nationality?: string;
      employmentStatus?: string;
      employerName?: string;
      employerAddress?: string;
      jobTitle?: string;
      monthlyIncome?: number;
      emergencyContacts: Array<{
        name: string;
        relationship: string;
        phone: string;
        email?: string;
      }>;
      documentIds: string[];
    };

    // Validate required fields
    if (!body.fullName || !body.phone) {
      return HttpResponse.json(
        mockErrorResponse("VALIDATION_ERROR", "Missing required fields", [
          { field: "fullName", code: "REQUIRED", message: "Full name is required" },
        ]),
        { status: 400 }
      );
    }

    // Get or create tenant
    let tenant = tenantStore.get("tenant-001");
    
    if (!tenant) {
      tenant = {
        id: nextId(),
        userId: "user-001",
        partnerId: "partner-001",
        status: "PENDING_VERIFICATION",
        type: "PRIMARY",
        fullName: body.fullName,
        phone: body.phone,
        email: body.email,
        documents: [],
        emergencyContacts: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    // Update tenant with onboarding data
    const updatedTenant: MockTenant = {
      ...tenant,
      fullName: body.fullName,
      phone: body.phone,
      email: body.email,
      icNumber: body.icNumber,
      passportNumber: body.passportNumber,
      dateOfBirth: body.dateOfBirth,
      nationality: body.nationality,
      employmentStatus: body.employmentStatus,
      employerName: body.employerName,
      employerAddress: body.employerAddress,
      jobTitle: body.jobTitle,
      monthlyIncome: body.monthlyIncome,
      emergencyContacts: body.emergencyContacts || [],
      status: "PENDING_VERIFICATION",
      updatedAt: new Date().toISOString(),
    };

    // Link documents
    if (body.documentIds) {
      const docs: MockTenantDocument[] = [];
      for (const docId of body.documentIds) {
        const doc = documentStore.get(docId);
        if (doc) {
          doc.tenantId = updatedTenant.id;
          docs.push(doc);
        }
      }
      updatedTenant.documents = docs;
    }

    tenantStore.set(updatedTenant.id, updatedTenant);

    return HttpResponse.json(mockSuccessResponse(updatedTenant));
  }),

  // -----------------------------------------------------------------------
  // POST /tenants/documents/presigned-url — Request presigned URL for document upload
  // -----------------------------------------------------------------------
  http.post(`${API_BASE}/tenants/documents/presigned-url`, async ({ request }) => {
    await delay(300);

    const body = await request.json() as {
      filename: string;
      mimeType: string;
      size: number;
      documentType: string;
    };

    if (!body.filename || !body.mimeType || !body.size || !body.documentType) {
      return HttpResponse.json(
        mockErrorResponse("VALIDATION_ERROR", "Missing required fields"),
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    if (body.size > 10 * 1024 * 1024) {
      return HttpResponse.json(
        mockErrorResponse("VALIDATION_ERROR", "File too large. Maximum size is 10MB."),
        { status: 400 }
      );
    }

    const id = nextId();
    const uploadUrl = `https://s3.mock.local/upload/${id}?presigned=true`;
    const fileUrl = `https://cdn.example.com/documents/${id}/${body.filename}`;

    // Store pending upload info
    pendingUploads.set(id, { uploadUrl, fileUrl, documentType: body.documentType });

    return HttpResponse.json(
      mockSuccessResponse({
        id,
        uploadUrl,
        fileUrl,
      })
    );
  }),

  // -----------------------------------------------------------------------
  // POST /tenants/documents/:id/confirm — Confirm document upload
  // -----------------------------------------------------------------------
  http.post(`${API_BASE}/tenants/documents/:id/confirm`, async ({ params }) => {
    await delay(200);

    const { id } = params as { id: string };
    const pending = pendingUploads.get(id);

    if (!pending) {
      return HttpResponse.json(
        mockErrorResponse("NOT_FOUND", "Upload session not found"),
        { status: 404 }
      );
    }

    // Create document record
    const document: MockTenantDocument = {
      id,
      tenantId: "", // Will be linked during onboarding
      type: pending.documentType,
      fileName: `document-${id}.pdf`,
      fileUrl: pending.fileUrl,
      fileSize: 1024 * 500, // 500KB mock
      mimeType: "application/pdf",
      verificationStatus: "PENDING",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    documentStore.set(id, document);
    pendingUploads.delete(id);

    return HttpResponse.json(mockSuccessResponse(document));
  }),

  // -----------------------------------------------------------------------
  // GET /tenants/documents — Get all documents for current tenant
  // -----------------------------------------------------------------------
  http.get(`${API_BASE}/tenants/documents`, async () => {
    await delay(200);

    const tenant = tenantStore.get("tenant-001");
    if (!tenant) {
      return HttpResponse.json(mockSuccessResponse([]));
    }

    return HttpResponse.json(mockSuccessResponse(tenant.documents));
  }),

  // -----------------------------------------------------------------------
  // DELETE /tenants/documents/:id — Delete a document
  // -----------------------------------------------------------------------
  http.delete(`${API_BASE}/tenants/documents/:id`, async ({ params }) => {
    await delay(200);

    const { id } = params as { id: string };

    if (!documentStore.has(id)) {
      return HttpResponse.json(
        mockErrorResponse("NOT_FOUND", "Document not found"),
        { status: 404 }
      );
    }

    documentStore.delete(id);

    // Also remove from tenant's documents array
    for (const tenant of tenantStore.values()) {
      tenant.documents = tenant.documents.filter((d) => d.id !== id);
    }

    return HttpResponse.json(mockSuccessResponse({ success: true }));
  }),
];
