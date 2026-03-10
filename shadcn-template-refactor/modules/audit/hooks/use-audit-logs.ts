// =============================================================================
// useAuditLogs — Paginated audit log list
// =============================================================================
// GET /api/v1/audit/logs — with filters and pagination
// Response format: { data: [...], meta: { page, pageSize, totalItems, totalPages } }
// =============================================================================

"use client";

import { useApiPaginatedQuery } from "@/hooks/use-api-query";
import { queryKeys } from "@/lib/query";
import type { AuditLogEntry, AuditLogFilters } from "../types";

/**
 * Fetch paginated audit logs with optional filters.
 * Backend enforces partner scoping via JWT.
 */
export function useAuditLogs(filters: AuditLogFilters) {
  const { page, pageSize, ...rest } = filters;

  // Build clean params — omit undefined values
  const params: Record<string, unknown> = { page, pageSize };
  if (rest.actorId) params.actorId = rest.actorId;
  if (rest.actorType) params.actorType = rest.actorType;
  if (rest.actionType) params.actionType = rest.actionType;
  if (rest.targetType) params.targetType = rest.targetType;
  if (rest.targetId) params.targetId = rest.targetId;
  if (rest.startDate) params.startDate = rest.startDate;
  if (rest.endDate) params.endDate = rest.endDate;

  return useApiPaginatedQuery<AuditLogEntry>({
    queryKey: queryKeys.audit.list(params),
    path: "/audit/logs",
    params: params as Record<string, unknown> & {
      page?: number;
      pageSize?: number;
    },
    format: "B",
    staleTime: 30 * 1000, // 30s — audit data changes frequently
  });
}
