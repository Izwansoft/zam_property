// =============================================================================
// usePresignedUrl — Request a presigned upload URL from backend
// =============================================================================

"use client";

import { useApiMutation } from "@/hooks/use-api-mutation";
import type { PresignedUrlRequest, PresignedUrlResponse } from "../types";

/**
 * Request a presigned URL for uploading a file to S3/MinIO.
 *
 * @example
 * ```tsx
 * const presign = usePresignedUrl();
 * const { uploadUrl, storageKey, mediaId } = await presign.mutateAsync({
 *   filename: "photo.jpg",
 *   mimeType: "image/jpeg",
 *   size: 1024000,
 *   ownerType: "listing",
 *   ownerId: "uuid-here",
 * });
 * ```
 */
export function usePresignedUrl() {
  return useApiMutation<PresignedUrlResponse, PresignedUrlRequest>({
    path: "/media/request-upload",
    method: "POST",
  });
}
