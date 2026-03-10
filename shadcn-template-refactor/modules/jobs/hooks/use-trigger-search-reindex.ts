// =============================================================================
// useTriggerSearchReindex — Trigger full search reindex
// =============================================================================
// POST /api/v1/admin/bulk/search/reindex
// =============================================================================

"use client";

import { useApiMutation } from "@/hooks/use-api-mutation";
import { queryKeys } from "@/lib/query";
import type { BulkReindexDto, BulkOperationResult } from "../types";

/**
 * Trigger a full search reindex.
 * Optionally filter by vertical type or run as dry run.
 */
export function useTriggerSearchReindex() {
  return useApiMutation<BulkOperationResult, BulkReindexDto>({
    path: "/admin/bulk/search/reindex",
    method: "POST",
    invalidateKeys: [queryKeys.jobs.all],
  });
}
