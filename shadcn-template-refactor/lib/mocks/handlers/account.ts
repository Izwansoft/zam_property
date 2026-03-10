// =============================================================================
// MSW Handlers — Account (Customer portal)
// =============================================================================
// Mock handlers for: profile, dashboard stats, recent activity,
// inquiries, saved listings, reviews, notifications, settings, security
// =============================================================================

import { http, HttpResponse, delay } from "msw";
import {
  mockSuccessResponse,
  mockPaginatedResponse,
} from "../utils";
import type {
  CustomerProfile,
  AccountDashboardStats,
  AccountActivity,
  CustomerInquiry,
  SavedListing,
  CustomerReview,
  NotificationPreferencesData,
  AccountSettings,
  NotificationType,
  NotificationChannel,
} from "@/modules/account/types";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1";

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const mockProfile: CustomerProfile = {
  id: "cust-001",
  email: "sarah.tan@example.com",
  fullName: "Sarah Tan",
  phone: "+60 12-345 6789",
  avatarUrl: null,
  emailVerified: true,
  createdAt: "2025-06-15T08:30:00Z",
  updatedAt: "2026-01-20T14:15:00Z",
};

const mockDashboardStats: AccountDashboardStats = {
  savedListings: 12,
  totalInquiries: 8,
  activeInquiries: 3,
  reviewsWritten: 5,
  recentViews: 24,
  unreadNotifications: 2,
  upcomingViewings: 2,
};

const mockActivities: AccountActivity[] = [
  {
    id: "act-1",
    type: "INQUIRY_SENT",
    title: "Inquiry sent",
    description: "You sent an inquiry about 'Setia Alam 2-Storey Terrace'",
    entityId: "listing-001",
    entityType: "listing",
    createdAt: new Date(Date.now() - 2 * 60 * 60_000).toISOString(),
  },
  {
    id: "act-2",
    type: "LISTING_SAVED",
    title: "Listing saved",
    description: "You saved 'Mont Kiara Penthouse - Luxury Living'",
    entityId: "listing-002",
    entityType: "listing",
    createdAt: new Date(Date.now() - 5 * 60 * 60_000).toISOString(),
  },
  {
    id: "act-3",
    type: "INQUIRY_REPLIED",
    title: "Inquiry replied",
    description: "ABC Realty replied to your inquiry on 'Bangsar Condo'",
    entityId: "interaction-001",
    entityType: "interaction",
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60_000).toISOString(),
  },
  {
    id: "act-4",
    type: "REVIEW_POSTED",
    title: "Review posted",
    description: "You reviewed 'XYZ Properties Sdn Bhd' — 4 stars",
    entityId: "review-001",
    entityType: "review",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60_000).toISOString(),
  },
  {
    id: "act-5",
    type: "PROFILE_UPDATED",
    title: "Profile updated",
    description: "You updated your phone number",
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60_000).toISOString(),
  },
];

// ---------------------------------------------------------------------------
// Mock data — Inquiries
// ---------------------------------------------------------------------------

const LISTING_TITLES = [
  "Setia Alam 2-Storey Terrace",
  "Mont Kiara Penthouse - Luxury Living",
  "Bangsar South Condo",
  "Damansara Heights Bungalow",
  "Subang Jaya Semi-D",
  "Cyberjaya Smart Home Apartment",
];

const VENDOR_NAMES = [
  "ABC Realty Sdn Bhd",
  "Golden Property Group",
  "Skyline Homes",
  "Premier Properties",
  "Emerald Estates",
  "Horizon Real Estate",
];

const INQUIRY_STATUSES: Array<CustomerInquiry["status"]> = [
  "NEW",
  "CONTACTED",
  "CONFIRMED",
  "CLOSED",
  "NEW",
  "CONTACTED",
  "CLOSED",
  "INVALID",
];

const mockInquiries: CustomerInquiry[] = Array.from({ length: 15 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - i * 2);
  return {
    id: `inq-${String(i + 1).padStart(3, "0")}`,
    listingId: `listing-${String((i % 6) + 1).padStart(3, "0")}`,
    listingTitle: LISTING_TITLES[i % LISTING_TITLES.length],
    vendorName: VENDOR_NAMES[i % VENDOR_NAMES.length],
    message: `Hi, I'm interested in this property. Could you provide more details about ${LISTING_TITLES[i % LISTING_TITLES.length]}?`,
    status: INQUIRY_STATUSES[i % INQUIRY_STATUSES.length],
    createdAt: d.toISOString(),
    updatedAt: d.toISOString(),
    lastReplyAt:
      INQUIRY_STATUSES[i % INQUIRY_STATUSES.length] === "CONTACTED"
        ? new Date(d.getTime() + 86_400_000).toISOString()
        : null,
  };
});

// ---------------------------------------------------------------------------
// Mock data — Saved Listings
// ---------------------------------------------------------------------------

const mockSavedListings: SavedListing[] = Array.from({ length: 12 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - i * 3);
  const prices = [450000, 680000, 1200000, 350000, 890000, 520000];
  const locations = [
    "Setia Alam, Shah Alam",
    "Mont Kiara, KL",
    "Bangsar South, KL",
    "Damansara Heights, KL",
    "Subang Jaya, Selangor",
    "Cyberjaya, Selangor",
  ];

  return {
    id: `saved-${String(i + 1).padStart(3, "0")}`,
    listingId: `listing-${String((i % 6) + 1).padStart(3, "0")}`,
    title: LISTING_TITLES[i % LISTING_TITLES.length],
    price: prices[i % prices.length],
    currency: "MYR",
    location: locations[i % locations.length],
    primaryImage: null,
    status: i % 5 === 0 ? "EXPIRED" : "PUBLISHED",
    savedAt: d.toISOString(),
  };
});

// ---------------------------------------------------------------------------
// Mock data — Customer Reviews
// ---------------------------------------------------------------------------

const REVIEW_TITLES_CUST = [
  "Great experience overall",
  "Very helpful agent",
  "Professional service",
  "Good property, fair price",
  "Average experience",
  "Excellent communication",
];

const REVIEW_CONTENTS_CUST = [
  "The vendor was very responsive and the property matched the listing description perfectly.",
  "Helpful and knowledgeable agent who went above and beyond to answer all my questions.",
  "Professional handling of the entire viewing and negotiation process.",
  "Good property at a fair price. Minor issues with documentation turnaround.",
  "The experience was average. Communication could have been better.",
  "Excellent communication throughout. Very transparent about the property condition.",
];

const mockCustomerReviews: CustomerReview[] = Array.from(
  { length: 10 },
  (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (i * 5 + 2));
    const ratings = [5, 4, 5, 4, 3, 5, 4, 3, 5, 4];
    const statuses: CustomerReview["status"][] = [
      "APPROVED",
      "APPROVED",
      "PENDING",
      "APPROVED",
      "APPROVED",
      "REJECTED",
      "APPROVED",
      "APPROVED",
      "APPROVED",
      "PENDING",
    ];
    const vendorReplies = [
      "Thank you for the kind words!",
      null,
      null,
      "We appreciate your feedback.",
      null,
      null,
      "Glad you had a great experience!",
      null,
      "Thank you for choosing us!",
      null,
    ];

    return {
      id: `cust-rev-${String(i + 1).padStart(3, "0")}`,
      vendorId: `vendor-${String((i % 6) + 1).padStart(3, "0")}`,
      vendorName: VENDOR_NAMES[i % VENDOR_NAMES.length],
      listingId: `listing-${String((i % 6) + 1).padStart(3, "0")}`,
      listingTitle: LISTING_TITLES[i % LISTING_TITLES.length],
      rating: ratings[i],
      title: REVIEW_TITLES_CUST[i % REVIEW_TITLES_CUST.length],
      content: REVIEW_CONTENTS_CUST[i % REVIEW_CONTENTS_CUST.length],
      status: statuses[i],
      vendorReply: vendorReplies[i],
      createdAt: d.toISOString(),
      updatedAt: d.toISOString(),
    };
  }
);

// ---------------------------------------------------------------------------
// Mock data — Notification Preferences
// ---------------------------------------------------------------------------

const NOTIFICATION_TYPES_DATA: Array<{
  type: NotificationType;
  label: string;
  description: string;
}> = [
  { type: "INTERACTION_NEW", label: "New Interaction", description: "When a vendor responds to your inquiry" },
  { type: "INTERACTION_MESSAGE", label: "Interaction Message", description: "When there's a reply on your inquiry" },
  { type: "LISTING_PUBLISHED", label: "Listing Published", description: "When saved listings are published or updated" },
  { type: "LISTING_EXPIRED", label: "Listing Expired", description: "When saved listings expire" },
  { type: "REVIEW_SUBMITTED", label: "Review Activity", description: "When your review receives a reply" },
  { type: "REVIEW_APPROVED", label: "Review Approved", description: "When your review is approved" },
  { type: "VENDOR_APPROVED", label: "Vendor Approved", description: "When a vendor you follow is approved" },
  { type: "VENDOR_SUSPENDED", label: "Vendor Suspended", description: "When a vendor you follow is suspended" },
  { type: "SUBSCRIPTION_CREATED", label: "Subscription Created", description: "When your subscription is created" },
  { type: "SUBSCRIPTION_EXPIRING", label: "Subscription Expiring", description: "When your subscription is about to expire" },
  { type: "PAYMENT_SUCCESS", label: "Payment Success", description: "When a payment is successful" },
  { type: "PAYMENT_FAILED", label: "Payment Failed", description: "When a payment fails" },
  { type: "SYSTEM_ALERT", label: "System Alerts", description: "Platform announcements and security alerts" },
];

const mockNotificationPreferences: NotificationPreferencesData = {
  preferences: NOTIFICATION_TYPES_DATA.map(({ type, label, description }) => ({
    type,
    label,
    description,
    channels: {
      EMAIL: true,
      PUSH: type !== "SYSTEM_ALERT",
      SMS: type === "SYSTEM_ALERT" || type === "PAYMENT_FAILED",
      IN_APP: true,
      WHATSAPP: false,
    },
  })),
};

// ---------------------------------------------------------------------------
// Mock data — Account Settings
// ---------------------------------------------------------------------------

const mockAccountSettings: AccountSettings = {
  language: "en",
  timezone: "Asia/Kuala_Lumpur",
  privacy: {
    showProfile: true,
    showEmail: false,
    showPhone: false,
  },
};

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

export const accountHandlers = [
  // GET /account/dashboard — dashboard stats
  http.get(`${API}/account/dashboard`, async () => {
    await delay(300);
    return HttpResponse.json(mockSuccessResponse(mockDashboardStats));
  }),

  // GET /account/activity — recent activity
  http.get(`${API}/account/activity`, async ({ request }) => {
    await delay(200);
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get("limit")) || 10;
    const sliced = mockActivities.slice(0, limit);
    return HttpResponse.json(mockSuccessResponse(sliced));
  }),

  // PATCH /account/profile — update profile
  http.patch(`${API}/account/profile`, async ({ request }) => {
    await delay(400);
    const body = (await request.json()) as Record<string, unknown>;

    // Apply updates to mock
    if (body.fullName) mockProfile.fullName = body.fullName as string;
    if (body.phone !== undefined) mockProfile.phone = body.phone as string | null;
    if (body.avatarUrl !== undefined)
      mockProfile.avatarUrl = body.avatarUrl as string | null;
    mockProfile.updatedAt = new Date().toISOString();

    return HttpResponse.json(mockSuccessResponse({ ...mockProfile }));
  }),

  // =========================================================================
  // Inquiries
  // =========================================================================

  http.get(`${API}/account/inquiries`, async ({ request }) => {
    await delay(300);
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page")) || 1;
    const pageSize = Number(url.searchParams.get("pageSize")) || 20;
    const status = url.searchParams.get("status") || "";
    const search = url.searchParams.get("search") || "";

    let filtered = [...mockInquiries];
    if (status) filtered = filtered.filter((i) => i.status === status);
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (i) =>
          i.listingTitle.toLowerCase().includes(q) ||
          i.vendorName.toLowerCase().includes(q)
      );
    }

    const start = (page - 1) * pageSize;
    const sliced = filtered.slice(start, start + pageSize);
    return HttpResponse.json(
      mockPaginatedResponse(sliced, page, pageSize, filtered.length)
    );
  }),

  // =========================================================================
  // Saved Listings
  // =========================================================================

  http.get(`${API}/account/saved`, async ({ request }) => {
    await delay(300);
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page")) || 1;
    const pageSize = Number(url.searchParams.get("pageSize")) || 20;
    const search = url.searchParams.get("search") || "";

    let filtered = [...mockSavedListings];
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          l.location.toLowerCase().includes(q)
      );
    }

    const start = (page - 1) * pageSize;
    const sliced = filtered.slice(start, start + pageSize);
    return HttpResponse.json(
      mockPaginatedResponse(sliced, page, pageSize, filtered.length)
    );
  }),

  http.delete(`${API}/account/saved/:listingId`, async () => {
    await delay(300);
    return HttpResponse.json(
      mockSuccessResponse({ message: "Listing removed from saved." })
    );
  }),

  // =========================================================================
  // Customer Reviews
  // =========================================================================

  http.get(`${API}/account/reviews`, async ({ request }) => {
    await delay(300);
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page")) || 1;
    const pageSize = Number(url.searchParams.get("pageSize")) || 20;
    const rating = url.searchParams.get("rating");
    const search = url.searchParams.get("search") || "";

    let filtered = [...mockCustomerReviews];
    if (rating) filtered = filtered.filter((r) => r.rating === Number(rating));
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.listingTitle.toLowerCase().includes(q) ||
          r.vendorName.toLowerCase().includes(q) ||
          r.content.toLowerCase().includes(q)
      );
    }

    const start = (page - 1) * pageSize;
    const sliced = filtered.slice(start, start + pageSize);
    return HttpResponse.json(
      mockPaginatedResponse(sliced, page, pageSize, filtered.length)
    );
  }),

  // =========================================================================
  // Notification Preferences
  // =========================================================================

  http.get(`${API}/account/notification-preferences`, async () => {
    await delay(300);
    return HttpResponse.json(mockSuccessResponse(mockNotificationPreferences));
  }),

  http.patch(`${API}/account/notification-preferences`, async ({ request }) => {
    await delay(400);
    const body = (await request.json()) as {
      preferences: Array<{
        type: NotificationType;
        channels: Record<NotificationChannel, boolean>;
      }>;
    };

    // Update mock state
    for (const update of body.preferences) {
      const pref = mockNotificationPreferences.preferences.find(
        (p) => p.type === update.type
      );
      if (pref) {
        pref.channels = { ...pref.channels, ...update.channels };
      }
    }

    return HttpResponse.json(mockSuccessResponse(mockNotificationPreferences));
  }),

  // =========================================================================
  // Account Settings
  // =========================================================================

  http.get(`${API}/account/settings`, async () => {
    await delay(300);
    return HttpResponse.json(mockSuccessResponse(mockAccountSettings));
  }),

  http.patch(`${API}/account/settings`, async ({ request }) => {
    await delay(400);
    const body = (await request.json()) as Record<string, unknown>;

    if (body.language)
      mockAccountSettings.language = body.language as AccountSettings["language"];
    if (body.timezone)
      mockAccountSettings.timezone = body.timezone as AccountSettings["timezone"];
    if (body.privacy) {
      const privacy = body.privacy as Partial<AccountSettings["privacy"]>;
      if (privacy.showProfile !== undefined)
        mockAccountSettings.privacy.showProfile = privacy.showProfile;
      if (privacy.showEmail !== undefined)
        mockAccountSettings.privacy.showEmail = privacy.showEmail;
      if (privacy.showPhone !== undefined)
        mockAccountSettings.privacy.showPhone = privacy.showPhone;
    }

    return HttpResponse.json(mockSuccessResponse({ ...mockAccountSettings }));
  }),

  // =========================================================================
  // Security
  // =========================================================================

  http.post(`${API}/account/change-password`, async () => {
    await delay(500);
    return HttpResponse.json(
      mockSuccessResponse({ message: "Password changed successfully." })
    );
  }),

  http.post(`${API}/account/delete-account`, async () => {
    await delay(500);
    return HttpResponse.json(
      mockSuccessResponse({ message: "Account scheduled for deletion." })
    );
  }),
];
