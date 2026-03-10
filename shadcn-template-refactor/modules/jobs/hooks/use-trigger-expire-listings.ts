// =============================================================================
// useTriggerExpireListings — Expire stale listings
// =============================================================================
// POST /api/v1/admin/bulk/listings/expire
// =============================================================================

"use client";

import { useApiMutation } from "@/hooks/use-api-mutation";
import { queryKeys } from "@/lib/query";
import type { BulkExpireDto, BulkOperationResult } from "../types";

/**
 * Trigger expiration of stale listings.
 * Optionally specify daysStale threshold or run as dry run.
 */
export function useTriggerExpireListings() {
  return useApiMutation<BulkOperationResult, BulkExpireDto>({
    path: "/admin/bulk/listings/expire",
    method: "POST",
    invalidateKeys: [queryKeys.jobs.all],
  });
}
