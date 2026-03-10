// =============================================================================
// useAuditLogsByTarget — Audit logs for a specific entity
// =============================================================================
// GET /api/v1/audit/target/:targetType/:targetId
// =============================================================================

"use client";

import { useApiPaginatedQuery } from "@/hooks/use-api-query";
import { queryKeys } from "@/lib/query";
import type { AuditLogEntry } from "../types";

export interface UseAuditLogsByTargetParams {
  targetType: string;
  targetId: string;
  page?: number;
  pageSize?: number;
}

/**
 * Fetch all audit logs for a specific target entity.
 * Used in contextual "View Audit History" panels.
 */
export function useAuditLogsByTarget({
  targetType,
  targetId,
  page = 1,
  pageSize = 20,
}: UseAuditLogsByTargetParams) {
  return useApiPaginatedQuery<AuditLogEntry>({
    queryKey: queryKeys.audit.byTarget(targetType, targetId, { page, pageSize }),
    path: `/audit/target/${targetType}/${targetId}`,
    params: { page, pageSize },
    format: "B",
    enabled: !!targetType && !!targetId,
    staleTime: 30 * 1000,
  });
}
