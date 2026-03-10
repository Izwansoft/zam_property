// =============================================================================
// Partner Listings — Client content component (moderation view)
// =============================================================================
// Uses AdminListingTable for moderation capabilities (publish, unpublish,
// expire, archive, feature). The admin endpoint is scoped to the current
// partner via the X-Partner-ID header automatically.
// Reads selectedVertical from the vertical context store so that the
// sidebar VerticalSwitcher actually filters the listing table.
// =============================================================================

"use client";

import { PageHeader } from "@/components/common/page-header";
import { AdminListingTable } from "@/modules/admin/components/admin-listing-table";
import { useVerticalContextStore } from "@/modules/vertical/store/vertical-context-store";

export function PartnerListingsContent() {
  const selectedVertical = useVerticalContextStore((s) => s.selectedVertical);

  return (
    <div className="space-y-6">
      <PageHeader
        title="All Listings"
        description="View submitted listings and approve them by publishing from the row actions menu."
      />

      <AdminListingTable
        basePath="/dashboard/partner/listings"
        verticalType={selectedVertical}
      />
    </div>
  );
}
