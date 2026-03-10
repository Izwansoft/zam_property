// =============================================================================
// Partner Audit Logs — Client Content
// =============================================================================
// Partner-scoped audit log viewer for Partner Admin (PARTNER_ADMIN).
// Backend automatically filters by partner via JWT X-Partner-ID header.
// =============================================================================

"use client";

import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/common/page-header";
import { AuditLogList } from "@/modules/audit/components/audit-log-list";
import type { AuditLogFilters } from "@/modules/audit/types";

export function PartnerAuditContent() {
  const searchParams = useSearchParams();

  // Parse initial filters from URL
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
        description="Audit trail for all actions within your partner. Records are immutable and cannot be modified."
      />

      <AuditLogList initialFilters={initialFilters} />
    </div>
  );
}
