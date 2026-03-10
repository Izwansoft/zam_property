// =============================================================================
// MSW Handlers — Auth domain mock handlers
// =============================================================================

import { http, HttpResponse, delay } from "msw";
import {
  mockSuccessResponse,
  mockErrorResponse,
  mockTimestamp,
} from "../utils";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000/api/v1";

// ---------------------------------------------------------------------------
// Mock user data
// ---------------------------------------------------------------------------

const MOCK_USERS = {
  "admin@zamproperty.com": {
    id: "user-001",
    email: "admin@zamproperty.com",
    fullName: "Super Admin",
    phone: "+60123456789",
    role: "SUPER_ADMIN",
    status: "ACTIVE",
    emailVerified: true,
    partnerId: null,
    primaryVendorId: null,
    createdAt: mockTimestamp(365),
    updatedAt: mockTimestamp(1),
  },
  "partner@zamproperty.com": {
    id: "user-002",
    email: "partner@zamproperty.com",
    fullName: "Partner Admin",
    phone: "+60123456790",
    role: "PARTNER_ADMIN",
    status: "ACTIVE",
    emailVerified: true,
    partnerId: "partner-001",
    primaryVendorId: null,
    createdAt: mockTimestamp(180),
    updatedAt: mockTimestamp(2),
  },
  "vendor@zamproperty.com": {
    id: "user-003",
    email: "vendor@zamproperty.com",
    fullName: "Vendor Admin",
    phone: "+60123456791",
    role: "VENDOR_ADMIN",
    status: "ACTIVE",
    emailVerified: true,
    partnerId: "partner-001",
    primaryVendorId: "vendor-001",
    createdAt: mockTimestamp(90),
    updatedAt: mockTimestamp(3),
  },
  "customer@zamproperty.com": {
    id: "user-004",
    email: "customer@zamproperty.com",
    fullName: "Test Customer",
    phone: "+60123456792",
    role: "CUSTOMER",
    status: "ACTIVE",
    emailVerified: true,
    partnerId: null,
    primaryVendorId: null,
    createdAt: mockTimestamp(30),
    updatedAt: mockTimestamp(5),
  },
};

// Store the current logged-in user (per session)
let currentUser: (typeof MOCK_USERS)[keyof typeof MOCK_USERS] | null = null;

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

export const authHandlers = [
  // POST /auth/login
  http.post(`${API_BASE}/auth/login`, async ({ request }) => {
    await delay(300);

    const body = (await request.json()) as { email: string; password: string };
    const user = MOCK_USERS[body.email as keyof typeof MOCK_USERS];

    if (!user) {
      return HttpResponse.json(
        mockErrorResponse("INVALID_CREDENTIALS", "Invalid email or password"),
        { status: 401 }
      );
    }

    // Any password works in mock mode
    currentUser = user;

    return HttpResponse.json(
      mockSuccessResponse({
        accessToken: `mock-access-token-${user.id}`,
        refreshToken: `mock-refresh-token-${user.id}`,
        expiresIn: 3600,
        user,
      })
    );
  }),

  // POST /auth/refresh
  http.post(`${API_BASE}/auth/refresh`, async ({ request }) => {
    await delay(200);

    const body = (await request.json()) as { refreshToken: string };

    if (!body.refreshToken?.startsWith("mock-refresh-token-")) {
      return HttpResponse.json(
        mockErrorResponse("TOKEN_INVALID", "Invalid refresh token"),
        { status: 401 }
      );
    }

    const userId = body.refreshToken.replace("mock-refresh-token-", "");
    const user = Object.values(MOCK_USERS).find((u) => u.id === userId);

    if (!user) {
      return HttpResponse.json(
        mockErrorResponse("TOKEN_INVALID", "Invalid refresh token"),
        { status: 401 }
      );
    }

    return HttpResponse.json(
      mockSuccessResponse({
        accessToken: `mock-access-token-${user.id}`,
        refreshToken: `mock-refresh-token-${user.id}`,
        expiresIn: 3600,
      })
    );
  }),

  // POST /auth/register
  http.post(`${API_BASE}/auth/register`, async ({ request }) => {
    await delay(400);

    const body = (await request.json()) as {
      email: string;
      password: string;
      fullName: string;
      phone?: string;
    };

    if (MOCK_USERS[body.email as keyof typeof MOCK_USERS]) {
      return HttpResponse.json(
        mockErrorResponse("CONFLICT", "Email already registered"),
        { status: 409 }
      );
    }

    const newUser = {
      id: `user-${Date.now()}`,
      email: body.email,
      fullName: body.fullName,
      phone: body.phone || null,
      role: "CUSTOMER" as const,
      status: "ACTIVE" as const,
      emailVerified: false,
      partnerId: null,
      primaryVendorId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return HttpResponse.json(mockSuccessResponse(newUser), { status: 201 });
  }),

  // GET /users/me
  http.get(`${API_BASE}/users/me`, async ({ request }) => {
    await delay(150);

    const authHeader = request.headers.get("Authorization");

    if (!authHeader?.startsWith("Bearer mock-access-token-")) {
      return HttpResponse.json(
        mockErrorResponse("UNAUTHORIZED", "Not authenticated"),
        { status: 401 }
      );
    }

    const userId = authHeader.replace("Bearer mock-access-token-", "");
    const user = Object.values(MOCK_USERS).find((u) => u.id === userId);

    if (!user) {
      return HttpResponse.json(
        mockErrorResponse("NOT_FOUND", "User not found"),
        { status: 404 }
      );
    }

    return HttpResponse.json(mockSuccessResponse(user));
  }),
];
