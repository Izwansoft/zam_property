// =============================================================================
// MSW Handlers — Media domain mock handlers
// =============================================================================
// Mocks the presigned URL flow, upload confirmation, reorder, set primary,
// and delete endpoints.
// =============================================================================

import { http, HttpResponse, delay } from "msw";
import { mockSuccessResponse, mockErrorResponse, mockTimestamp, nextId } from "../utils";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000/api/v1";

// ---------------------------------------------------------------------------
// In-memory media store (simulates confirmed media)
// ---------------------------------------------------------------------------

interface MockMedia {
  id: string;
  partnerId: string;
  entityId?: string;
  entityType?: string;
  filename: string;
  originalFilename: string;
  mimeType: string;
  size: number;
  mediaType: "IMAGE" | "VIDEO" | "DOCUMENT";
  cdnUrl: string;
  thumbnailUrl?: string;
  sortOrder: number;
  isPrimary: boolean;
  altText?: string;
  width?: number;
  height?: number;
  createdAt: string;
  updatedAt: string;
}

const MOCK_IMAGES = [
  "property-exterior-1.jpg",
  "property-interior-living.jpg",
  "property-kitchen.jpg",
  "property-bedroom-master.jpg",
  "property-bathroom.jpg",
  "property-balcony-view.jpg",
  "property-pool-area.jpg",
  "property-garden.jpg",
];

// Pre-populate some media items for testing
const mediaStore: MockMedia[] = MOCK_IMAGES.map((filename, idx) => ({
  id: `media-${String(idx + 1).padStart(3, "0")}`,
  partnerId: "partner-001",
  entityId: "listing-001",
  entityType: "listing",
  filename: `${Date.now()}-${filename}`,
  originalFilename: filename,
  mimeType: "image/jpeg",
  size: Math.floor(Math.random() * 5_000_000) + 500_000,
  mediaType: "IMAGE" as const,
  cdnUrl: `https://cdn.example.com/media/${filename}`,
  thumbnailUrl: `https://cdn.example.com/media/thumb/${filename}`,
  sortOrder: idx,
  isPrimary: idx === 0,
  altText: filename.replace(/[-_.]/g, " ").replace(/\bjpg\b/gi, "").trim(),
  width: 1920,
  height: 1080,
  createdAt: mockTimestamp(30 - idx),
  updatedAt: mockTimestamp(idx),
}));

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

export const mediaHandlers = [
  // -----------------------------------------------------------------------
  // POST /media/presigned-url — Request a presigned upload URL
  // -----------------------------------------------------------------------
  http.post(`${API_BASE}/media/presigned-url`, async ({ request }) => {
    await delay(300);

    const body = (await request.json()) as {
      filename: string;
      mimeType: string;
      size: number;
      mediaType: string;
      entityType?: string;
      entityId?: string;
    };

    // Validate required fields
    if (!body.filename || !body.mimeType || !body.size || !body.mediaType) {
      return HttpResponse.json(
        mockErrorResponse("VALIDATION_ERROR", "Missing required fields", [
          { field: "filename", code: "REQUIRED", message: "Filename is required" },
        ]),
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    if (body.size > 10 * 1024 * 1024) {
      return HttpResponse.json(
        mockErrorResponse("VALIDATION_ERROR", "File too large", [
          {
            field: "size",
            code: "MAX_SIZE",
            message: "File exceeds maximum size of 10 MB",
          },
        ]),
        { status: 400 }
      );
    }

    const id = nextId();
    const safeFilename = `${Date.now()}-${body.filename.replace(/[^a-zA-Z0-9.-]/g, "_")}`;

    const response = {
      id,
      uploadUrl: `https://s3.example.com/uploads/${safeFilename}?X-Amz-Signature=mock`,
      cdnUrl: `https://cdn.example.com/media/${safeFilename}`,
      thumbnailUrl: body.mediaType === "IMAGE"
        ? `https://cdn.example.com/media/thumb/${safeFilename}`
        : undefined,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    };

    return HttpResponse.json(mockSuccessResponse(response));
  }),

  // -----------------------------------------------------------------------
  // PATCH /media/:id/confirm — Confirm upload completion
  // -----------------------------------------------------------------------
  http.patch(`${API_BASE}/media/:id/confirm`, async ({ params, request }) => {
    await delay(200);

    const id = params.id as string;
    const body = (await request.json()) as {
      width?: number;
      height?: number;
      altText?: string;
    };

    // Check if media already exists (re-confirm)
    const existing = mediaStore.find((m) => m.id === id);
    if (existing) {
      if (body.width) existing.width = body.width;
      if (body.height) existing.height = body.height;
      if (body.altText) existing.altText = body.altText;
      existing.updatedAt = new Date().toISOString();
      return HttpResponse.json(mockSuccessResponse(existing));
    }

    // Create new confirmed media entry
    const newMedia: MockMedia = {
      id,
      partnerId: "partner-001",
      filename: `${id}-confirmed-file`,
      originalFilename: `uploaded-file-${id}`,
      mimeType: "image/jpeg",
      size: 1_000_000,
      mediaType: "IMAGE",
      cdnUrl: `https://cdn.example.com/media/${id}`,
      thumbnailUrl: `https://cdn.example.com/media/thumb/${id}`,
      sortOrder: mediaStore.length,
      isPrimary: mediaStore.length === 0,
      altText: body.altText,
      width: body.width ?? 1920,
      height: body.height ?? 1080,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mediaStore.push(newMedia);

    return HttpResponse.json(mockSuccessResponse(newMedia));
  }),

  // -----------------------------------------------------------------------
  // DELETE /media/:id — Delete a media item
  // -----------------------------------------------------------------------
  http.delete(`${API_BASE}/media/:id`, async ({ params }) => {
    await delay(200);

    const id = params.id as string;
    const idx = mediaStore.findIndex((m) => m.id === id);

    if (idx === -1) {
      return HttpResponse.json(
        mockErrorResponse("NOT_FOUND", `Media ${id} not found`),
        { status: 404 }
      );
    }

    mediaStore.splice(idx, 1);

    // Re-calculate sort orders
    mediaStore.forEach((m, i) => {
      m.sortOrder = i;
    });

    return HttpResponse.json(mockSuccessResponse({ success: true }));
  }),

  // -----------------------------------------------------------------------
  // PATCH /media/reorder — Reorder media items
  // -----------------------------------------------------------------------
  http.patch(`${API_BASE}/media/reorder`, async ({ request }) => {
    await delay(200);

    const body = (await request.json()) as { mediaIds: string[] };

    if (!body.mediaIds || !Array.isArray(body.mediaIds)) {
      return HttpResponse.json(
        mockErrorResponse("VALIDATION_ERROR", "mediaIds array is required"),
        { status: 400 }
      );
    }

    // Reorder in-memory store
    body.mediaIds.forEach((id, idx) => {
      const media = mediaStore.find((m) => m.id === id);
      if (media) {
        media.sortOrder = idx;
        media.updatedAt = new Date().toISOString();
      }
    });

    return HttpResponse.json(mockSuccessResponse({ success: true }));
  }),

  // -----------------------------------------------------------------------
  // PATCH /media/:id/primary — Set primary image
  // -----------------------------------------------------------------------
  http.patch(`${API_BASE}/media/:id/primary`, async ({ params }) => {
    await delay(200);

    const id = params.id as string;
    const media = mediaStore.find((m) => m.id === id);

    if (!media) {
      return HttpResponse.json(
        mockErrorResponse("NOT_FOUND", `Media ${id} not found`),
        { status: 404 }
      );
    }

    // Clear existing primary
    mediaStore.forEach((m) => {
      m.isPrimary = false;
    });

    media.isPrimary = true;
    media.updatedAt = new Date().toISOString();

    return HttpResponse.json(mockSuccessResponse(media));
  }),

  // -----------------------------------------------------------------------
  // GET /media?entityType=listing&entityId=:id — List media for an entity
  // -----------------------------------------------------------------------
  http.get(`${API_BASE}/media`, async ({ request }) => {
    await delay(200);

    const url = new URL(request.url);
    const entityType = url.searchParams.get("entityType");
    const entityId = url.searchParams.get("entityId");

    let results = [...mediaStore];

    if (entityType) {
      results = results.filter((m) => m.entityType === entityType);
    }
    if (entityId) {
      results = results.filter((m) => m.entityId === entityId);
    }

    // Sort by sortOrder
    results.sort((a, b) => a.sortOrder - b.sortOrder);

    return HttpResponse.json(mockSuccessResponse(results));
  }),
];
