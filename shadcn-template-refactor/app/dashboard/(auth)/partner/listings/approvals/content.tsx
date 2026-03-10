"use client";

import { PageHeader } from "@/components/common/page-header";
import { AdminListingTable } from "@/modules/admin/components/admin-listing-table";
import { useVerticalContextStore } from "@/modules/vertical/store/vertical-context-store";

export function PartnerListingApprovalsContent() {
  const selectedVertical = useVerticalContextStore((s) => s.selectedVertical);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Approval Queue"
        description="Review submitted draft listings and approve them by publishing from row actions."
      />

      <AdminListingTable
        basePath="/dashboard/partner/listings"
        verticalType={selectedVertical}
        status="DRAFT"
      />
    </div>
  );
}
