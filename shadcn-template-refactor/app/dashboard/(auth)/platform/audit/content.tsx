// =============================================================================
// Platform Audit Logs — Client Content
// =============================================================================
// Global audit log viewer for Platform Admin (SUPER_ADMIN).
// Reads initial filters from URL search params when present
// (e.g. ?targetType=listing&targetId=xxx from contextual links).
// =============================================================================

"use client";

import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/common/page-header";
import { AuditLogList } from "@/modules/audit/components/audit-log-list";
import type { AuditLogFilters } from "@/modules/audit/types";

export function PlatformAuditContent() {
  const searchParams = useSearchParams();

  // Parse initial filters from URL (set by ViewAuditHistoryLink)
  const initialFilters: Partial<AuditLogFilters> = {};
  const targetType = searchParams.get("targetType");
  const targetId = searchParams.get("targetId");
  const actionType = searchParams.get("actionType");
  const actorId = searchParams.get("actorId");

  if (targetType) initialFilters.targetType = targetType;
  if (targetId) initialFilters.targetId = targetId;
  if (actionType) initialFilters.actionType = actionType;
  if (actorId) initialFilters.actorId = actorId;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Logs"
        description="Immutable record of all system actions. Filter by action, target, actor, or date range."
      />

      <AuditLogList initialFilters={initialFilters} />
    </div>
  );
}
