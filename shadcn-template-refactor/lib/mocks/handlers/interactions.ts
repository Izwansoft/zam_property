// =============================================================================
// MSW Handlers — Interactions domain mock handlers
// =============================================================================

import { http, HttpResponse, delay } from "msw";
import {
  mockSuccessResponse,
  mockPaginatedResponse,
  mockErrorResponse,
  mockTimestamp,
} from "../utils";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000/api/v1";

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const LISTING_TITLES = [
  "Spacious Condo with KLCC View",
  "Modern Apartment in Mont Kiara",
  "Luxury Bungalow with Pool",
  "Cozy Studio near LRT",
  "Family Home in Damansara Heights",
  "Penthouse Suite with Panoramic View",
  "Newly Renovated Terrace House",
  "Semi-D in Bangsar South",
];

const CUSTOMER_NAMES = [
  "Ahmad Razak",
  "Siti Nurhaliza",
  "James Wong",
  "Priya Nair",
  "David Tan",
  "Fatimah Abdullah",
  "Kevin Lim",
  "Aishah Mohamed",
  "Chen Wei",
  "Rajesh Kumar",
];

const TYPES = ["LEAD", "ENQUIRY", "BOOKING"] as const;
const STATUSES = [
  "NEW",
  "NEW",
  "NEW",
  "CONTACTED",
  "CONTACTED",
  "CONFIRMED",
  "CLOSED",
  "INVALID",
] as const;

const MESSAGES_CONTENT = [
  "Hi, I'm interested in this property. Is it still available?",
  "Can I schedule a viewing this weekend?",
  "What is the minimum rental period?",
  "Is the price negotiable?",
  "Are pets allowed in this property?",
  "Can you share more photos of the kitchen?",
  "I'd like to make an offer. What's the process?",
  "Is the parking lot included in the price?",
  "What are the nearby amenities?",
  "How old is the building? Any renovation done?",
];

const VENDOR_REPLIES = [
  "Thank you for your interest! Yes, it's still available.",
  "Sure, I can arrange a viewing. When would suit you?",
  "The minimum rental period is 12 months.",
  "The price is slightly negotiable. Let's discuss.",
  "Yes, small pets are allowed with a pet deposit.",
  "I'll send additional photos shortly.",
  "We can discuss the offer process in detail. Are you free tomorrow?",
  "Yes, one dedicated parking bay is included.",
  "There are shops, restaurants, and a gym within walking distance.",
  "The building is 5 years old, recently repainted in 2025.",
];

// Generate mock interactions
const MOCK_INTERACTIONS = Array.from({ length: 24 }, (_, i) => {
  const statusIdx = i % STATUSES.length;
  const typeIdx = i % TYPES.length;
  const customerIdx = i % CUSTOMER_NAMES.length;
  const listingIdx = i % LISTING_TITLES.length;

  const createdDate = new Date();
  createdDate.setDate(createdDate.getDate() - (24 - i));
  createdDate.setHours(9 + (i % 12), (i * 17) % 60, 0, 0);

  const updatedDate = new Date(createdDate);
  updatedDate.setHours(updatedDate.getHours() + (i % 48));

  const messageCount = statusIdx === 0 ? 1 : 2 + (i % 4); // NEW has 1, others more

  return {
    id: `interaction-${String(i + 1).padStart(3, "0")}`,
    partnerId: "partner-001",
    vendorId: "vendor-001",
    listingId: `listing-${String(listingIdx + 1).padStart(3, "0")}`,
    listingTitle: LISTING_TITLES[listingIdx],
    type: TYPES[typeIdx],
    status: STATUSES[statusIdx],
    customerName: CUSTOMER_NAMES[customerIdx],
    customerEmail: `${CUSTOMER_NAMES[customerIdx].toLowerCase().replace(/\s/g, ".")}@email.com`,
    customerPhone: `+601${String(i + 1).padStart(8, "0")}`,
    referenceId: `REF-${String(2026)}${String(i + 1).padStart(5, "0")}`,
    lastMessage: MESSAGES_CONTENT[i % MESSAGES_CONTENT.length],
    messageCount,
    isBillable: typeIdx === 0, // LEADs are billable
    source: i % 3 === 0 ? "website" : i % 3 === 1 ? "mobile-app" : "referral",
    createdAt: createdDate.toISOString(),
    updatedAt: updatedDate.toISOString(),
  };
});

// Generate message threads for detail view
function generateMessages(interaction: (typeof MOCK_INTERACTIONS)[0]) {
  const messages = [];
  const baseDate = new Date(interaction.createdAt);

  // Initial customer message
  messages.push({
    id: `msg-${interaction.id}-1`,
    interactionId: interaction.id,
    content:
      MESSAGES_CONTENT[
        parseInt(interaction.id.split("-")[1]) % MESSAGES_CONTENT.length
      ],
    senderId: "customer-001",
    senderName: interaction.customerName,
    senderRole: "CUSTOMER" as const,
    createdAt: baseDate.toISOString(),
  });

  // Vendor replies (if status > NEW)
  if (interaction.status !== "NEW") {
    const replyDate = new Date(baseDate);
    replyDate.setHours(replyDate.getHours() + 2);

    messages.push({
      id: `msg-${interaction.id}-2`,
      interactionId: interaction.id,
      content:
        VENDOR_REPLIES[
          parseInt(interaction.id.split("-")[1]) % VENDOR_REPLIES.length
        ],
      senderId: "vendor-001",
      senderName: "Property Agent",
      senderRole: "VENDOR" as const,
      createdAt: replyDate.toISOString(),
    });

    // Customer follow-up
    if (interaction.messageCount > 2) {
      const followUpDate = new Date(replyDate);
      followUpDate.setHours(followUpDate.getHours() + 4);
      messages.push({
        id: `msg-${interaction.id}-3`,
        interactionId: interaction.id,
        content: "Thank you for the quick response! I'd like to proceed.",
        senderId: "customer-001",
        senderName: interaction.customerName,
        senderRole: "CUSTOMER" as const,
        createdAt: followUpDate.toISOString(),
      });
    }

    // Additional vendor reply
    if (interaction.messageCount > 3) {
      const additionalDate = new Date(baseDate);
      additionalDate.setDate(additionalDate.getDate() + 1);
      messages.push({
        id: `msg-${interaction.id}-4`,
        interactionId: interaction.id,
        content:
          "Great! I'll prepare the necessary documents. Let me know if you have any questions.",
        senderId: "vendor-001",
        senderName: "Property Agent",
        senderRole: "VENDOR" as const,
        createdAt: additionalDate.toISOString(),
      });
    }
  }

  return messages;
}

// ---------------------------------------------------------------------------
// Valid status transitions
// ---------------------------------------------------------------------------

const VALID_TRANSITIONS: Record<string, string[]> = {
  NEW: ["CONTACTED", "INVALID"],
  CONTACTED: ["CONFIRMED", "CLOSED"],
  CONFIRMED: ["CLOSED"],
  CLOSED: [],
  INVALID: [],
};

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

export const interactionHandlers = [
  // GET /interactions — paginated list with filters
  http.get(`${API_BASE}/interactions`, async ({ request }) => {
    await delay(300);

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const pageSize = parseInt(url.searchParams.get("pageSize") || "20", 10);
    const status = url.searchParams.get("status");
    const type = url.searchParams.get("type");
    const search = url.searchParams.get("search");
    const sortBy = url.searchParams.get("sortBy") || "createdAt";
    const sortOrder = url.searchParams.get("sortOrder") || "desc";

    let filtered = [...MOCK_INTERACTIONS];

    // Status filter
    if (status) {
      filtered = filtered.filter((i) => i.status === status);
    }

    // Type filter
    if (type) {
      filtered = filtered.filter((i) => i.type === type);
    }

    // Search filter (listing title, reference ID, customer name)
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (i) =>
          i.listingTitle.toLowerCase().includes(q) ||
          i.referenceId.toLowerCase().includes(q) ||
          i.customerName.toLowerCase().includes(q),
      );
    }

    // Sort
    filtered.sort((a, b) => {
      const key = sortBy as keyof (typeof MOCK_INTERACTIONS)[0];
      const aVal = String(a[key] ?? "");
      const bVal = String(b[key] ?? "");
      return sortOrder === "asc"
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    });

    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize);

    return HttpResponse.json(mockPaginatedResponse(items, page, pageSize, total));
  }),

  // GET /interactions/:id — single interaction detail
  http.get(`${API_BASE}/interactions/:id`, async ({ params }) => {
    await delay(200);

    const id = params.id as string;
    const interaction = MOCK_INTERACTIONS.find((i) => i.id === id);

    if (!interaction) {
      return HttpResponse.json(
        mockErrorResponse("INTERACTION_NOT_FOUND", "Interaction not found"),
        { status: 404 },
      );
    }

    const detail = {
      ...interaction,
      vendorName: "Elite Properties Sdn Bhd",
      messages: generateMessages(interaction),
      bookingDetails:
        interaction.type === "BOOKING"
          ? {
              startDate: new Date(
                Date.now() + 7 * 86_400_000,
              ).toISOString(),
              endDate: new Date(
                Date.now() + 14 * 86_400_000,
              ).toISOString(),
              quantity: 1,
              notes: "Weekend viewing preferred",
            }
          : undefined,
      metadata: {
        source: interaction.source,
        userAgent: "Mozilla/5.0",
        ipCountry: "MY",
      },
    };

    return HttpResponse.json(mockSuccessResponse(detail));
  }),

  // PATCH /interactions/:id/status — update status
  http.patch(`${API_BASE}/interactions/:id/status`, async ({ params, request }) => {
    await delay(300);

    const id = params.id as string;
    const interaction = MOCK_INTERACTIONS.find((i) => i.id === id);

    if (!interaction) {
      return HttpResponse.json(
        mockErrorResponse("INTERACTION_NOT_FOUND", "Interaction not found"),
        { status: 404 },
      );
    }

    const body = (await request.json()) as { status: string };
    const validNext = VALID_TRANSITIONS[interaction.status] ?? [];

    if (!validNext.includes(body.status)) {
      return HttpResponse.json(
        mockErrorResponse(
          "INVALID_STATUS_TRANSITION",
          `Cannot transition from ${interaction.status} to ${body.status}`,
        ),
        { status: 422 },
      );
    }

    // Apply the status change in mock data
    (interaction as { status: string }).status = body.status;
    (interaction as { updatedAt: string }).updatedAt = mockTimestamp();

    return HttpResponse.json(
      mockSuccessResponse({
        ...interaction,
        vendorName: "Elite Properties Sdn Bhd",
        messages: generateMessages(interaction as (typeof MOCK_INTERACTIONS)[0]),
      }),
    );
  }),

  // POST /interactions/:id/messages — send a message
  http.post(
    `${API_BASE}/interactions/:id/messages`,
    async ({ params, request }) => {
      await delay(300);

      const id = params.id as string;
      const interaction = MOCK_INTERACTIONS.find((i) => i.id === id);

      if (!interaction) {
        return HttpResponse.json(
          mockErrorResponse("INTERACTION_NOT_FOUND", "Interaction not found"),
          { status: 404 },
        );
      }

      const body = (await request.json()) as { content: string };

      if (!body.content || body.content.trim().length === 0) {
        return HttpResponse.json(
          mockErrorResponse(
            "VALIDATION_ERROR",
            "Message content is required",
            [{ field: "content", code: "required", message: "Message content cannot be empty" }],
          ),
          { status: 422 },
        );
      }

      const newMessage = {
        id: `msg-${id}-${Date.now()}`,
        interactionId: id,
        content: body.content,
        senderId: "vendor-001",
        senderName: "Property Agent",
        senderRole: "VENDOR" as const,
        createdAt: mockTimestamp(),
      };

      // Update message count
      (interaction as { messageCount: number }).messageCount += 1;
      (interaction as { lastMessage: string }).lastMessage = body.content;
      (interaction as { updatedAt: string }).updatedAt = mockTimestamp();

      return HttpResponse.json(mockSuccessResponse(newMessage));
    },
  ),
];
