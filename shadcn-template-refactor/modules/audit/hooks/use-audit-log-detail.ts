// =============================================================================
// useAuditLogDetail — Single audit log entry
// =============================================================================
// GET /api/v1/audit/logs/:id
// =============================================================================

"use client";

import { useApiQuery } from "@/hooks/use-api-query";
import { queryKeys } from "@/lib/query";
import type { AuditLogEntry } from "../types";

/**
 * Fetch a single audit log entry by ID.
 * Returns full detail including oldValue, newValue, metadata, IP, user-agent.
 */
export function useAuditLogDetail(logId: string | null) {
  return useApiQuery<AuditLogEntry>({
    queryKey: queryKeys.audit.detail(logId ?? ""),
    path: `/audit/logs/${logId}`,
    enabled: !!logId,
    staleTime: 5 * 60 * 1000, // 5 min — audit records are immutable
  });
}
