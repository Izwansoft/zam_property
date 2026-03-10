// =============================================================================
// Vendor Create Listing — Client content component
// =============================================================================

"use client";

import { PageHeader } from "@/components/common/page-header";
import { ListingForm } from "@/modules/listing/components/listing-form";

export function VendorCreateListingContent() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Create New Listing"
        description="Follow the steps below to create a new property listing."
      />

      <ListingForm
        portal="vendor"
        basePath="/dashboard/vendor/listings"
      />
    </div>
  );
}
