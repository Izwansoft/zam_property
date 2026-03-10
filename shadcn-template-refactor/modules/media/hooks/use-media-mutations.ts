// =============================================================================
// Media Mutations — Delete, Reorder, Set Primary
// =============================================================================

"use client";

import { useApiMutation } from "@/hooks/use-api-mutation";
import { queryKeys } from "@/lib/query";
import { usePartnerId } from "@/modules/partner";
import type { MediaItem, ReorderMediaDto, SetPrimaryMediaDto } from "../types";

// ---------------------------------------------------------------------------
// useDeleteMedia
// ---------------------------------------------------------------------------

/**
 * Delete (logically) a media item.
 *
 * @example
 * ```tsx
 * const del = useDeleteMedia();
 * del.mutate({ id: "media-001" });
 * ```
 */
export function useDeleteMedia() {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiMutation<void, { id: string }>({
    path: (variables) => `/media/${variables.id}`,
    method: "DELETE",
    invalidateKeys: [queryKeys.media.all(partnerKey)],
  });
}

// ---------------------------------------------------------------------------
// useReorderMedia
// ---------------------------------------------------------------------------

/**
 * Reorder media items by providing the ordered list of media IDs.
 *
 * @example
 * ```tsx
 * const reorder = useReorderMedia();
 * reorder.mutate({ mediaIds: ["media-003", "media-001", "media-002"] });
 * ```
 */
export function useReorderMedia() {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiMutation<void, ReorderMediaDto>({
    path: "/media/reorder",
    method: "PATCH",
    invalidateKeys: [queryKeys.media.all(partnerKey)],
  });
}

// ---------------------------------------------------------------------------
// useSetPrimaryMedia
// ---------------------------------------------------------------------------

/**
 * Set a media item as the primary image.
 *
 * @example
 * ```tsx
 * const setPrimary = useSetPrimaryMedia();
 * setPrimary.mutate({ id: "media-002" });
 * ```
 */
export function useSetPrimaryMedia() {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiMutation<MediaItem, SetPrimaryMediaDto>({
    path: (variables) => `/media/${variables.id}/primary`,
    method: "PATCH",
    invalidateKeys: [queryKeys.media.all(partnerKey)],
  });
}
