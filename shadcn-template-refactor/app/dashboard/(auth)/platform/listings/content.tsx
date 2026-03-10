// =============================================================================
// Platform Listing Moderation — Client Content
// =============================================================================
// Global listing management for Platform Admin (SUPER_ADMIN).
// Shows ALL listings across ALL partners with partner column visible.
// =============================================================================

"use client";

import { PageHeader } from "@/components/common/page-header";
import { AdminListingTable } from "@/modules/admin/components/admin-listing-table";

export function PlatformListingsContent() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Listing Moderation"
        description="Review and moderate all listings across all partners. Publish, unpublish, expire, archive, or feature listings."
      />

      <AdminListingTable
        showPartner
        basePath="/dashboard/platform/listings"
      />
    </div>
  );
}
