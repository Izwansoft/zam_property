// =============================================================================
// MSW Handlers — Audit domain mock handlers
// =============================================================================
// Mocks for 6 audit endpoints:
//   GET /audit/logs (paginated)
//   GET /audit/logs/:id
//   GET /audit/target/:targetType/:targetId
//   GET /audit/actor/:actorId
//   GET /audit/action-types
//   GET /audit/target-types
// =============================================================================

import { http, HttpResponse, delay } from "msw";
import { mockMetaPaginatedResponse, mockTimestamp } from "../utils";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000/api/v1";

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const MOCK_ACTION_TYPES = [
  "AUTH_LOGIN",
  "AUTH_LOGOUT",
  "AUTH_FAILED",
  "USER_CREATED",
  "USER_UPDATED",
  "USER_DELETED",
  "USER_STATUS_CHANGE",
  "USER_ROLE_CHANGE",
  "PARTNER_CREATED",
  "PARTNER_UPDATED",
  "PARTNER_SETTINGS_UPDATED",
  "VENDOR_CREATED",
  "VENDOR_APPROVED",
  "VENDOR_REJECTED",
  "VENDOR_SUSPENDED",
  "LISTING_CREATED",
  "LISTING_UPDATED",
  "LISTING_PUBLISHED",
  "LISTING_UNPUBLISHED",
  "LISTING_EXPIRED",
  "LISTING_ARCHIVED",
  "LISTING_FEATURED",
  "MEDIA_UPLOADED",
  "MEDIA_DELETED",
  "INTERACTION_CREATED",
  "INTERACTION_STATUS_CHANGE",
  "REVIEW_CREATED",
  "REVIEW_APPROVED",
  "REVIEW_REJECTED",
  "SUBSCRIPTION_CREATED",
  "SUBSCRIPTION_CANCELLED",
  "ADMIN_ACTION",
  "FEATURE_FLAG_UPDATED",
];

const MOCK_TARGET_TYPES = [
  "user",
  "listing",
  "vendor",
  "review",
  "interaction",
  "subscription",
  "partner",
  "session",
  "media",
];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function buildMockAuditEntry(overrides?: Record<string, unknown>) {
  const actorTypes = ["USER", "SYSTEM", "ADMIN", "ANONYMOUS"] as const;
  const actionType = randomFrom(MOCK_ACTION_TYPES);
  const targetType = randomFrom(MOCK_TARGET_TYPES);
  const actorType = randomFrom([...actorTypes]);

  const entry = {
    id: crypto.randomUUID(),
    partnerId: "partner-001",
    actorType,
    actorId: actorType === "ANONYMOUS" ? null : crypto.randomUUID(),
    actorEmail:
      actorType === "USER"
        ? "us***@example.com"
        : actorType === "ADMIN"
          ? "ad***@company.com"
          : null,
    actionType,
    targetType,
    targetId: crypto.randomUUID(),
    oldValue: actionType.includes("UPDATED")
      ? { status: "DRAFT", price: 500000 }
      : null,
    newValue: actionType.includes("UPDATED")
      ? { status: "PUBLISHED", price: 480000 }
      : actionType.includes("CREATED")
        ? { title: "Mock Entity", status: "ACTIVE" }
        : null,
    metadata: { source: "api", reason: "Manual action" },
    ipAddress: "192.168.1.xxx",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    requestId: crypto.randomUUID(),
    timestamp: mockTimestamp(Math.floor(Math.random() * 30)),
    ...overrides,
  };

  return entry;
}

function buildMockAuditList(count: number = 20) {
  return Array.from({ length: count }, () => buildMockAuditEntry());
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

export const auditHandlers = [
  // 1. Query Audit Logs (paginated)
  http.get(`${API_BASE}/audit/logs`, async ({ request }) => {
    await delay(300);
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? "1");
    const pageSize = Number(url.searchParams.get("pageSize") ?? "20");
    const items = buildMockAuditList(pageSize);

    return HttpResponse.json(
      mockMetaPaginatedResponse(items, page, pageSize, 156)
    );
  }),

  // 2. Get Audit Log by ID
  http.get(`${API_BASE}/audit/logs/:id`, async ({ params }) => {
    await delay(200);
    const entry = buildMockAuditEntry({
      id: params.id as string,
      actionType: "LISTING_UPDATED",
      targetType: "listing",
      oldValue: { status: "DRAFT", price: 500000, title: "Old Title" },
      newValue: { status: "PUBLISHED", price: 480000, title: "Updated Title" },
      metadata: {
        source: "api",
        reason: "Manual publish",
        schemaVersion: "2.0",
      },
    });
    return HttpResponse.json(entry);
  }),

  // 3. Get Audit Logs by Target
  http.get(
    `${API_BASE}/audit/target/:targetType/:targetId`,
    async ({ request, params }) => {
      await delay(300);
      const url = new URL(request.url);
      const page = Number(url.searchParams.get("page") ?? "1");
      const pageSize = Number(url.searchParams.get("pageSize") ?? "20");

      const items = Array.from({ length: Math.min(pageSize, 5) }, () =>
        buildMockAuditEntry({
          targetType: params.targetType as string,
          targetId: params.targetId as string,
        })
      );

      return HttpResponse.json(
        mockMetaPaginatedResponse(items, page, pageSize, 5)
      );
    }
  ),

  // 4. Get Audit Logs by Actor
  http.get(`${API_BASE}/audit/actor/:actorId`, async ({ request, params }) => {
    await delay(300);
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? "1");
    const pageSize = Number(url.searchParams.get("pageSize") ?? "20");

    const items = Array.from({ length: Math.min(pageSize, 8) }, () =>
      buildMockAuditEntry({
        actorId: params.actorId as string,
        actorType: "USER",
        actorEmail: "us***@example.com",
      })
    );

    return HttpResponse.json(
      mockMetaPaginatedResponse(items, page, pageSize, 8)
    );
  }),

  // 5. Get Distinct Action Types
  http.get(`${API_BASE}/audit/action-types`, async () => {
    await delay(150);
    return HttpResponse.json({ actionTypes: MOCK_ACTION_TYPES });
  }),

  // 6. Get Distinct Target Types
  http.get(`${API_BASE}/audit/target-types`, async () => {
    await delay(150);
    return HttpResponse.json({ targetTypes: MOCK_TARGET_TYPES });
  }),
];
