// =============================================================================
// useConfirmUpload — Confirm a completed S3 upload with the backend
// =============================================================================

"use client";

import { useApiMutation } from "@/hooks/use-api-mutation";
import { queryKeys } from "@/lib/query";
import { usePartnerId } from "@/modules/partner";
import type { ConfirmUploadDto, MediaItem } from "../types";

/**
 * Confirm that a file has been successfully uploaded to S3/MinIO.
 * This tells the backend to mark the media record as CONFIRMED.
 *
 * @example
 * ```tsx
 * const confirm = useConfirmUpload();
 * confirm.mutate({ mediaId: "media-001", storageKey: "media/partner-id/uuid.jpg" });
 * ```
 */
export function useConfirmUpload() {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiMutation<MediaItem, ConfirmUploadDto>({
    path: (variables) => `/media/${variables.mediaId}/confirm-upload`,
    method: "POST",
    invalidateKeys: [queryKeys.media.all(partnerKey)],
  });
}
