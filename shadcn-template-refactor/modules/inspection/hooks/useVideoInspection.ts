// =============================================================================
// useVideoInspection — TanStack Query hooks for video inspection flow
// =============================================================================
// Provides hooks for: request-video, submit-video, review-video, get video URL
// API: /api/v1/inspections/:id/...
// =============================================================================

"use client";

import { useApiQuery } from "@/hooks/use-api-query";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { queryKeys } from "@/lib/query";
import { usePartnerId } from "@/modules/partner";
import type {
  Inspection,
  RequestVideoDto,
  SubmitVideoDto,
  SubmitVideoResponse,
  ReviewVideoDto,
  InspectionVideoUrlResponse,
} from "../types";

// ---------------------------------------------------------------------------
// Request video inspection (Owner action)
// ---------------------------------------------------------------------------

/**
 * Owner requests the tenant to submit a video inspection.
 * POST /api/v1/inspections/:id/request-video
 */
export function useRequestVideo(inspectionId: string) {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiMutation<Inspection, RequestVideoDto>({
    path: `/inspections/${inspectionId}/request-video`,
    method: "POST",
    invalidateKeys: [
      queryKeys.inspections.all(partnerKey),
      queryKeys.inspections.detail(partnerKey, inspectionId),
    ],
  });
}

// ---------------------------------------------------------------------------
// Submit video inspection (Tenant action)
// ---------------------------------------------------------------------------

/**
 * Tenant submits a video for inspection.
 * Returns a presigned upload URL for the actual file upload.
 * POST /api/v1/inspections/:id/submit-video
 */
export function useSubmitVideo(inspectionId: string) {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiMutation<SubmitVideoResponse, SubmitVideoDto>({
    path: `/inspections/${inspectionId}/submit-video`,
    method: "POST",
    invalidateKeys: [
      queryKeys.inspections.all(partnerKey),
      queryKeys.inspections.detail(partnerKey, inspectionId),
    ],
  });
}

// ---------------------------------------------------------------------------
// Review video inspection (Owner action)
// ---------------------------------------------------------------------------

/**
 * Owner reviews the submitted video — approve or request redo.
 * POST /api/v1/inspections/:id/review-video
 */
export function useReviewVideo(inspectionId: string) {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiMutation<Inspection, ReviewVideoDto>({
    path: `/inspections/${inspectionId}/review-video`,
    method: "POST",
    invalidateKeys: [
      queryKeys.inspections.all(partnerKey),
      queryKeys.inspections.detail(partnerKey, inspectionId),
    ],
  });
}

// ---------------------------------------------------------------------------
// Get video presigned download URL
// ---------------------------------------------------------------------------

/**
 * Fetch the presigned URL for downloading/streaming the inspection video.
 * GET /api/v1/inspections/:id/video
 */
export function useInspectionVideo(inspectionId: string | undefined) {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiQuery<InspectionVideoUrlResponse>({
    queryKey: [
      ...queryKeys.inspections.detail(partnerKey, inspectionId ?? ""),
      "video",
    ],
    path: `/inspections/${inspectionId}/video`,
    enabled: !!partnerId && !!inspectionId,
  });
}
