// =============================================================================
// Vendor Edit Listing — Client content component
// =============================================================================

"use client";

import { useParams } from "next/navigation";

import { PageHeader } from "@/components/common/page-header";
import { useListing } from "@/modules/listing/hooks/use-listing";
import { ListingForm, ListingFormSkeleton } from "@/modules/listing/components/listing-form";

export function VendorEditListingContent() {
  const params = useParams<{ id: string }>();
  const { data: listing, isLoading, error } = useListing(params.id);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Edit Listing"
          description="Loading listing details..."
        />
        <ListingFormSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border border-destructive/50 bg-destructive/5 p-6 text-center">
        <h2 className="text-lg font-semibold text-destructive">
          Failed to load listing
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="rounded-md border bg-muted/50 p-6 text-center">
        <h2 className="text-lg font-semibold">Listing not found</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          The listing you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Listing"
        description={`Editing: ${listing.title}`}
      />

      <ListingForm
        listing={listing}
        portal="vendor"
        basePath="/dashboard/vendor/listings"
      />
    </div>
  );
}
