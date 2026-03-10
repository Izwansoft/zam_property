// =============================================================================
// useAuditLogsByActor — Audit logs for a specific actor (user)
// =============================================================================
// GET /api/v1/audit/actor/:actorId
// =============================================================================

"use client";

import { useApiPaginatedQuery } from "@/hooks/use-api-query";
import { queryKeys } from "@/lib/query";
import type { AuditLogEntry } from "../types";

export interface UseAuditLogsByActorParams {
  actorId: string;
  page?: number;
  pageSize?: number;
}

/**
 * Fetch all audit logs for a specific actor (user).
 */
export function useAuditLogsByActor({
  actorId,
  page = 1,
  pageSize = 20,
}: UseAuditLogsByActorParams) {
  return useApiPaginatedQuery<AuditLogEntry>({
    queryKey: queryKeys.audit.byActor(actorId, { page, pageSize }),
    path: `/audit/actor/${actorId}`,
    params: { page, pageSize },
    format: "B",
    enabled: !!actorId,
    staleTime: 30 * 1000,
  });
}
