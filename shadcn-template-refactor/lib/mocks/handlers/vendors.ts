// =============================================================================
// MSW Handlers — Vendors domain mock handlers
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
// Mock vendor data (12 vendors with varied statuses)
// ---------------------------------------------------------------------------

const MOCK_VENDORS: Array<{
  id: string;
  name: string;
  slug: string;
  type: "AGENCY" | "INDIVIDUAL" | "DEVELOPER";
  email: string;
  phone: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
  partnerId: string;
  description: string;
  logo: string | null;
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  registrationNumber: string;
  listingCount: number;
  activeListingCount: number;
  rating: number;
  reviewCount: number;
  rejectionReason?: string;
  suspensionReason?: string;
  verificationNotes?: string;
  lastActivityAt?: string;
  totalInteractions?: number;
  totalRevenue?: number;
  createdAt: string;
  updatedAt: string;
}> = [
  {
    id: "vendor-001",
    name: "Premium Properties Sdn Bhd",
    slug: "premium-properties",
    type: "AGENCY",
    email: "info@premiumproperties.my",
    phone: "+60312345678",
    status: "APPROVED",
    partnerId: "partner-001",
    description: "Leading property agency in Kuala Lumpur with over 10 years of experience in residential and commercial real estate.",
    logo: null,
    address: {
      line1: "Level 10, Tower A",
      line2: "Menara KLCC",
      city: "Kuala Lumpur",
      state: "Wilayah Persekutuan",
      postalCode: "50088",
      country: "MY",
    },
    registrationNumber: "SSM-12345678",
    listingCount: 24,
    activeListingCount: 18,
    rating: 4.5,
    reviewCount: 42,
    lastActivityAt: mockTimestamp(0),
    totalInteractions: 156,
    totalRevenue: 85000,
    createdAt: mockTimestamp(365),
    updatedAt: mockTimestamp(1),
  },
  {
    id: "vendor-002",
    name: "Hartamas Realty",
    slug: "hartamas-realty",
    type: "AGENCY",
    email: "hello@hartamasrealty.com",
    phone: "+60312345679",
    status: "APPROVED",
    partnerId: "partner-001",
    description: "Boutique real estate firm specializing in premium properties in Mont Kiara and Hartamas area.",
    logo: null,
    address: {
      line1: "Unit 5-1",
      line2: "Dataran Hartamas",
      city: "Kuala Lumpur",
      state: "Wilayah Persekutuan",
      postalCode: "50480",
      country: "MY",
    },
    registrationNumber: "SSM-87654321",
    listingCount: 12,
    activeListingCount: 9,
    rating: 4.2,
    reviewCount: 18,
    lastActivityAt: mockTimestamp(1),
    totalInteractions: 89,
    totalRevenue: 42000,
    createdAt: mockTimestamp(240),
    updatedAt: mockTimestamp(3),
  },
  {
    id: "vendor-003",
    name: "New Start Properties",
    slug: "new-start-properties",
    type: "INDIVIDUAL",
    email: "contact@newstart.my",
    phone: "+60312345680",
    status: "PENDING",
    partnerId: "partner-001",
    description: "Newly registered agent looking to list properties in the Klang Valley area.",
    logo: null,
    address: {
      line1: "Lot 22",
      line2: "Jalan Imbi",
      city: "Kuala Lumpur",
      state: "Wilayah Persekutuan",
      postalCode: "55100",
      country: "MY",
    },
    registrationNumber: "SSM-11223344",
    listingCount: 0,
    activeListingCount: 0,
    rating: 0,
    reviewCount: 0,
    totalInteractions: 0,
    createdAt: mockTimestamp(5),
    updatedAt: mockTimestamp(1),
  },
  {
    id: "vendor-004",
    name: "Sunset Homes",
    slug: "sunset-homes",
    type: "AGENCY",
    email: "info@sunsethomes.my",
    phone: "+60312345681",
    status: "SUSPENDED",
    partnerId: "partner-001",
    description: "Vendor under review due to policy violations.",
    logo: null,
    address: {
      line1: "Block B, Level 3",
      line2: "Sunway Pyramid",
      city: "Petaling Jaya",
      state: "Selangor",
      postalCode: "46150",
      country: "MY",
    },
    registrationNumber: "SSM-99887766",
    listingCount: 5,
    activeListingCount: 0,
    rating: 3.1,
    reviewCount: 7,
    suspensionReason: "Multiple complaints received from customers regarding misleading property descriptions.",
    lastActivityAt: mockTimestamp(15),
    totalInteractions: 34,
    totalRevenue: 12000,
    createdAt: mockTimestamp(300),
    updatedAt: mockTimestamp(10),
  },
  {
    id: "vendor-005",
    name: "Mega Development Group",
    slug: "mega-development",
    type: "DEVELOPER",
    email: "sales@megadev.com.my",
    phone: "+60312345682",
    status: "APPROVED",
    partnerId: "partner-001",
    description: "Award-winning property developer with projects across Peninsular Malaysia. Specializing in integrated townships and high-rise living.",
    logo: null,
    address: {
      line1: "Suite 20-01, Level 20",
      line2: "Naza Tower",
      city: "Kuala Lumpur",
      state: "Wilayah Persekutuan",
      postalCode: "50100",
      country: "MY",
    },
    registrationNumber: "SSM-55667788",
    listingCount: 35,
    activeListingCount: 28,
    rating: 4.7,
    reviewCount: 65,
    lastActivityAt: mockTimestamp(0),
    totalInteractions: 420,
    totalRevenue: 250000,
    createdAt: mockTimestamp(500),
    updatedAt: mockTimestamp(0),
  },
  {
    id: "vendor-006",
    name: "KL Property Hub",
    slug: "kl-property-hub",
    type: "AGENCY",
    email: "admin@klpropertyhub.my",
    phone: "+60312345683",
    status: "PENDING",
    partnerId: "partner-001",
    description: "New agency focusing on affordable housing in Kuala Lumpur.",
    logo: null,
    address: {
      line1: "No. 15, Jalan Sultan Ismail",
      city: "Kuala Lumpur",
      state: "Wilayah Persekutuan",
      postalCode: "50250",
      country: "MY",
    },
    registrationNumber: "SSM-22334455",
    listingCount: 0,
    activeListingCount: 0,
    rating: 0,
    reviewCount: 0,
    totalInteractions: 0,
    createdAt: mockTimestamp(3),
    updatedAt: mockTimestamp(1),
  },
  {
    id: "vendor-007",
    name: "Ahmad bin Hassan",
    slug: "ahmad-hassan",
    type: "INDIVIDUAL",
    email: "ahmad.hassan@email.com",
    phone: "+60191234567",
    status: "APPROVED",
    partnerId: "partner-001",
    description: "Experienced independent property negotiator based in Johor Bahru.",
    logo: null,
    address: {
      line1: "No. 88, Jalan Tebrau",
      city: "Johor Bahru",
      state: "Johor",
      postalCode: "80300",
      country: "MY",
    },
    registrationNumber: "REN-44556677",
    listingCount: 6,
    activeListingCount: 4,
    rating: 4.0,
    reviewCount: 9,
    lastActivityAt: mockTimestamp(2),
    totalInteractions: 45,
    totalRevenue: 18000,
    createdAt: mockTimestamp(180),
    updatedAt: mockTimestamp(2),
  },
  {
    id: "vendor-008",
    name: "Rejected Realty Co",
    slug: "rejected-realty",
    type: "AGENCY",
    email: "info@rejectedrealty.my",
    phone: "+60312345684",
    status: "REJECTED",
    partnerId: "partner-001",
    description: "Application was rejected due to incomplete documentation.",
    logo: null,
    address: {
      line1: "Unit 1-2, Block A",
      city: "Shah Alam",
      state: "Selangor",
      postalCode: "40000",
      country: "MY",
    },
    registrationNumber: "SSM-00112233",
    listingCount: 0,
    activeListingCount: 0,
    rating: 0,
    reviewCount: 0,
    rejectionReason: "Business registration documents appear to be expired. Please reapply with valid documentation.",
    totalInteractions: 0,
    createdAt: mockTimestamp(14),
    updatedAt: mockTimestamp(10),
  },
  {
    id: "vendor-009",
    name: "Penang Property Experts",
    slug: "penang-property-experts",
    type: "AGENCY",
    email: "info@penangproperty.my",
    phone: "+60412345678",
    status: "APPROVED",
    partnerId: "partner-001",
    description: "Penang's trusted real estate agency with deep expertise in George Town heritage properties and island living.",
    logo: null,
    address: {
      line1: "68, Lebuh Campbell",
      city: "George Town",
      state: "Pulau Pinang",
      postalCode: "10100",
      country: "MY",
    },
    registrationNumber: "SSM-66778899",
    listingCount: 18,
    activeListingCount: 14,
    rating: 4.6,
    reviewCount: 31,
    lastActivityAt: mockTimestamp(1),
    totalInteractions: 112,
    totalRevenue: 65000,
    createdAt: mockTimestamp(400),
    updatedAt: mockTimestamp(1),
  },
  {
    id: "vendor-010",
    name: "Sabah Land & Property",
    slug: "sabah-land-property",
    type: "AGENCY",
    email: "contact@sabahland.my",
    phone: "+60882345678",
    status: "PENDING",
    partnerId: "partner-001",
    description: "East Malaysia property specialist covering Kota Kinabalu and surrounding areas.",
    logo: null,
    address: {
      line1: "Lot 5, Block D",
      line2: "Wisma Sabah",
      city: "Kota Kinabalu",
      state: "Sabah",
      postalCode: "88100",
      country: "MY",
    },
    registrationNumber: "SSM-33445566",
    listingCount: 0,
    activeListingCount: 0,
    rating: 0,
    reviewCount: 0,
    totalInteractions: 0,
    createdAt: mockTimestamp(2),
    updatedAt: mockTimestamp(1),
  },
  {
    id: "vendor-011",
    name: "Greenfield Developments",
    slug: "greenfield-developments",
    type: "DEVELOPER",
    email: "sales@greenfield.com.my",
    phone: "+60312345685",
    status: "APPROVED",
    partnerId: "partner-001",
    description: "Sustainable property developer focused on green building certified developments.",
    logo: null,
    address: {
      line1: "Level 5, Menara Etiqa",
      city: "Kuala Lumpur",
      state: "Wilayah Persekutuan",
      postalCode: "50450",
      country: "MY",
    },
    registrationNumber: "SSM-77889900",
    listingCount: 10,
    activeListingCount: 8,
    rating: 4.3,
    reviewCount: 22,
    lastActivityAt: mockTimestamp(3),
    totalInteractions: 88,
    totalRevenue: 95000,
    createdAt: mockTimestamp(270),
    updatedAt: mockTimestamp(5),
  },
  {
    id: "vendor-012",
    name: "Siti Nurhaliza Properties",
    slug: "siti-nurhaliza-properties",
    type: "INDIVIDUAL",
    email: "siti.properties@email.com",
    phone: "+60171234568",
    status: "APPROVED",
    partnerId: "partner-001",
    description: "Part-time property agent specializing in Selangor residential properties.",
    logo: null,
    address: {
      line1: "No. 42, Jalan SS2/24",
      city: "Petaling Jaya",
      state: "Selangor",
      postalCode: "47300",
      country: "MY",
    },
    registrationNumber: "REN-11223344",
    listingCount: 3,
    activeListingCount: 2,
    rating: 3.8,
    reviewCount: 5,
    lastActivityAt: mockTimestamp(7),
    totalInteractions: 15,
    totalRevenue: 5000,
    createdAt: mockTimestamp(90),
    updatedAt: mockTimestamp(7),
  },
];

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

export const vendorHandlers = [
  // GET /vendors (paginated — Format A)
  http.get(`${API_BASE}/vendors`, async ({ request }) => {
    await delay(250);

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const pageSize = parseInt(url.searchParams.get("pageSize") || "20", 10);
    const status = url.searchParams.get("status");
    const type = url.searchParams.get("type");
    const search = url.searchParams.get("search");
    const sortBy = url.searchParams.get("sortBy") || "createdAt";
    const sortOrder = url.searchParams.get("sortOrder") || "desc";

    let filtered = [...MOCK_VENDORS];

    // Filter by status
    if (status) {
      filtered = filtered.filter((v) => v.status === status);
    }

    // Filter by type
    if (type) {
      filtered = filtered.filter((v) => v.type === type);
    }

    // Search by name or email
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (v) =>
          v.name.toLowerCase().includes(q) ||
          v.email.toLowerCase().includes(q) ||
          v.registrationNumber.toLowerCase().includes(q)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "listingCount":
          comparison = a.listingCount - b.listingCount;
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

    return HttpResponse.json(
      mockPaginatedResponse(paginated, page, pageSize, filtered.length)
    );
  }),

  // GET /vendors/:id (single entity — with detail fields)
  http.get(`${API_BASE}/vendors/:id`, async ({ params }) => {
    await delay(200);

    // Skip sub-resource paths (approve, reject, suspend)
    if (typeof params.id === "string" && params.id.includes("/")) {
      return;
    }

    const vendor = MOCK_VENDORS.find((v) => v.id === params.id);

    if (!vendor) {
      return HttpResponse.json(
        mockErrorResponse("VENDOR_NOT_FOUND", "Vendor not found"),
        { status: 404 }
      );
    }

    return HttpResponse.json(mockSuccessResponse(vendor));
  }),

  // POST /vendors/onboard — Submit vendor onboarding application
  http.post(`${API_BASE}/vendors/onboard`, async ({ request }) => {
    await delay(500);

    const body = (await request.json()) as {
      name?: string;
      type?: string;
      email?: string;
      phone?: string;
      description?: string;
      registrationNumber?: string;
      address?: {
        line1?: string;
        line2?: string;
        city?: string;
        state?: string;
        postalCode?: string;
        country?: string;
      };
      documentNames?: string[];
    };

    // Validate required fields
    const errors: Array<{ field: string; code: string; message: string }> = [];

    if (!body.name?.trim()) {
      errors.push({ field: "name", code: "REQUIRED", message: "Business name is required" });
    }
    if (!body.type || !["AGENCY", "INDIVIDUAL", "DEVELOPER"].includes(body.type)) {
      errors.push({ field: "type", code: "INVALID", message: "Invalid vendor type" });
    }
    if (!body.email?.trim()) {
      errors.push({ field: "email", code: "REQUIRED", message: "Email is required" });
    }
    if (!body.phone?.trim()) {
      errors.push({ field: "phone", code: "REQUIRED", message: "Phone is required" });
    }
    if (!body.registrationNumber?.trim()) {
      errors.push({ field: "registrationNumber", code: "REQUIRED", message: "Registration number is required" });
    }
    if (!body.address?.line1?.trim()) {
      errors.push({ field: "address.line1", code: "REQUIRED", message: "Address is required" });
    }

    if (errors.length > 0) {
      return HttpResponse.json(
        mockErrorResponse("VALIDATION_ERROR", "Validation failed", errors),
        { status: 422 },
      );
    }

    // Create new vendor with PENDING status
    const newVendor = {
      id: `vendor-${String(MOCK_VENDORS.length + 1).padStart(3, "0")}`,
      name: body.name!.trim(),
      slug: body.name!.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      type: body.type as "AGENCY" | "INDIVIDUAL" | "DEVELOPER",
      email: body.email!.trim(),
      phone: body.phone!.trim(),
      status: "PENDING" as const,
      partnerId: "partner-001",
      description: body.description?.trim() || "",
      logo: null,
      address: {
        line1: body.address!.line1!.trim(),
        line2: body.address?.line2?.trim(),
        city: body.address!.city?.trim() || "",
        state: body.address!.state?.trim() || "",
        postalCode: body.address!.postalCode?.trim() || "",
        country: body.address?.country || "MY",
      },
      registrationNumber: body.registrationNumber!.trim(),
      listingCount: 0,
      activeListingCount: 0,
      rating: 0,
      reviewCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    MOCK_VENDORS.push(newVendor);

    return HttpResponse.json(mockSuccessResponse(newVendor), { status: 201 });
  }),

  // PATCH /vendors/:id/approve
  http.patch(`${API_BASE}/vendors/:id/approve`, async ({ params }) => {
    await delay(300);

    const vendor = MOCK_VENDORS.find((v) => v.id === params.id);

    if (!vendor) {
      return HttpResponse.json(
        mockErrorResponse("VENDOR_NOT_FOUND", "Vendor not found"),
        { status: 404 }
      );
    }

    if (vendor.status !== "PENDING") {
      return HttpResponse.json(
        mockErrorResponse(
          "INVALID_STATUS_TRANSITION",
          `Cannot approve vendor with status ${vendor.status}. Only PENDING vendors can be approved.`
        ),
        { status: 422 }
      );
    }

    vendor.status = "APPROVED";
    vendor.updatedAt = new Date().toISOString();

    return HttpResponse.json(mockSuccessResponse(vendor));
  }),

  // PATCH /vendors/:id/reject
  http.patch(`${API_BASE}/vendors/:id/reject`, async ({ params, request }) => {
    await delay(300);

    const vendor = MOCK_VENDORS.find((v) => v.id === params.id);

    if (!vendor) {
      return HttpResponse.json(
        mockErrorResponse("VENDOR_NOT_FOUND", "Vendor not found"),
        { status: 404 }
      );
    }

    if (vendor.status !== "PENDING") {
      return HttpResponse.json(
        mockErrorResponse(
          "INVALID_STATUS_TRANSITION",
          `Cannot reject vendor with status ${vendor.status}. Only PENDING vendors can be rejected.`
        ),
        { status: 422 }
      );
    }

    const body = (await request.json()) as { reason?: string };

    if (!body.reason?.trim()) {
      return HttpResponse.json(
        mockErrorResponse("VALIDATION_ERROR", "Rejection reason is required", [
          { field: "reason", code: "REQUIRED", message: "Reason is required" },
        ]),
        { status: 422 }
      );
    }

    vendor.status = "REJECTED";
    vendor.rejectionReason = body.reason.trim();
    vendor.updatedAt = new Date().toISOString();

    return HttpResponse.json(mockSuccessResponse(vendor));
  }),

  // PATCH /vendors/:id/suspend
  http.patch(`${API_BASE}/vendors/:id/suspend`, async ({ params, request }) => {
    await delay(300);

    const vendor = MOCK_VENDORS.find((v) => v.id === params.id);

    if (!vendor) {
      return HttpResponse.json(
        mockErrorResponse("VENDOR_NOT_FOUND", "Vendor not found"),
        { status: 404 }
      );
    }

    if (vendor.status !== "APPROVED") {
      return HttpResponse.json(
        mockErrorResponse(
          "INVALID_STATUS_TRANSITION",
          `Cannot suspend vendor with status ${vendor.status}. Only APPROVED vendors can be suspended.`
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

    vendor.status = "SUSPENDED";
    vendor.suspensionReason = body.reason.trim();
    vendor.activeListingCount = 0;
    vendor.updatedAt = new Date().toISOString();

    return HttpResponse.json(mockSuccessResponse(vendor));
  }),
];
