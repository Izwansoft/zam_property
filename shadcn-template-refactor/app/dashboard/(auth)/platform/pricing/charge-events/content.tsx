// =============================================================================
// Charge Events — Client Content
// =============================================================================

"use client";

import { PageHeader } from "@/components/common/page-header";
import { ChargeEventsList } from "@/modules/pricing/components/charge-events-list";

export function ChargeEventsContent() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Charge Events"
        description="Read-only view of all billing charge events. Filter by partner, vendor, type, status, or date range."
      />

      <ChargeEventsList />
    </div>
  );
}
