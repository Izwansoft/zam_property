// =============================================================================
// MSW Handlers — Notifications domain mock handlers
// =============================================================================

import { http, HttpResponse, delay } from "msw";
import {
  mockSuccessResponse,
  mockPaginatedResponse,
  mockTimestamp,
} from "../utils";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000/api/v1";

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

type MockNotificationType =
  | "LISTING_CREATED"
  | "LISTING_PUBLISHED"
  | "LISTING_EXPIRED"
  | "INTERACTION_NEW"
  | "INTERACTION_MESSAGE"
  | "VENDOR_APPROVED"
  | "VENDOR_REJECTED"
  | "REVIEW_CREATED"
  | "SUBSCRIPTION_EXPIRING"
  | "USAGE_WARNING"
  | "SYSTEM_ALERT";

interface MockNotification {
  id: string;
  type: MockNotificationType;
  title: string;
  message: string;
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  isRead: boolean;
  readAt: string | null;
  data: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

function createMockNotifications(): MockNotification[] {
  return [
    {
      id: "notif-001",
      type: "INTERACTION_NEW",
      title: "New Lead Received",
      message:
        "Ahmad Razak is interested in your listing 'Spacious Condo with KLCC View'",
      priority: "HIGH",
      isRead: false,
      readAt: null,
      data: {
        entityType: "interaction",
        entityId: "int-001",
        actionUrl: null,
      },
      createdAt: mockTimestamp(0),
      updatedAt: mockTimestamp(0),
    },
    {
      id: "notif-002",
      type: "LISTING_PUBLISHED",
      title: "Listing Published",
      message:
        "Your listing 'Modern Apartment in Mont Kiara' is now live and visible to buyers.",
      priority: "NORMAL",
      isRead: false,
      readAt: null,
      data: {
        entityType: "listing",
        entityId: "lst-002",
      },
      createdAt: mockTimestamp(0.1),
      updatedAt: mockTimestamp(0.1),
    },
    {
      id: "notif-003",
      type: "REVIEW_CREATED",
      title: "New Review",
      message:
        "Siti Nurhaliza left a 5-star review on your listing 'Luxury Bungalow with Pool'.",
      priority: "NORMAL",
      isRead: false,
      readAt: null,
      data: {
        entityType: "review",
        entityId: "rev-001",
      },
      createdAt: mockTimestamp(0.3),
      updatedAt: mockTimestamp(0.3),
    },
    {
      id: "notif-004",
      type: "INTERACTION_MESSAGE",
      title: "New Message",
      message:
        "James Wong sent a message regarding 'Cozy Studio near LRT'.",
      priority: "NORMAL",
      isRead: true,
      readAt: mockTimestamp(0.4),
      data: {
        entityType: "interaction",
        entityId: "int-002",
      },
      createdAt: mockTimestamp(0.5),
      updatedAt: mockTimestamp(0.4),
    },
    {
      id: "notif-005",
      type: "VENDOR_APPROVED",
      title: "Vendor Approved",
      message:
        "Your vendor profile has been approved. You can now create listings.",
      priority: "HIGH",
      isRead: true,
      readAt: mockTimestamp(0.8),
      data: {
        entityType: "vendor",
        entityId: "vnd-001",
      },
      createdAt: mockTimestamp(1),
      updatedAt: mockTimestamp(0.8),
    },
    {
      id: "notif-006",
      type: "LISTING_EXPIRED",
      title: "Listing Expired",
      message:
        "Your listing 'Family Home in Damansara Heights' has expired. Renew to keep it visible.",
      priority: "HIGH",
      isRead: true,
      readAt: mockTimestamp(1.2),
      data: {
        entityType: "listing",
        entityId: "lst-005",
      },
      createdAt: mockTimestamp(2),
      updatedAt: mockTimestamp(1.2),
    },
    {
      id: "notif-007",
      type: "SUBSCRIPTION_EXPIRING",
      title: "Subscription Expiring Soon",
      message:
        "Your Pro plan subscription expires in 7 days. Renew to avoid service interruption.",
      priority: "URGENT",
      isRead: false,
      readAt: null,
      data: null,
      createdAt: mockTimestamp(3),
      updatedAt: mockTimestamp(3),
    },
    {
      id: "notif-008",
      type: "LISTING_CREATED",
      title: "Listing Draft Saved",
      message:
        "Your listing 'Penthouse Suite with Panoramic View' has been saved as a draft.",
      priority: "LOW",
      isRead: true,
      readAt: mockTimestamp(3.5),
      data: {
        entityType: "listing",
        entityId: "lst-006",
      },
      createdAt: mockTimestamp(4),
      updatedAt: mockTimestamp(3.5),
    },
    {
      id: "notif-009",
      type: "USAGE_WARNING",
      title: "Usage Limit Warning",
      message:
        "You have used 80% of your monthly listing quota. Consider upgrading your plan.",
      priority: "HIGH",
      isRead: true,
      readAt: mockTimestamp(4.5),
      data: null,
      createdAt: mockTimestamp(5),
      updatedAt: mockTimestamp(4.5),
    },
    {
      id: "notif-010",
      type: "SYSTEM_ALERT",
      title: "Scheduled Maintenance",
      message:
        "Platform maintenance is scheduled for Feb 20, 2026 from 2:00 AM to 4:00 AM MYT.",
      priority: "NORMAL",
      isRead: true,
      readAt: mockTimestamp(6),
      data: null,
      createdAt: mockTimestamp(7),
      updatedAt: mockTimestamp(6),
    },
  ];
}

// Mutable store for mark-as-read state
let mockNotifications = createMockNotifications();

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

export const notificationHandlers = [
  // GET /api/v1/notifications — Paginated list
  http.get(`${API_BASE}/notifications`, async ({ request }) => {
    await delay(300);
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const pageSize = parseInt(url.searchParams.get("pageSize") || "20", 10);
    const isReadParam = url.searchParams.get("isRead");

    let filtered = [...mockNotifications];

    // Filter by read status
    if (isReadParam === "true") {
      filtered = filtered.filter((n) => n.isRead);
    } else if (isReadParam === "false") {
      filtered = filtered.filter((n) => !n.isRead);
    }

    // Sort by newest first
    filtered.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return HttpResponse.json(
      mockPaginatedResponse(filtered, page, pageSize),
    );
  }),

  // GET /api/v1/notifications/unread-count
  http.get(`${API_BASE}/notifications/unread-count`, async () => {
    await delay(150);
    const unreadCount = mockNotifications.filter((n) => !n.isRead).length;
    return HttpResponse.json(mockSuccessResponse({ unreadCount }));
  }),

  // PATCH /api/v1/notifications/:id/read — Mark single as read
  http.patch(`${API_BASE}/notifications/:id/read`, async ({ params }) => {
    await delay(200);
    const id = params.id as string;
    const notif = mockNotifications.find((n) => n.id === id);
    if (!notif) {
      return HttpResponse.json(
        { error: { code: "NOT_FOUND", message: "Notification not found" } },
        { status: 404 },
      );
    }
    notif.isRead = true;
    notif.readAt = new Date().toISOString();
    return HttpResponse.json(mockSuccessResponse(notif));
  }),

  // POST /api/v1/notifications/mark-all-read
  http.post(`${API_BASE}/notifications/mark-all-read`, async () => {
    await delay(300);
    let count = 0;
    const now = new Date().toISOString();
    mockNotifications.forEach((n) => {
      if (!n.isRead) {
        n.isRead = true;
        n.readAt = now;
        count++;
      }
    });
    return HttpResponse.json(mockSuccessResponse({ count }));
  }),

  // GET /api/v1/notifications/preferences
  http.get(`${API_BASE}/notifications/preferences`, async () => {
    await delay(200);
    return HttpResponse.json(
      mockSuccessResponse({
        email: { enabled: true, frequency: "instant" },
        push: { enabled: true },
        sms: { enabled: false },
        categories: {
          system: { email: true, push: true, sms: false },
          listings: { email: true, push: true, sms: false },
          interactions: { email: true, push: false, sms: false },
          billing: { email: true, push: true, sms: true },
          maintenance: { email: true, push: true, sms: false },
        },
      }),
    );
  }),

  // PATCH /api/v1/notifications/preferences
  http.patch(`${API_BASE}/notifications/preferences`, async ({ request }) => {
    await delay(300);
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      mockSuccessResponse({
        ...body,
        updatedAt: new Date().toISOString(),
      }),
    );
  }),
];
